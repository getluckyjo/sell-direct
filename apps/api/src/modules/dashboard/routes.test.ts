import { describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../app';
import type { ListingRepository } from '../listings';
import type { DealRepository } from '../deals';

function fakeListings(): ListingRepository {
  return {
    createFromDraft: vi.fn(),
    list: vi.fn().mockResolvedValue([{ id: 'l1', title: 'Sea Point flat' }]),
  };
}

function fakeDeals(): DealRepository {
  return {
    createOrGetEnquiryDeal: vi.fn(),
    list: vi.fn().mockResolvedValue([{ id: 'd1', status: 'enquiry' }]),
    getWithTimeline: vi
      .fn()
      .mockImplementation(async (id: string) =>
        id === 'd1' ? { id: 'd1', status: 'enquiry', events: [] } : null,
      ),
  };
}

function build(internalToken?: string) {
  return buildServer({
    listingRepository: fakeListings(),
    dealRepository: fakeDeals(),
    internalToken,
  });
}

describe('dashboard read endpoints', () => {
  it('lists listings and deals', async () => {
    const app = build();
    const listings = await app.inject({ method: 'GET', url: '/api/listings' });
    const deals = await app.inject({ method: 'GET', url: '/api/deals' });
    expect(listings.statusCode).toBe(200);
    expect(listings.json().listings).toHaveLength(1);
    expect(deals.json().deals[0].status).toBe('enquiry');
    await app.close();
  });

  it('returns a single deal with its timeline, or 404', async () => {
    const app = build();
    const found = await app.inject({ method: 'GET', url: '/api/deals/d1' });
    const missing = await app.inject({ method: 'GET', url: '/api/deals/nope' });
    expect(found.statusCode).toBe(200);
    expect(found.json().deal.id).toBe('d1');
    expect(missing.statusCode).toBe(404);
    await app.close();
  });

  it('enforces the internal token when configured', async () => {
    const app = build('secret-token');
    const noToken = await app.inject({ method: 'GET', url: '/api/deals' });
    const badToken = await app.inject({
      method: 'GET',
      url: '/api/deals',
      headers: { 'x-internal-token': 'wrong' },
    });
    const ok = await app.inject({
      method: 'GET',
      url: '/api/deals',
      headers: { 'x-internal-token': 'secret-token' },
    });
    expect(noToken.statusCode).toBe(401);
    expect(badToken.statusCode).toBe(401);
    expect(ok.statusCode).toBe(200);
    await app.close();
  });
});
