import { describe, expect, it, vi } from 'vitest';
import { handleListingIntakeMessage } from './service';
import { createInMemoryConversationStore } from './store';

describe('listing intake orchestrator', () => {
  it('prompts to start when there is no active conversation', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const res = await handleListingIntakeMessage(
      { store, createListing },
      { phone: '27820001111', text: 'hello' },
    );
    expect(res.reply).toMatch(/reply "list"/i);
    expect(createListing).not.toHaveBeenCalled();
  });

  it('drives a scripted conversation that creates a listing', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn().mockResolvedValue({ id: 'listing_1' });
    const deps = { store, createListing };
    const phone = '27820001111';

    const script = [
      'list',
      'Sunny 3-bed in Newlands',
      'Newlands',
      '3 250 000',
      '3',
      '2',
      '90',
    ];
    let last;
    for (const text of script) {
      last = await handleListingIntakeMessage(deps, { phone, text });
    }

    expect(createListing).toHaveBeenCalledOnce();
    expect(createListing.mock.calls[0][0]).toBe(phone);
    expect(createListing.mock.calls[0][1]).toMatchObject({
      title: 'Sunny 3-bed in Newlands',
      suburb: 'Newlands',
      priceZar: 3250000,
      bedrooms: 3,
      bathrooms: 2,
      exclusivityTermDays: 90,
      tier: 'free',
    });
    expect(last?.listingId).toBe('listing_1');
    // Conversation cleared after completion.
    expect(await store.get(phone)).toBeNull();
  });
});
