import { describe, expect, it, vi } from 'vitest';
import { createDispatcher, type DispatcherDeps } from './dispatcher';
import { createInMemoryPrequalStore } from './prequal-store';
import { createInMemoryConversationStore } from '../listings';
import { ObaReferralStub } from '../finance';
import type { AgentHandler } from '../agent';
import type { InboundMessage } from '../messaging';

const PHONE = '+27820001111';

function inbound(text: string): InboundMessage {
  return {
    waMessageId: `wamid.${text}`,
    from: PHONE,
    to: '+14155238886',
    type: 'text',
    text,
    raw: {},
  };
}

function makeDeps(agent?: AgentHandler) {
  const sent: { to: string; text: string }[] = [];
  const notifier = {
    send: vi.fn(async (to: string, text: string) => {
      sent.push({ to, text });
    }),
  };
  const deps: DispatcherDeps = {
    intake: {
      store: createInMemoryConversationStore(),
      createListing: vi.fn(async () => ({ id: 'listing-1' })),
    },
    enquiry: {
      profiles: {
        upsertBuyerByPhone: vi.fn(async () => ({ id: 'buyer-1' })),
        recordBuyerFinancialConsent: vi.fn(async () => {}),
      },
      deals: {
        createOrGetEnquiryDeal: vi.fn(async () => ({
          id: 'deal-1',
          status: 'enquiry',
        })),
        list: vi.fn(async () => []),
        getWithTimeline: vi.fn(async () => null),
        getNotificationContext: vi.fn(async () => null),
      },
      finance: new ObaReferralStub(),
    },
    prequalStore: createInMemoryPrequalStore(),
    notifier,
    agent,
    log: vi.fn(),
  };
  return { dispatcher: createDispatcher(deps), sent };
}

describe('dispatcher × AI concierge', () => {
  it('hands unmatched messages to the agent; live mode suppresses the canned help', async () => {
    const agent: AgentHandler = {
      handle: vi.fn(async () => ({ sent: true })),
    };
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('how long does a transfer take?'));

    expect(agent.handle).toHaveBeenCalledWith({
      phone: PHONE,
      text: 'how long does a transfer take?',
    });
    expect(d.sent).toHaveLength(0); // agent replied; no canned help
  });

  it('shadow mode still sends the canned help so the user is not left hanging', async () => {
    const agent: AgentHandler = {
      handle: vi.fn(async () => ({ sent: false, draftId: 'draft-1' })),
    };
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('how long does a transfer take?'));

    expect(agent.handle).toHaveBeenCalled();
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });

  it('the "list" trigger never reaches the agent', async () => {
    const agent: AgentHandler = { handle: vi.fn(async () => ({ sent: true })) };
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list'));

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toContain('headline'); // intake started
  });

  it('an agent failure falls back to the canned help reply', async () => {
    const agent: AgentHandler = {
      handle: vi.fn(async () => {
        throw new Error('model unavailable');
      }),
    };
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('random question'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });

  it('without an agent the canned help behaviour is unchanged', async () => {
    const d = makeDeps(undefined);

    await d.dispatcher.handle(inbound('random question'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });
});
