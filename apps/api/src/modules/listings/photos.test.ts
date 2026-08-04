import { describe, expect, it, vi } from 'vitest';
import { handleInboundPhoto, type PhotoIntakeDeps } from './photos';
import { handleDescriptionMessage } from './description';
import { createInMemoryOnboardingStore } from './onboarding';
import { createInMemoryConversationStore } from './store';
import type { InboundMessage } from '../messaging';
import type { StorageProvider } from '../storage';
import type { PhotoTarget } from './repository';

function imageMessage(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    waMessageId: 'wamid.img.1',
    from: '+27820001111',
    to: 'business',
    type: 'image',
    media: { id: 'media-1', mimeType: 'image/jpeg' },
    raw: {},
    ...overrides,
  };
}

function fakeStorage(): StorageProvider & { objects: string[] } {
  const objects: string[] = [];
  return {
    objects,
    async putObject({ path }) {
      objects.push(path);
      return { path };
    },
    async getObjectUrl({ bucket, path }) {
      return `https://cdn.example/${bucket}/${path}`;
    },
    async getUploadUrl() {
      throw new Error('unused');
    },
  };
}

function makeDeps(
  target: PhotoTarget | null,
  overrides: Partial<PhotoIntakeDeps> = {},
) {
  const storage = fakeStorage();
  const photos: unknown[] = [];
  const activate = vi.fn(async () => target?.status === 'awaiting_photos');
  const publish = vi.fn(async () => ({
    ref: 'p24-stub-x',
    portal: 'property24',
  }));
  const deps: PhotoIntakeDeps = {
    listings: {
      findPhotoTarget: vi.fn(async () => target),
      addPhoto: vi.fn(async (input) => {
        photos.push(input);
        return { id: `photo_${photos.length}` };
      }),
      activate,
      getForSyndication: vi.fn(async () => ({
        id: target?.id ?? 'x',
        title: target?.title ?? 'x',
        description: null,
        suburb: 'Mowbray',
        city: 'Cape Town',
        priceZar: 5_000_000,
        bedrooms: 4,
        bathrooms: 2,
        photoUrls: ['https://cdn.example/1.jpg'],
      })),
    },
    fetchMedia: vi.fn(async () => ({
      bytes: Buffer.from('jpeg'),
      mimeType: 'image/jpeg',
    })),
    storage,
    bucket: 'listing-photos',
    minPhotos: 1,
    syndication: { publish },
    ...overrides,
  };
  return { deps, storage, photos, activate, publish };
}

