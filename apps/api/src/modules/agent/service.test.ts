import { describe, expect, it, vi } from 'vitest';
import { createAgentHandler, type AgentServiceDeps } from './service';
import {
  benchmarkDeposit,
  buildAgentTools,
  type AgentDataSource,
  type AgentIntakeAccess,
} from './tools';
import type { AgentMessage, AgentModel, AgentRepository } from './types';
import {
  createInMemoryConversationStore,
  createInMemoryOnboardingStore,
} from '../listings';

function fakeRepository(history: AgentMessage[] = []): AgentRepository & {
  drafts: Array<Parameters<AgentRepository['saveDraft']>[0]>;
} {
  const drafts: Array<Parameters<AgentRepository['saveDraft']>[0]> = [];
  return {
    drafts,
    async conversation() {
      return history;
    },
    async saveDraft(draft) {
      drafts.push(draft);
      return { id: `draft_${drafts.length}` };
    },
    async listDrafts() {
      return [];
    },
    async getDraft() {
      return null;
    },
    async markReviewed() {},
  };
}

const emptyData: AgentDataSource = {
  async searchListings() {
    return [];
  },
  async dealsForPhone() {
    return [];
  },
};

function fakeModel(text: string, toolCalls: string[] = []): AgentModel {
  return {
    async reply() {
      return { text, toolCalls };
    },
  };
}

function deps(overrides: Partial<AgentServiceDeps>): AgentServiceDeps {
  return {
    model: fakeModel('Hello from the concierge.'),
    repository: fakeRepository(),
    data: emptyData,
    notifier: { send: vi.fn() },
    mode: 'shadow',
    ...overrides,
  };
}

