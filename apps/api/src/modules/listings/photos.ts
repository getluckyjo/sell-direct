import type { FetchedMedia, InboundMedia, InboundMessage } from '../messaging';
import type { StorageProvider } from '../storage';
import type { SyndicationAdapter } from '../syndication';
import type { ListingRepository } from './repository';
import type { ConversationStore } from './store';

/**
 * Deterministic inbound-photo handling — identical in scripted, shadow and
 * live modes. Photos are BYTES: they are downloaded, stored and attached by
 * code; the model never touches them (a photo burst is 5–10 concurrent
 * webhooks — racy and slow through an agent turn). The agent stays informed
 * anyway because the image row and this templated confirmation both persist
 * to the message log it reads as history.
 */
export interface PhotoIntakeDeps {
  listings: Pick<
    ListingRepository,
    'findPhotoTarget' | 'addPhoto' | 'activate' | 'getForSyndication'
  >;
  /** Function seam (not the whole adapter) — the demo injects its own. */
  fetchMedia: (media: InboundMedia) => Promise<FetchedMedia>;
  storage: StorageProvider;
  bucket: string;
  /** Photos needed before an awaiting_photos listing flips active. */
  minPhotos: number;
  /** Detects "photo sent mid-intake" for a friendlier reply. */
  intakeStore?: ConversationStore;
  syndication?: SyndicationAdapter;
  log?: (message: string, error?: unknown) => void;
}

export interface PhotoIntakeResult {
  reply: string;
  listingId?: string;
  activated?: boolean;
  photoCount?: number;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// TODO(POPIA): inbound photos may carry EXIF GPS coordinates. Stripping
// metadata on ingest needs an image-processing dependency (e.g. sharp) —
// approved-dependency decision pending; tracked in docs/POPIA-data-map.md.
export async function handleInboundPhoto(
  deps: PhotoIntakeDeps,
  message: InboundMessage,
): Promise<PhotoIntakeResult> {
  const log = deps.log ?? (() => {});
  const phone = message.from;

  const target = await deps.listings.findPhotoTarget(phone);
  if (!target) {
    const draft = await deps.intakeStore?.get(phone);
    if (draft) {
      return {
        reply:
          'Great photo! Let’s finish your listing details first — I’ll ask ' +
          'for photos right after you confirm.',
      };
    }
    return {
      reply:
        'Thanks for the photo! I don’t see a listing for it yet — reply ' +
        '"list" to put your property on the market with 0% commission.',
    };
  }

  let media: FetchedMedia;
  try {
    media = await deps.fetchMedia(message.media!);
  } catch (error) {
    log('photo download failed', error);
    return {
      reply: 'Hmm, that photo didn’t come through — please send it again.',
      listingId: target.id,
    };
  }

  if (!media.mimeType.startsWith('image/')) {
    return {
      reply:
        'I can only accept photos here (JPEG/PNG). Please send images of ' +
        'your property.',
      listingId: target.id,
    };
  }

  const ext = EXT_BY_MIME[media.mimeType] ?? 'jpg';
  // Timestamped name defends against a concurrent burst colliding.
  const path = `listings/${target.id}/${Date.now()}-${target.photoCount + 1}.${ext}`;
  await deps.storage.putObject({
    bucket: deps.bucket,
    path,
    contentType: media.mimeType,
    body: media.bytes,
  });
  let url: string | null = null;
  try {
    url = await deps.storage.getObjectUrl({ bucket: deps.bucket, path });
  } catch (error) {
    log('photo url construction failed', error);
  }
  await deps.listings.addPhoto({
    listingId: target.id,
    storagePath: path,
    url,
    mimeType: media.mimeType,
    sortOrder: target.photoCount,
  });
  const photoCount = target.photoCount + 1;

  if (target.status === 'awaiting_photos' && photoCount >= deps.minPhotos) {
    // Race-safe: activate() only returns true for one concurrent winner.
    const won = await deps.listings.activate(target.id);
    if (won) {
      try {
        const listing = await deps.listings.getForSyndication(target.id);
        if (listing && deps.syndication) {
          await deps.syndication.publish(listing);
        }
      } catch (error) {
        log('syndication publish failed', error); // never eat the user reply
      }
      return {
        reply:
          `📸 Photo saved — your listing "${target.title}" is now LIVE! 🎉 ` +
          `We’ll start finding buyers. Keep the photos coming (5–10 is ideal).\n\n` +
          `💡 Plan ahead — every Cape Town sale needs compliance certificates before transfer: ` +
          `electrical (from ~R800), water installation (Cape Town-only, from ~R500, must be fresh ` +
          `for each transfer), gas (from ~R650), electric fence (from ~R600) and usually a beetle ` +
          `certificate (from ~R400). Repairs are extra. Reply CERTS and we’ll book trusted ` +
          `inspectors early — sellers who sort these now avoid weeks of delay later.`,
        listingId: target.id,
        activated: true,
        photoCount,
      };
    }
  }

  return {
    reply: `📸 Photo ${photoCount} added to "${target.title}". Send more anytime.`,
    listingId: target.id,
    activated: false,
    photoCount,
  };
}
