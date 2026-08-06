import { describe, expect, it, vi } from 'vitest';
import { createDispatcher, type DispatcherDeps } from './dispatcher';
import { createInMemoryPrequalStore } from './prequal-store';
import {
  createInMemoryConversationStore,
  createInMemoryOnboardingStore,
} from '../listings';
import { BetterBondReferralStub } from '../finance';
import type { AgentHandler, AgentMode } from '../agent';
import type { InboundMessage } from '../messaging';
import type { SendOptions } from '../notifications';

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

/** A tapped button/list row: the id travels in replyId, the label in text. */
function tap(id: string, label: string): InboundMessage {
  return { ...inbound(label), type: 'interactive', replyId: id };
}

/** The ids offered with a reply, in display order. */
function optionIds(opts?: SendOptions): string[] {
  const o = opts?.interactive;
  if (!o) return [];
  return o.kind === 'buttons'
    ? o.options.map((x) => x.id)
    : o.sections.flatMap((s) => s.rows.map((r) => r.id));
}

function fakeAgent(
  mode: AgentMode,
  handle: AgentHandler['handle'] = vi.fn(async () => ({
    sent: mode === 'live',
  })),
): AgentHandler {
  return { mode, handle };
}

function makeDeps(agent?: AgentHandler, extra: Partial<DispatcherDeps> = {}) {
  const sent: { to: string; text: string; opts?: SendOptions }[] = [];
  const notifier = {
    send: vi.fn(async (to: string, text: string, opts?: SendOptions) => {
      sent.push({ to, text, opts });
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
      finance: new BetterBondReferralStub(),
    },
    prequalStore,
    notifier,
    agent,
    log: vi.fn(),
    ...extra,
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
    expect(d.sent[0].text).toMatch(/0% commission/i);
    expect(optionIds(d.sent[0].opts)).toContain('START'); // the welcome menu
  });

  it('shadow agent: the START trigger stays with the scripted flow', async () => {
    const agent = fakeAgent(
      'shadow',
      vi.fn(async () => ({ sent: false })),
    );
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('START'));

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toContain('kind of home'); // scripted intake started
  });

  it('live agent: a detail-carrying trigger routes to agent-led intake', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list my 4 bed in Mowbray'));

    expect(agent.handle).toHaveBeenCalledWith({
      phone: PHONE,
      text: 'list my 4 bed in Mowbray',
    });
    expect(d.sent).toHaveLength(0); // agent replied itself
  });

  it('live agent: a question mid-flow is answered, then the step is re-asked', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 'Kenilworth', tier: 'free' },
      owner: 'scripted',
    });

    await d.dispatcher.handle(inbound('how much do you charge?'));

    // The concierge takes the aside...
    expect(agent.handle).toHaveBeenCalledWith({
      phone: PHONE,
      text: 'how much do you charge?',
    });
    // ...and the seller is put back on the question they were answering,
    // options intact, rather than left with "I didn't catch that".
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toMatch(/price/i);
    // The draft stays scripted — an aside never hands the flow to the agent.
    expect((await d.intakeStore.get(PHONE))?.owner).toBe('scripted');
    expect((await d.intakeStore.get(PHONE))?.step).toBe('awaiting_price');
  });

  it('a botched answer mid-flow is not treated as a question', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
      owner: 'scripted',
    });

    await d.dispatcher.handle(inbound('3.5'));

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toMatch(/didn.t catch/i);
  });

  it('without a live agent, a mid-flow question just re-asks', async () => {
    const d = makeDeps(undefined);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
      owner: 'scripted',
    });

    await d.dispatcher.handle(inbound('how much do you charge?'));

    // Deterministic floor: no model, but the seller is never stranded.
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toMatch(/didn.t catch/i);
  });

  it('live agent: a bare "list" stays deterministic — the menu, not the agent', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('list'));

    // The advertised opener must render the same menu every time, whether or
    // not the concierge is up.
    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toMatch(/how it works/i);
    expect(optionIds(d.sent[0].opts)).toContain('START');
  });

  it('live agent: an agent-owned draft routes mid-flow messages to the agent', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
      owner: 'agent',
    });

    await d.dispatcher.handle(inbound('R5m sounds right'));

    expect(agent.handle).toHaveBeenCalled();
    expect(d.sent).toHaveLength(0);
  });

  it('live agent: a tapped "List my property" runs the scripted flow, not the agent', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);

    // The regression this guards: with the concierge live the agent used to
    // claim the menu tap, so the seller asked for taps and got an open
    // question instead — the one-click flow could never run.
    await d.dispatcher.handle(tap('START', 'List my property'));

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toContain('kind of home');
    expect(optionIds(d.sent[0].opts)).toContain('house');
  });

  it('live agent: a scripted draft keeps its turns, mid-flow', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
      owner: 'scripted',
    });

    await d.dispatcher.handle(inbound('5000000'));

    // Whoever answered the opening message keeps the conversation — the
    // seller must never be handed between flows part-way through.
    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent).toHaveLength(1);
  });

  it('live agent: a draft with no owner is treated as scripted', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent);
    // Rows written before ownership was tracked: degrade to deterministic
    // questions rather than silently hand an old thread to the model.
    await d.intakeStore.set(PHONE, {
      step: 'awaiting_price',
      data: { title: 't', suburb: 's', tier: 'free' },
    });

    await d.dispatcher.handle(inbound('5000000'));

    expect(agent.handle).not.toHaveBeenCalled();
  });

  it('live agent failure on "list" falls back to the scripted flow', async () => {
    const agent = fakeAgent(
      'live',
      vi.fn(async () => {
        throw new Error('model unavailable');
      }),
    );
    const d = makeDeps(agent);

    await d.dispatcher.handle(inbound('START'));

    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toContain('kind of home'); // scripted intake took over
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
    expect(d.sent[0].text).toMatch(/0% commission/i);
    expect(optionIds(d.sent[0].opts)).toContain('START'); // the welcome menu
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
    const agent = fakeAgent(
      'shadow',
      vi.fn(async () => ({ sent: false })),
    );
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
    expect(d.sent[0].text).toMatch(/0% commission/i);
    expect(optionIds(d.sent[0].opts)).toContain('START'); // the welcome menu
  });

  it('an inbound photo is handled by code even in live mode — never the agent', async () => {
    const agent = fakeAgent('live');
    const d = makeDeps(agent, {
      photoIntake: {
        listings: {
          findPhotoTarget: vi.fn(async () => ({
            id: 'l1',
            title: 'Home',
            status: 'awaiting_photos' as const,
            photoCount: 0,
          })),
          addPhoto: vi.fn(async () => ({ id: 'p1' })),
          activate: vi.fn(async () => true),
          getForSyndication: vi.fn(async () => null),
        },
        fetchMedia: vi.fn(async () => ({
          bytes: Buffer.from('jpeg'),
          mimeType: 'image/jpeg',
        })),
        storage: {
          putObject: vi.fn(async ({ path }: { path: string }) => ({ path })),
          getObjectUrl: vi.fn(async () => 'https://cdn.example/p.jpg'),
          getUploadUrl: vi.fn(),
        },
        bucket: 'listing-photos',
        minPhotos: 1,
      },
    });

    await d.dispatcher.handle({
      waMessageId: 'wamid.img',
      from: PHONE,
      to: 'x',
      type: 'image',
      media: { id: 'm1', mimeType: 'image/jpeg' },
      raw: {},
    });

    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toMatch(/now LIVE/i);
  });

  it('the description step claims free text ahead of the agent', async () => {
    const agent = fakeAgent('live');
    const onboarding = createInMemoryOnboardingStore();
    await onboarding.set(PHONE, { listingId: 'l1' });
    const setDescription = vi.fn(async () => {});
    const d = makeDeps(agent, {
      description: { onboarding, setDescription },
    });

    await d.dispatcher.handle(inbound('A sunny family home near schools.'));

    expect(setDescription).toHaveBeenCalledWith(
      'l1',
      'A sunny family home near schools.',
    );
    expect(agent.handle).not.toHaveBeenCalled();
    expect(d.sent[0].text).toMatch(/description saved/i);
  });
});