describe('handleInboundPhoto', () => {
  it('attaches the first photo, activates the listing and fires syndication', async () => {
    const { deps, publish, storage } = makeDeps({
      id: 'l1',
      title: '4-bed in Mowbray',
      status: 'awaiting_photos',
      photoCount: 0,
    });

    const result = await handleInboundPhoto(deps, imageMessage());

    expect(result.activated).toBe(true);
    expect(result.reply).toMatch(/now LIVE/i);
    // The certificate pricing stays in the body; the keywords are now a menu.
    expect(result.reply).toMatch(/electrical/i);
    const rows =
      result.options?.kind === 'list' ? result.options.sections[0].rows : [];
    expect(rows.map((r) => r.id)).toEqual([
      'CERTS',
      'COVER',
      'MOVE',
      'CONSULT',
      'NOTHING',
    ]);
    expect(storage.objects[0]).toMatch(/^listings\/l1\/\d+-1\.jpg$/);
    expect(publish).toHaveBeenCalledOnce();
  });

  it('subsequent photos just count up (no re-activation, no re-syndication)', async () => {
    const { deps, publish } = makeDeps({
      id: 'l1',
      title: '4-bed in Mowbray',
      status: 'active',
      photoCount: 3,
    });

    const result = await handleInboundPhoto(deps, imageMessage());

    expect(result.activated).toBe(false);
    expect(result.reply).toMatch(/Photo 4 added/);
    expect(publish).not.toHaveBeenCalled();
  });

  it('does not fire syndication when losing the activation race', async () => {
    const { deps, publish } = makeDeps({
      id: 'l1',
      title: 't',
      status: 'awaiting_photos',
      photoCount: 0,
    });
    (deps.listings.activate as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );

    const result = await handleInboundPhoto(deps, imageMessage());

    expect(result.reply).toMatch(/Photo 1 added/);
    expect(publish).not.toHaveBeenCalled();
  });

  it('photo mid-intake gets a friendly deferral', async () => {
    const intakeStore = createInMemoryConversationStore();
    await intakeStore.set('+27820001111', {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
    });
    const { deps } = makeDeps(null, { intakeStore });

    const result = await handleInboundPhoto(deps, imageMessage());

    expect(result.reply).toMatch(/finish your listing details first/i);
  });

  it('photo with no listing at all points to "list"', async () => {
    const { deps } = makeDeps(null);
    const result = await handleInboundPhoto(deps, imageMessage());
    expect(result.reply).toMatch(/reply\s+"list"/i);
  });

  it('a failed download asks the seller to resend', async () => {
    const { deps } = makeDeps(
      { id: 'l1', title: 't', status: 'awaiting_photos', photoCount: 0 },
      { fetchMedia: vi.fn(async () => Promise.reject(new Error('410 gone'))) },
    );
    const result = await handleInboundPhoto(deps, imageMessage());
    expect(result.reply).toMatch(/send it again/i);
  });

  it('non-image media is politely declined', async () => {
    const { deps } = makeDeps(
      { id: 'l1', title: 't', status: 'awaiting_photos', photoCount: 0 },
      {
        fetchMedia: vi.fn(async () => ({
          bytes: Buffer.from('pdf'),
          mimeType: 'application/pdf',
        })),
      },
    );
    const result = await handleInboundPhoto(deps, imageMessage());
    expect(result.reply).toMatch(/only accept photos/i);
  });
});

