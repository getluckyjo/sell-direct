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
    expect(res.reply).toMatch(/0% commission/i);
    // The welcome menu: one tap to start, and still claimable by the agent.
    expect(res.options).toMatchObject({
      kind: 'buttons',
      options: [{ id: 'list' }, { id: 'HOW' }, { id: 'CONSULT' }],
    });
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
      'house', // the property-type picker replaces the headline question
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
    expect(last?.reply).toMatch(/publish now/i);

    last = await handleListingIntakeMessage(deps, { phone, text: 'YES' });

    expect(createListing).toHaveBeenCalledOnce();
    expect(createListing.mock.calls[0][0]).toBe(phone);
    expect(createListing.mock.calls[0][1]).toMatchObject({
      // Composed, not typed.
      title: '3-bed house in Newlands',
      propertyType: 'house',
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
          return {
            propertyType: 'house' as const,
            suburb: 'Mowbray',
            bedrooms: 4,
            title: '4 bedroom home in mowbray',
          };
        }
        return {};
      },
    };
    const deps = { store, createListing, extractor };
    const phone = '27820002222';

    const replies: string[] = [];
    for (const text of [
      'list',
      '4 bedroom home in mowbray',
      'SKIP',
      '5000000',
      '2',
      '90',
      'YES',
    ]) {
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
      extract: vi.fn(async () => ({
        propertyType: 'house' as const,
        suburb: 'Mowbray',
        bedrooms: 4,
      })),
    };
    const res = await handleListingIntakeMessage(
      { store, createListing, extractor },
      { phone: '27820003333', text: 'sell my 4 bed in Mowbray' },
    );

    // Type+suburb+beds all known → the next ask is the optional address.
    expect(res.reply).toMatch(/street address/i);
    const state = await store.get('27820003333');
    expect(state?.data).toMatchObject({
      // The trigger's remainder is still taken as a seller-written headline.
      title: '4 bed in Mowbray',
      propertyType: 'house',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
  });

  it('shows price guidance once at the price step and saves it on publish', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn().mockResolvedValue({ id: 'listing_9' });
    const estimate = vi.fn().mockResolvedValue({
      lowZar: 2_400_000,
      highZar: 2_700_000,
      source: 'LOOM Property Insights',
    });
    const saveEstimate = vi.fn();
    const deps = {
      store,
      createListing,
      valuation: { estimate },
      saveEstimate,
    };
    const phone = '27820005555';

    const replies: string[] = [];
    let last;
    for (const text of ['list', 'apartment', 'Gardens', '12 Milner Road']) {
      last = await handleListingIntakeMessage(deps, { phone, text });
      replies.push(last.reply);
    }
    // The estimate arrives after the state machine ran, so the price buttons
    // are built in the orchestrator — they must not be lost.
    expect(last?.options).toMatchObject({
      kind: 'buttons',
      options: [{ id: '2400000' }, { id: '2550000' }, { id: '2700000' }],
    });
    // The price prompt carries the attributed guidance line.
    expect(replies.at(-1)).toMatch(/asking price/i);
    expect(replies.at(-1)).toMatch(/R2[\s,.  ]?400[\s,.  ]?000/);
    expect(replies.at(-1)).toMatch(/via LOOM Property Insights/);
    expect(replies.at(-1)).toMatch(/CONSULT/);
    expect(estimate).toHaveBeenCalledOnce();
    expect(estimate.mock.calls[0][0]).toMatchObject({
      suburb: 'Gardens',
      address: '12 Milner Road',
    });

    for (const text of ['2500000', '2', '1', '90', 'YES']) {
      await handleListingIntakeMessage(deps, { phone, text });
    }
    // Looked up once for the whole conversation; persisted at publish.
    expect(estimate).toHaveBeenCalledOnce();
    expect(saveEstimate).toHaveBeenCalledWith('listing_9', {
      lowZar: 2_400_000,
      highZar: 2_700_000,
      source: 'LOOM Property Insights',
    });
  });

  it('CANCEL at the summary discards the draft', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const deps = { store, createListing };
    const phone = '27820007777';
    for (const text of [
      'list',
      'house',
      'Gardens',
      'SKIP',
      '2100000',
      '2',
      '1',
      '90',
    ]) {
      await handleListingIntakeMessage(deps, { phone, text });
    }
    expect(await store.get(phone)).not.toBeNull();

    const res = await handleListingIntakeMessage(deps, {
      phone,
      text: 'CANCEL',
    });

    expect(res.reply).toMatch(/discarded/i);
    expect(createListing).not.toHaveBeenCalled();
    expect(await store.get(phone)).toBeNull();
  });

  it('no adapter (or a null estimate) means the plain price prompt — never a fabricated range', async () => {
    const store = createInMemoryConversationStore();
    const deps = {
      store,
      createListing: vi.fn().mockResolvedValue({ id: 'x' }),
      valuation: { estimate: vi.fn().mockResolvedValue(null) },
    };
    const phone = '27820006666';
    let reply = '';
    for (const text of ['list', 'house', 'Gardens', 'skip']) {
      reply = (await handleListingIntakeMessage(deps, { phone, text })).reply;
    }
    expect(reply).toMatch(/asking price/i);
    expect(reply).not.toMatch(/Price guidance|LOOM/);
    // The null result is cached — no second lookup on a price re-ask.
    await handleListingIntakeMessage(deps, { phone, text: 'about two mil' });
    expect(deps.valuation.estimate).toHaveBeenCalledOnce();
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
      text: 'apartment',
    });
    expect(res.reply).toMatch(/region|suburb/i); // flow continues scripted
  });

  it('keeps the description buttons on the publish confirmation', async () => {
    const store = createInMemoryConversationStore();
    const deps = {
      store,
      createListing: vi.fn().mockResolvedValue({ id: 'listing_x' }),
      // A valuation adapter is configured — its guidance must not clobber
      // options attached outside the step table.
      valuation: {
        estimate: vi
          .fn()
          .mockResolvedValue({
            lowZar: 2_000_000,
            highZar: 2_400_000,
            source: 'test',
          }),
      },
    };
    const phone = '27820008888';
    let last;
    for (const text of [
      'list',
      'house',
      'Gardens',
      'SKIP',
      '2100000',
      '2',
      '1',
      '90',
      'YES',
    ]) {
      last = await handleListingIntakeMessage(deps, { phone, text });
    }
    expect(last?.listingId).toBe('listing_x');
    expect(last?.options).toMatchObject({
      kind: 'buttons',
      options: [{ id: 'DRAFT' }, { id: 'TYPE' }, { id: 'SKIP' }],
    });
  });
});
