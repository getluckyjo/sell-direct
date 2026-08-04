import type { SyndicationListing } from '../listings';

export type { SyndicationListing };

export interface SyndicationResult {
  ref: string;
  portal: string;
}

/**
 * Portal syndication seam — called when a listing flips active (first photo
 * arrived, so the listing is portal-complete). The real Property24 feed is
 * future work: it needs an agency agreement + API credentials (P24 Sync API
 * or bulk feed) that don't exist yet. Swap the stub for a real adapter when
 * they do; the calling code doesn't change.
 */
export interface SyndicationAdapter {
  publish(listing: SyndicationListing): Promise<SyndicationResult>;
}

/** Logs what WOULD be syndicated — mirrors the BetterBondReferralStub pattern. */
export class Property24SyndicationStub implements SyndicationAdapter {
  constructor(private readonly log: (message: string) => void = () => {}) {}

  async publish(listing: SyndicationListing): Promise<SyndicationResult> {
    this.log(
      `[syndication] listing ${listing.id} ready for Property24 ` +
        `(${listing.photoUrls.length} photos, description ${
          listing.description ? 'set' : 'pending'
        }) — stub, no feed sent`,
    );
    return { ref: `p24-stub-${listing.id.slice(0, 8)}`, portal: 'property24' };
  }
}