describe('handleDescriptionMessage', () => {
  function setup() {
    const onboarding = createInMemoryOnboardingStore();
    const setDescription = vi.fn(async () => {});
    return { onboarding, setDescription };
  }

  it('is a no-op without onboarding state', async () => {
    const { onboarding, setDescription } = setup();
    const result = await handleDescriptionMessage(
      { onboarding, setDescription },
      { phone: '+27820001111', text: 'lovely home' },
    );
    expect(result.handled).toBe(false);
    expect(setDescription).not.toHaveBeenCalled();
  });

  it('stores the seller text verbatim and clears the state', async () => {
    const { onboarding, setDescription } = setup();
    await onboarding.set('+27820001111', { listingId: 'l1' });

    const result = await handleDescriptionMessage(
      { onboarding, setDescription },
      { phone: '+27820001111', text: 'Sunny family home near schools.' },
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toMatch(/description saved/i);
    expect(setDescription).toHaveBeenCalledWith(
      'l1',
      'Sunny family home near schools.',
    );
    expect(await onboarding.get('+27820001111')).toBeNull();
  });

  it('SKIP clears the state without writing', async () => {
    const { onboarding, setDescription } = setup();
    await onboarding.set('+27820001111', { listingId: 'l1' });

    const result = await handleDescriptionMessage(
      { onboarding, setDescription },
      { phone: '+27820001111', text: 'skip' },
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toMatch(/no problem/i);
    expect(setDescription).not.toHaveBeenCalled();
    expect(await onboarding.get('+27820001111')).toBeNull();
  });

  it('the "list" trigger falls through (fresh intake wins)', async () => {
    const { onboarding, setDescription } = setup();
    await onboarding.set('+27820001111', { listingId: 'l1' });

    const result = await handleDescriptionMessage(
      { onboarding, setDescription },
      { phone: '+27820001111', text: 'list my other flat' },
    );

    expect(result.handled).toBe(false);
    expect(setDescription).not.toHaveBeenCalled();
    expect(await onboarding.get('+27820001111')).toBeNull(); // abandoned
  });
});

describe('description drafting ("Write it for me")', () => {
  function setup(
    draft: string | null = 'A two-bedroom apartment in Sea Point.',
  ) {
    const onboarding = createInMemoryOnboardingStore();
    const setDescription = vi.fn(async () => {});
    const drafter = { draft: vi.fn(async () => draft) };
    const listingFacts = vi.fn(async () => ({
      title: '2-bed apartment in Sea Point',
      propertyType: 'apartment' as const,
      suburb: 'Sea Point',
      bedrooms: 2,
      bathrooms: 1,
      priceZar: 2_100_000,
    }));
    return {
      deps: { onboarding, setDescription, drafter, listingFacts },
      onboarding,
      setDescription,
      drafter,
    };
  }

  it('drafts on DRAFT but saves nothing until the seller approves', async () => {
    const { deps, onboarding, setDescription, drafter } = setup();
    await onboarding.set('+27820001111', { listingId: 'l1' });

    const proposed = await handleDescriptionMessage(deps, {
      phone: '+27820001111',
      text: 'DRAFT',
    });

    expect(drafter.draft).toHaveBeenCalledOnce();
    expect(proposed.reply).toContain('A two-bedroom apartment in Sea Point.');
    expect(proposed.reply).toMatch(/nothing is saved/i);
    // Nothing written yet, and the state still exists to approve against.
    expect(setDescription).not.toHaveBeenCalled();
    expect((await onboarding.get('+27820001111'))?.draft).toBe(
      'A two-bedroom apartment in Sea Point.',
    );

    const approved = await handleDescriptionMessage(deps, {
      phone: '+27820001111',
      text: 'USE',
    });

    expect(setDescription).toHaveBeenCalledWith(
      'l1',
      'A two-bedroom apartment in Sea Point.',
    );
    expect(approved.reply).toMatch(/description saved/i);
    expect(await onboarding.get('+27820001111')).toBeNull();
  });

  it('USE without a pending draft is stored as the seller’s own text', async () => {
    const { deps, onboarding, setDescription } = setup();
    await onboarding.set('+27820001111', { listingId: 'l1' });

    await handleDescriptionMessage(deps, {
      phone: '+27820001111',
      text: 'Use',
    });

    expect(setDescription).toHaveBeenCalledWith('l1', 'Use');
  });

  it('a drafting failure invites the seller to type one instead', async () => {
    const { deps, onboarding, setDescription } = setup(null);
    await onboarding.set('+27820001111', { listingId: 'l1' });

    const result = await handleDescriptionMessage(deps, {
      phone: '+27820001111',
      text: 'DRAFT',
    });

    expect(result.handled).toBe(true);
    expect(result.reply).toMatch(/couldn’t draft/i);
    expect(setDescription).not.toHaveBeenCalled();
    // Still in the flow: they can retry, type, or skip.
    expect(await onboarding.get('+27820001111')).not.toBeNull();
  });

  it('a seller’s own text still wins over any pending draft', async () => {
    const { deps, onboarding, setDescription } = setup();
    await onboarding.set('+27820001111', {
      listingId: 'l1',
      draft: 'The AI version.',
    });

    await handleDescriptionMessage(deps, {
      phone: '+27820001111',
      text: 'Sunny home, walking distance to the promenade.',
    });

    expect(setDescription).toHaveBeenCalledWith(
      'l1',
      'Sunny home, walking distance to the promenade.',
    );
  });

  it('without a drafter configured, DRAFT is treated as the seller’s text', async () => {
    const onboarding = createInMemoryOnboardingStore();
    const setDescription = vi.fn(async () => {});
    await onboarding.set('+27820001111', { listingId: 'l1' });

    await handleDescriptionMessage(
      { onboarding, setDescription },
      { phone: '+27820001111', text: 'DRAFT' },
    );

    expect(setDescription).toHaveBeenCalledWith('l1', 'DRAFT');
  });
});
