import { describe, expect, it, vi } from 'vitest';
import { createAgentHandler, type AgentServiceDeps } from './service';
import { benchmarkDeposit, buildAgentTools, type AgentDataSource } from './tools';
import type { AgentMessage, AgentModel, AgentRepository } from './types';

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
