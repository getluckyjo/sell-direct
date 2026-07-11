import { describe, expect, it, vi } from 'vitest';
import { createDispatcher } from './dispatcher';
import { createInMemoryPrequalStore } from './prequal-store';
import { createInMemoryConversationStore } from '../listings';
import { ObaReferralStub } from '../finance';
import type { ProfileRepository } from '../profiles';
import type { DealRepository } from '../deals';
import type { InboundMessage } from '../messaging';

const PHONE = '+27820001111';

function inbound(text: string): InboundMessage {
  return {
    waMessageId: `wamid.${Math.abs(hash(text))}`,
    from: PHONE,
    to: '+14155238886',
    type: 'text',
    text,
    raw: {},
  };
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function makeDeps(overrides: { notifierThrows?: boolean } = {}) {
  const sent: { to: string; text: string }[] = [];
  const notifier = {
    send: vi.fn(async (to: string, text: string) => {
      if (overrides.notifierThrows) throw new Error('send failed');
      sent.push({ to, text });
    }),
  };

  const profiles: ProfileRepository = {
    upsertBuyerByPhone: vi.fn(async () => ({ id: 'buyer-1' })),
    recordBuyerFinancialConsent: vi.fn(async () => {}),
  };
  const deals: DealRepository = {
    createOrGetEnquiryDeal: vi.fn(async () => ({
      id: 'deal-1',
      status: 'enquiry',
    })),
    list: vi.fn(async () => []),
    getWithTimeline: vi.fn(async () => null),
    getNotificationContext: vi.fn(async () => null),
  };

  const intakeStore = createInMemoryConversationStore();
  const prequalStore = createInMemoryPrequalStore();
  const createListing = vi.fn(async () => ({ id: 'listing-1' }));
  const log = vi.fn();

  const dispatcher = createDispatcher({
    intake: { store: intakeStore, createListing },
    enquiry: { profiles, deals, finance: new ObaReferralStub() },
    prequalStore,
    notifier,
    log,
  });

  return {
    dispatcher,
    notifier,
    sent,
    profiles,
    deals,
    intakeStore,
    prequalStore,
    createListing,
    log,
  };
}

describe('conversation dispatcher', () => {
  it('starts listing intake on the "list" trigger', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('list'));

    expect(d.notifier.send).toHaveBeenCalledOnce();
    expect(d.sent[0].to).toBe(PHONE);
    expect(d.sent[0].text.length).toBeGreaterThan(0);
    // an intake conversation now exists for this phone
    expect(await d.intakeStore.get(PHONE)).not.toBeNull();
  });

  it('gives the help fallback for an unrecognised message', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('hello there'));
    expect(d.sent[0].text).toMatch(/list/i);
  });

  it('handles a buyer enquiry deep link, then a YES consent → ooba hand-off', async () => {
    const d = makeDeps();

    await d.dispatcher.handle(inbound('ENQUIRE listing-1'));
    expect(d.profiles.upsertBuyerByPhone).toHaveBeenCalledOnce();
    expect(d.deals.createOrGetEnquiryDeal).toHaveBeenCalledWith(
      'listing-1',
      'buyer-1',
    );
    expect(d.sent[0].text).toMatch(/pre-qualif/i);
    expect(await d.prequalStore.get(PHONE)).toMatchObject({
      buyerId: 'buyer-1',
      listingId: 'listing-1',
    });

    await d.dispatcher.handle(inbound('YES'));
    expect(d.profiles.recordBuyerFinancialConsent).toHaveBeenCalledOnce();
    expect(d.sent[1].text).toMatch(/ooba/i);
    // conversation cleared after the hand-off
    expect(await d.prequalStore.get(PHONE)).toBeNull();
  });

  it('does not share anything when the buyer declines pre-qual', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('ENQUIRE listing-1'));
    await d.dispatcher.handle(inbound('no thanks'));

    expect(d.profiles.recordBuyerFinancialConsent).not.toHaveBeenCalled();
    expect(d.sent[1].text).toMatch(/pre-qualify any|won’t share|wont share/i);
    expect(await d.prequalStore.get(PHONE)).toBeNull();
  });

  it('asks which listing when ENQUIRE has no id', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('enquire'));
    expect(d.profiles.upsertBuyerByPhone).not.toHaveBeenCalled();
    expect(d.sent[0].text).toMatch(/which home|Enquire on WhatsApp/i);
  });

  it('swallows and logs a send failure (never breaks the webhook ack)', async () => {
    const d = makeDeps({ notifierThrows: true });
    await expect(d.dispatcher.handle(inbound('list'))).resolves.toBeUndefined();
    expect(d.log).toHaveBeenCalled();
  });

  it('acknowledges upsell keywords (CERTS/COVER/MOVE) instead of the list fallback', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('COVER'));
    expect(d.sent[0].text).toMatch(/insurance/i);
    expect(d.sent[0].text).not.toMatch(/reply "list"/i);

    await d.dispatcher.handle(inbound('move please'));
    expect(d.sent[1].text).toMatch(/movers/i);

    await d.dispatcher.handle(inbound('certs'));
    expect(d.sent[2].text).toMatch(/inspectors/i);

    await d.dispatcher.handle(inbound('CONSULT'));
    expect(d.sent[3].text).toMatch(/pricing chat/i);
    expect(d.sent[3].text).toMatch(/asking price is always yours/i);
    // no flows were started by upsell replies
    expect(await d.intakeStore.get(PHONE)).toBeNull();
  });
});
