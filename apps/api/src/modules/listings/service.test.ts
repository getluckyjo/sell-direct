import { describe, expect, it, vi } from 'vitest';
import { handleListingIntakeMessage } from './service';
import { createInMemoryConversationStore } from './store';
import type { IntakeFieldExtractor } from './extractor';
import type { ExtractedListingFields } from './intake';

describe('listing intake orchestrator', () => {
  it('prompts to start when there is no active conversation', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const res = await handleListingIntakeMessage(
      { store, createListing },
      { phone: '27820001111', text: 'hello' },
    );
    expect(res.reply).toMatch(/reply "list"/i);
    expect(res.fallback).toBe(true);
    expect(createListing).not.toHaveBeenCalled();
  });

  it('drives a scripted conversation that creates a listing after YES', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn().mockResolvedValue({ id: 'listing_1' });
    const deps = { store, createListing };
    const phone = '27820001111';

    const script = [
      'list',
      'Sunny 3-bed in Newlands',
      'Newlands',
      '15 Kildare Road', // the optional address, asked before the price
      '3 250 000',
      '3',
      '2',
      '90',
    ];
    let last;
    for (const text of script) {
      last = await handleListingIntakeMessage(deps, { phone, text });
    }

    // The confirm step gates publishing now.
    expect(createListing).not.toHaveBeenCalled();
    expect(last?.reply).toMatch(/reply yes/i);

    last = await handleListingIntakeMessage(deps, { phone, text: 'YES' });

    expect(createListing).toHaveBeenCalledOnce();
    expect(createListing.mock.calls[0][0]).toBe(phone);
    expect(createListing.mock.calls[0][1]).toMatchObject({
      title: 'Sunny 3-bed in Newlands',
      suburb: 'Newlands',
      address: '15 Kildare Road',
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

  it('with an extractor, the Mowbray transcript never asks a double question', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn().mockResolvedValue({ id: 'listing_2' });
    // Stub extractor keyed by message text — stands in for the LLM.
    const extractor: IntakeFieldExtractor = {
      async extract(message): Promise<ExtractedListingFields> {
        if (/4 bedroom home in mowbray/i.test(message)) {
          return { suburb: 'Mowbray', bedrooms: 4 };
        }
        return {};
      },
    };
    const deps = { store, createListing, extractor };
    const phone = '27820002222';

    const replies: string[] = [];
    for (const text of ['list', '4 bedroom home in mowbray', 'SKIP', '5000000', '2', '90', 'YES']) {
      const res = await handleListingIntakeMessage(deps, { phone, text });
      replies.push(res.reply);
    }

    // The whole transcript never contains the re-asked questions.
    expect(replies.join('\n')).not.toMatch(/which suburb|how many bedrooms/i);
    expect(createListing).toHaveBeenCalledOnce();
    expect(createListing.mock.calls[0][1]).toMatchObject({
      title: '4 bedroom home in mowbray',
      suburb: 'Mowbray',
      address: null, // skipped
      bedrooms: 4,
      bathrooms: 2,
      priceZar: 5_000_000,
    });
  });

  it('extracts from the trigger message itself and uses its remainder as title', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const extractor: IntakeFieldExtractor = {
      extract: vi.fn(async () => ({ suburb: 'Mowbray', bedrooms: 4 })),
    };
    const res = await handleListingIntakeMessage(
      { store, createListing, extractor },
      { phone: '27820003333', text: 'sell my 4 bed in Mowbray' },
    );

    // Title+suburb+beds all known → the next ask is the optional address.
    expect(res.reply).toMatch(/street address/i);
    const state = await store.get('27820003333');
    expect(state?.data).toMatchObject({
      title: '4 bed in Mowbray',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
  });

  it('skips the extractor call when nothing is editable', async () => {
    const store = createInMemoryConversationStore();
    const extract = vi.fn(async () => ({}));
    const deps = {
      store,
      createListing: vi.fn().mockResolvedValue({ id: 'x' }),
      extractor: { extract },
    };
    const phone = '27820004444';

    await handleListingIntakeMessage(deps, { phone, text: 'list' });
    expect(extract).toHaveBeenCalledTimes(1); // trigger message is extracted

    // Extractor failures never stall the flow.
    extract.mockRejectedValueOnce(new Error('llm down'));
    const res = await handleListingIntakeMessage(deps, {
      phone,
      text: 'Cosy cottage',
    });
    expect(res.reply).toMatch(/suburb/i); // flow continues scripted
  });
});
