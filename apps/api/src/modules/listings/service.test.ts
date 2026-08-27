import { describe, expect, it, vi } from 'vitest';
import {
  handleListingIntakeMessage,
  looksLikeAQuestion,
  soundsStuck,
} from './service';
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
    // The welcome dropdown: one tap to start, and still claimable by the agent.
    expect(res.options).toMatchObject({
      kind: 'list',
      sections: [
        {
          rows: [
            { id: 'START' },
            { id: 'HOW' },
            { id: 'COST' },
            { id: 'PRICE' },
            { id: 'CONSULT' },
          ],
        },
      ],
    });
    expect(res.fallback).toBe(true);
    expect(createListing).not.toHaveBeenCalled();
  });

  it('a bare "list" opens the how-it-works bio and the dropdown, not question 1', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const res = await handleListingIntakeMessage(
      { store, createListing },
      { phone: '27820001111', text: 'list' },
    );
    // The advertised opener orients before it interrogates.
    expect(res.reply).toMatch(/how it works/i);
    expect(res.reply).not.toMatch(/kind of home/i);
    expect(res.options).toMatchObject({ kind: 'list' });
    // Nothing is persisted until the seller actually starts.
    expect(await store.get('27820001111')).toBeNull();
  });

  it('START from the welcome menu begins the intake', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const res = await handleListingIntakeMessage(
      { store, createListing },
      { phone: '27820001111', text: 'START' },
    );
    expect(res.reply).toMatch(/kind of home/i);
    expect(await store.get('27820001111')).not.toBeNull();
  });

  it('a "list" that already carries details skips the menu entirely', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn();
    const res = await handleListingIntakeMessage(
      { store, createListing },
      { phone: '27820001111', text: 'list my 4 bed in Mowbray' },
    );
    // A seller who has already told us something is never sent back to a menu.
    expect(res.reply).not.toMatch(/how it works/i);
    expect(await store.get('27820001111')).not.toBeNull();
  });

  it('drives a scripted conversation that creates a listing after YES', async () => {
    const store = createInMemoryConversationStore();
    const createListing = vi.fn().mockResolvedValue({ id: 'listing_1' });
    const deps = { store, createListing };
    const phone = '27820001111';

    const script = [
      'START',
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
      'START',
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
    for (const text of ['START', 'apartment', 'Gardens', '12 Milner Road']) {
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
      'START',
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
    for (const text of ['START', 'house', 'Gardens', 'skip']) {
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

    // "START" is a menu tap carrying no detail — there is nothing to extract,
    // so the flow must not spend an LLM call on it.
    await handleListingIntakeMessage(deps, { phone, text: 'START' });
    expect(extract).not.toHaveBeenCalled();

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
        estimate: vi.fn().mockResolvedValue({
          lowZar: 2_000_000,
          highZar: 2_400_000,
          source: 'test',
        }),
      },
    };
    const phone = '27820008888';
    let last;
    for (const text of [
      'START',
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

describe('a message mid-flow the script cannot serve', () => {
  it('flags a question so the concierge can answer it', async () => {
    const store = createInMemoryConversationStore();
    const deps = { store, createListing: vi.fn() };
    const phone = '27820009999';
    await handleListingIntakeMessage(deps, { phone, text: 'START' });
    await handleListingIntakeMessage(deps, { phone, text: 'house' });
    await handleListingIntakeMessage(deps, { phone, text: 'Newlands' });
    await handleListingIntakeMessage(deps, { phone, text: 'SKIP' });

    const res = await handleListingIntakeMessage(deps, {
      phone,
      text: 'how much do you charge?',
    });

    expect(res.needsConcierge).toBe(true);
    // The step is held, so the re-ask puts them back where they were.
    expect((await store.get(phone))?.step).toBe('awaiting_price');
  });

  it('does not flag a fat-fingered answer as a question', async () => {
    const store = createInMemoryConversationStore();
    const deps = { store, createListing: vi.fn() };
    const phone = '27820009998';
    await handleListingIntakeMessage(deps, { phone, text: 'START' });
    await handleListingIntakeMessage(deps, { phone, text: 'house' });
    await handleListingIntakeMessage(deps, { phone, text: 'Newlands' });
    await handleListingIntakeMessage(deps, { phone, text: 'SKIP' });

    const res = await handleListingIntakeMessage(deps, { phone, text: 'abc' });

    expect(res.needsConcierge).toBeUndefined();
  });

  it('flags frustration so the concierge answers instead of re-asking', async () => {
    const store = createInMemoryConversationStore();
    const deps = { store, createListing: vi.fn() };
    const phone = '27820009996';
    await handleListingIntakeMessage(deps, { phone, text: 'START' });
    await handleListingIntakeMessage(deps, { phone, text: 'house' });
    await handleListingIntakeMessage(deps, { phone, text: 'Newlands' });
    await handleListingIntakeMessage(deps, { phone, text: 'SKIP' });

    const res = await handleListingIntakeMessage(deps, {
      phone,
      text: "I'm angry",
    });

    expect(res.needsConcierge).toBe(true);
    // Still held at the same step, so the re-ask lands them where they were.
    expect((await store.get(phone))?.step).toBe('awaiting_price');
  });

  it('never flags a message that actually answered the question', async () => {
    const store = createInMemoryConversationStore();
    const deps = { store, createListing: vi.fn() };
    const phone = '27820009997';
    await handleListingIntakeMessage(deps, { phone, text: 'START' });
    const res = await handleListingIntakeMessage(deps, {
      phone,
      text: 'house',
    });
    expect(res.needsConcierge).toBeUndefined();
  });
});

describe('looksLikeAQuestion', () => {
  it('recognises questions', () => {
    expect(looksLikeAQuestion('how much do you charge?')).toBe(true);
    expect(looksLikeAQuestion('what happens after I publish')).toBe(true);
    expect(looksLikeAQuestion('is the address really private?')).toBe(true);
    expect(looksLikeAQuestion('can I change the price later')).toBe(true);
  });

  it('does not mistake a botched answer for a question', () => {
    // These are all things a seller types AT a question, not instead of one.
    expect(looksLikeAQuestion('3.5')).toBe(false);
    expect(looksLikeAQuestion('abc')).toBe(false);
    expect(looksLikeAQuestion('R2m')).toBe(false);
    expect(looksLikeAQuestion('how')).toBe(false); // too short to be a sentence
    expect(looksLikeAQuestion('')).toBe(false);
  });
});

describe('soundsStuck', () => {
  it('recognises frustration', () => {
    expect(soundsStuck("I'm angry")).toBe(true);
    expect(soundsStuck('this is confusing')).toBe(true);
    expect(soundsStuck('this is useless')).toBe(true);
    expect(soundsStuck("this doesn't make sense")).toBe(true);
    expect(soundsStuck('I am fed up')).toBe(true);
    expect(soundsStuck('waste of time')).toBe(true);
  });

  it('recognises a request for a person', () => {
    expect(soundsStuck('speak to a human')).toBe(true);
    expect(soundsStuck('can I talk to someone')).toBe(true);
    expect(soundsStuck('I want a real person')).toBe(true);
    expect(soundsStuck('please call me')).toBe(true);
    expect(soundsStuck('help me')).toBe(true);
  });

  it('does not fire on a botched answer', () => {
    // The whole point: re-asking IS the right reply to these.
    expect(soundsStuck('3.5')).toBe(false);
    expect(soundsStuck('abc')).toBe(false);
    expect(soundsStuck('R2m')).toBe(false);
    expect(soundsStuck('')).toBe(false);
  });

  it('does not fire on a legitimate answer that merely contains a substring', () => {
    // "Helderberg" contains "help"; "Humansdorp" contains "human". A suburb
    // must never be mistaken for a cry for help.
    expect(soundsStuck('Helderberg')).toBe(false);
    expect(soundsStuck('Humansdorp')).toBe(false);
    expect(soundsStuck('4 bedrooms')).toBe(false);
  });
});