describe('createAgentHandler', () => {
  it('shadow mode stores a pending draft and sends nothing', async () => {
    const repository = fakeRepository([{ role: 'user', content: 'hi' }]);
    const send = vi.fn();
    const handler = createAgentHandler(
      deps({ repository, notifier: { send } }),
    );

    const outcome = await handler.handle({ phone: '+27821234567', text: 'hi' });

    expect(outcome.sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(repository.drafts).toHaveLength(1);
    expect(repository.drafts[0]).toMatchObject({
      phone: '+27821234567',
      inbound: 'hi',
      draft: 'Hello from the concierge.',
      status: 'pending',
      escalated: false,
    });
  });

  it('live mode sends the reply and stores a sent audit row', async () => {
    const repository = fakeRepository([{ role: 'user', content: 'hi' }]);
    const send = vi.fn();
    const handler = createAgentHandler(
      deps({ repository, notifier: { send }, mode: 'live' }),
    );

    const outcome = await handler.handle({ phone: '+27821234567', text: 'hi' });

    expect(outcome.sent).toBe(true);
    expect(send).toHaveBeenCalledWith(
      '+27821234567',
      'Hello from the concierge.',
    );
    expect(repository.drafts[0].status).toBe('sent');
  });

  it('an empty model reply becomes an escalated concierge hand-off', async () => {
    const repository = fakeRepository([{ role: 'user', content: '???' }]);
    const handler = createAgentHandler(
      deps({ repository, model: fakeModel('') }),
    );

    await handler.handle({ phone: '+27821234567', text: '???' });

    expect(repository.drafts[0].escalated).toBe(true);
    expect(repository.drafts[0].draft).toContain('concierge');
  });

  it('appends the inbound text when history is missing it', async () => {
    const repository = fakeRepository([]); // fresh thread, nothing persisted
    let seen: AgentMessage[] = [];
    const model: AgentModel = {
      async reply(request) {
        seen = request.messages;
        return { text: 'ok', toolCalls: [] };
      },
    };
    const handler = createAgentHandler(deps({ repository, model }));

    await handler.handle({ phone: '+27821234567', text: 'is my bond ok?' });

    expect(seen).toEqual([{ role: 'user', content: 'is my bond ok?' }]);
  });
});

describe('buildAgentTools', () => {
  it('escalate_to_concierge flips the turn context flag', async () => {
    const ctx = { escalated: false as boolean, escalationReason: undefined };
    const tools = buildAgentTools(emptyData, '+27821234567', ctx);
    const escalate = tools.find((t) => t.name === 'escalate_to_concierge')!;

    await escalate.run({ reason: 'wants pricing advice' });

    expect(ctx.escalated).toBe(true);
    expect(ctx.escalationReason).toBe('wants pricing advice');
  });

  it('search_listings reports an honest empty result', async () => {
    const tools = buildAgentTools(emptyData, '+27821234567', {
      escalated: false,
    });
    const search = tools.find((t) => t.name === 'search_listings')!;

    const result = await search.run({ query: 'Clifton' });

    expect(result).toContain('No active listings');
    expect(result).toContain('Do not invent');
  });

  it('get_my_deals scopes to the conversation phone', async () => {
    const dealsForPhone = vi.fn().mockResolvedValue([
      {
        id: 'd1',
        role: 'seller',
        property: '2-bed in Sea Point',
        status: 'bond_application',
        updatedAt: new Date('2026-07-01'),
      },
    ]);
    const tools = buildAgentTools(
      { ...emptyData, dealsForPhone },
      '+27829990000',
      { escalated: false },
    );
    const myDeals = tools.find((t) => t.name === 'get_my_deals')!;

    const result = await myDeals.run({});

    expect(dealsForPhone).toHaveBeenCalledWith('+27829990000');
    expect(result).toContain('bond application in progress');
    expect(result).toContain('2-bed in Sea Point');
  });
});

describe('agent intake write tools', () => {
  function intakeAccess(): AgentIntakeAccess & {
    createListing: ReturnType<typeof vi.fn>;
    setDescription: ReturnType<typeof vi.fn>;
  } {
    const createListing = vi.fn(async () => ({ id: 'listing_9' }));
    const setDescription = vi.fn(async () => {});
    return {
      store: createInMemoryConversationStore(),
      createListing,
      onboarding: createInMemoryOnboardingStore(),
      listings: {
        findPhotoTarget: vi.fn(async () => ({
          id: 'listing_9',
          title: 'Home',
          status: 'awaiting_photos' as const,
          photoCount: 0,
        })),
        setDescription,
      },
      setDescription,
    };
  }

  it('write tools appear only when intake access is provided', async () => {
    const withIntake = buildAgentTools(emptyData, '+27820000001', { escalated: false }, intakeAccess());
    const withoutIntake = buildAgentTools(emptyData, '+27820000001', { escalated: false });
    expect(withIntake.map((t) => t.name)).toContain('update_listing_draft');
    expect(withIntake.map((t) => t.name)).toContain('publish_listing');
    expect(withoutIntake.map((t) => t.name)).not.toContain('update_listing_draft');
  });

  it('get_price_estimate appears with a valuation adapter and keeps the framing', async () => {
    const valuation = {
      estimate: vi.fn().mockResolvedValue({
        lowZar: 2_400_000,
        highZar: 2_700_000,
        comparablesCount: 9,
        source: 'LOOM Property Insights',
      }),
    };
    const tools = buildAgentTools(
      emptyData,
      '+27820000009',
      { escalated: false },
      undefined,
      valuation,
    );
    const estimateTool = tools.find((t) => t.name === 'get_price_estimate')!;
    expect(estimateTool).toBeDefined();

    const result = await estimateTool.run({ suburb: 'Mowbray', bedrooms: 4 });
    expect(result).toMatch(/R2[\s,.  ]?400[\s,.  ]?000/);
    expect(result).toContain('LOOM Property Insights');
    expect(result).toMatch(/estimate/i);
    expect(result).toMatch(/never as a valuation/i);

    // Null data → the tool forbids inventing a range.
    valuation.estimate.mockResolvedValueOnce(null);
    const empty = await estimateTool.run({ suburb: 'Nowhere' });
    expect(empty).toMatch(/Do NOT invent/i);
    expect(empty).toMatch(/consultation/i);

    // No valuation adapter → no tool at all.
    const without = buildAgentTools(emptyData, '+27820000009', { escalated: false });
    expect(without.map((t) => t.name)).not.toContain('get_price_estimate');
  });

  it('shadow handler never offers write tools; live handler does', async () => {
    let offered: string[] = [];
    const model: AgentModel = {
      async reply(request) {
        offered = request.tools.map((t) => t.name);
        return { text: 'ok', toolCalls: [] };
      },
    };
    const base = {
      model,
      repository: fakeRepository([{ role: 'user' as const, content: 'hi' }]),
      data: emptyData,
      notifier: { send: vi.fn() },
      intake: intakeAccess(),
    };

    await createAgentHandler({ ...base, mode: 'shadow' }).handle({
      phone: '+27820000001',
      text: 'hi',
    });
    expect(offered).toHaveLength(4);

    await createAgentHandler({ ...base, mode: 'live' }).handle({
      phone: '+27820000001',
      text: 'hi',
    });
    expect(offered).toHaveLength(7);
  });

  it('update_listing_draft validates, persists and reports missing fields', async () => {
    const access = intakeAccess();
    const tools = buildAgentTools(emptyData, '+27820000002', { escalated: false }, access);
    const update = tools.find((t) => t.name === 'update_listing_draft')!;

    const result = await update.run({
      title: '4 bed home in Mowbray',
      suburb: 'Mowbray',
      bedrooms: 4,
      price_zar: 5000, // below minimum → rejected with explanation
    });

    expect(result).toContain('price_zar=5000 rejected');
    expect(result).toContain('Still missing: priceZar, bathrooms, exclusivityTermDays');
    expect(result).toContain('Street address: not asked yet');
    const state = await access.store.get('+27820000002');
    expect(state?.data).toMatchObject({
      title: '4 bed home in Mowbray',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
    // Hand-off safe for the scripted flow: the unanswered optional address
    // is the next question before the price.
    expect(state?.step).toBe('awaiting_address');

    // A declined address is recorded as null and never re-asked.
    const declined = await update.run({ address_skipped: true });
    expect(declined).toContain('seller declined');
    expect((await access.store.get('+27820000002'))?.data.address).toBeNull();
    expect((await access.store.get('+27820000002'))?.step).toBe(
      'awaiting_price',
    );
  });

  it('publish_listing refuses without confirm or with an incomplete draft', async () => {
    const access = intakeAccess();
    const tools = buildAgentTools(emptyData, '+27820000003', { escalated: false }, access);
    const update = tools.find((t) => t.name === 'update_listing_draft')!;
    const publish = tools.find((t) => t.name === 'publish_listing')!;

    expect(await publish.run({ confirm: false })).toContain('Refused');
    await update.run({ title: 'Home', suburb: 'Gardens' });
    expect(await publish.run({ confirm: true })).toContain('incomplete');
    expect(access.createListing).not.toHaveBeenCalled();

    await update.run({ price_zar: 2_000_000, bedrooms: 2, bathrooms: 1, exclusivity_term_days: 90 });
    const result = await publish.run({ confirm: true });

    expect(result).toContain('Saved listing listing_9');
    expect(result).toContain('PENDING PHOTOS');
    expect(access.createListing).toHaveBeenCalledWith('+27820000003', {
      title: 'Home',
      suburb: 'Gardens',
      priceZar: 2_000_000,
      bedrooms: 2,
      bathrooms: 1,
      exclusivityTermDays: 90,
      tier: 'free',
    });
    expect(await access.store.get('+27820000003')).toBeNull(); // cleared
  });
});

describe('benchmarkDeposit', () => {
  it('flags a below-benchmark deposit', () => {
    const result = benchmarkDeposit({
      purchasePriceZar: 2_000_000,
      depositZar: 100_000, // 5%
      firstTimeBuyer: false,
    });
    expect(result).toContain('5.0%');
    expect(result).toContain('Below benchmark');
  });

  it('offers the zero-deposit check to first-time buyers without promising', () => {
    const result = benchmarkDeposit({
      purchasePriceZar: 1_500_000,
      depositZar: 150_000, // 10% > 8.2% benchmark
      firstTimeBuyer: true,
    });
    expect(result).toContain('At or above benchmark');
    expect(result).toContain('zero-deposit');
    expect(result).toContain('never promise approval');
  });
});
