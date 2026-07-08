import { describe, expect, it, vi } from 'vitest';
import { createDispatcher, type DispatcherDeps } from './dispatcher';
import { createInMemoryPrequalStore } from './prequal-store';
import { createInMemoryConversationStore } from '../listings';
import { ObaReferralStub } from '../finance';
import type { AgentHandler, AgentMode } from '../agent';
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

function fakeAgent(
  mode: AgentMode,
  handle: AgentHandler['handle'] = vi.fn(async () => ({ sent: mode === 'live' })),
): AgentHandler {
  return { mode, handle };
}

function makeDeps(agent?: AgentHandler) {
  const sent: { to: string; text: string }[] = [];
  const notifier = {
    send: vi.fn(async (to: string, text: string) => {
      sent.push({ to, text });
    }),
  };
  const intakeStore = createInMemoryConversationStore();
  const prequalStore = createInMemoryPrequalStore();
  const deals = {
    createOrGetEnquiryDeal: vi.fn(async () => ({
      id: 'deal-1',
      status: 'enquiry',
    })),
    list: vi.fn(async () => []),
    getWithTimeline: vi.fn(async () => null),
    getNotificationContext: vi.fn(async () => null),
  };
  const deps: DispatcherDeps = {
    intake: {
      store: intakeStore,
      createListing: vi.fn(async () => ({ id: 'listing-1' })),
    },
    enquiry: {
      profiles: {
        upsertBuyerByPhone: vi.fn(async () => ({ id: 'buyer-1' })),
        recordBuyerFinancialConsent: vi.fn(async () => {}),
      },
      deals,
      finance: new ObaReferralStub(),
    },
    prequalStore,
    notifier,
    agent,
    log: vi.fn(),
  };
  return {
    dispatcher: createDispatcher(deps),
    sent,
    intakeStore,
    prequalStore,
    deals,
  };
}

describe('dispatcher × AI concierge', () => {
  it('hands unmatched messages to the agent; live mode suppresses the canned help', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('how long does a transfer take?'));

    expect(agent.handle).toHaveBeenCalledWith({
      phone: PHONE,
      text: 'how long does a transfer take?',
    });
    expect(d.sent).toHaveLength(0); // agent replied; no canned help
  });

  it('shadow mode still sends the canned help so the user is not left hanging', async () => {
    const agent = fakeAgent(
      'shadow',
      vi.fn(async () => ({ sent: false, draftId: 'draft-1' })),
    );
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('how long does a transfer take?'));

    expect(agent.handle).toHaveBeenCalled();
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });

  it('shadow agent: the "list" trigger stays with the scripted flow', async () => {
    const agent = fakeAgent('shadow', vi.fn(async () => ({ sent: false })));
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list'));

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toContain('headline'); // scripted intake started
  });

  it('live agent: the "list" trigger routes to agent-led intake', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list my 4 bed in Mowbray'));

    expect(agent.handle).toHaveBeenCalledWith({
      phone: PHONE,
      text: 'list my 4 bed in Mowbray',
    });
    expect(d.sent).toHaveLength(0); // agent replied itself
  });

  it('live agent: an active intake draft routes mid-flow messages to the agent', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
    });

    await d.dispatcher.handle(inbound('R5m sounds right'));

    expect(agent.handle).toHaveBeenCalled();
    expect(d.sent).toHaveLength(0);
  });

  it('live agent failure on "list" falls back to the scripted flow', async () => {
    const agent = fakeAgent(
      'live',
      vi.fn(async () => {
        throw new Error('model unavailable');
      }),
    );
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('headline'); // scripted intake took over
  });

  it('an agent failure on freeform falls back to the canned help reply', async () => {
    const agent = fakeAgent(
      'shadow',
      vi.fn(async () => {
        throw new Error('model unavailable');
      }),
    );
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('random question'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });

  it('live agent composes the enquiry invite; deterministic work still runs', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('ENQUIRE listing-42'));

    // Buyer + deal + pending consent happen in code, not the agent…
    expect(d.deals.createOrGetEnquiryDeal).toHaveBeenCalledWith(
      'listing-42',
      'buyer-1',
    );
    expect(await d.prequalStore.get(PHONE)).toEqual({
      buyerId: 'buyer-1',
      listingId: 'listing-42',
    });
    // …while the agent words the invite.
    expect(agent.handle).toHaveBeenCalled();
    expect(d.sent).toHaveLength(0);
  });

  it('shadow agent: the canned enquiry invite is sent unchanged', async () => {
    const agent = fakeAgent('shadow', vi.fn(async () => ({ sent: false })));
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('ENQUIRE listing-42'));

    expect(agent.handle).not.toHaveBeenCalled(); // enquiry replies are canned in shadow
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toMatch(/pre-qualif/i);
  });

  it('without an agent the scripted behaviour is unchanged', async () => {
    const d = makeDeps(undefined);

    await d.dispatcher.handle(inbound('random question'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('Reply "list"');
  });
});
