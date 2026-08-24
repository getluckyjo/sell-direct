import { describe, expect, it, vi } from 'vitest';
import { createDispatcher } from './dispatcher';
import { createInMemoryPrequalStore } from './prequal-store';
import { createInMemoryConversationStore } from '../listings';
import { BetterBondReferralStub } from '../finance';
import type { ProfileRepository } from '../profiles';
import type { DealRepository } from '../deals';
import type { InboundMessage } from '../messaging';
import { createInMemoryOptOutStore, type SendOptions } from '../notifications';

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
/** A tapped button/list row: the id routes, the label is what the user saw. */
function tap(replyId: string, label: string): InboundMessage {
  return {
    waMessageId: `wamid.${Math.abs(hash(replyId + label))}`,
    from: PHONE,
    to: '+14155238886',
    type: 'interactive',
    text: label,
    replyId,
    raw: {},
  };
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function makeDeps(overrides: { notifierThrows?: boolean } = {}) {
  const sent: { to: string; text: string; opts?: SendOptions }[] = [];
  const notifier = {
    send: vi.fn(async (to: string, text: string, opts?: SendOptions) => {
      if (overrides.notifierThrows) throw new Error('send failed');
      sent.push({ to, text, opts });
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
  const optOut = createInMemoryOptOutStore();
  const createListing = vi.fn(async () => ({ id: 'listing-1' }));
  const log = vi.fn();

  const dispatcher = createDispatcher({
    intake: { store: intakeStore, createListing },
    enquiry: { profiles, deals, finance: new BetterBondReferralStub() },
    prequalStore,
    notifier,
    optOut,
    log,
  });

  return {
    dispatcher,
    notifier,
    optOut,
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
  it('answers the "list" opener with the bio and the dropdown menu', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('list'));

    expect(d.notifier.send).toHaveBeenCalledOnce();
    expect(d.sent[0].to).toBe(PHONE);
    expect(d.sent[0].text).toMatch(/how it works/i);
    expect(d.sent[0].opts?.interactive).toMatchObject({ kind: 'list' });
    // Orientation only — no draft is opened until they tap "List my property".
    expect(await d.intakeStore.get(PHONE)).toBeNull();
  });

  it('starts listing intake on START from the menu', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('START', 'List my property'));

    expect(d.sent[0].text).toMatch(/kind of home/i);
    expect(await d.intakeStore.get(PHONE)).not.toBeNull();
  });

  it('offers the welcome menu for an unrecognised message', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('hello there'));
    expect(d.sent[0].text).toMatch(/0% commission/i);
    expect(d.sent[0].opts?.interactive).toMatchObject({
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
  });

  it('honours STOP: acknowledges once, then records the opt-out', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('STOP'));

    // The confirmation goes out BEFORE the opt-out is recorded, so the
    // notifier's guard can never swallow the one message they need to see.
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].text).toMatch(/won’t message you again/i);
    expect(await d.optOut.isOptedOut(PHONE)).toBe(true);
  });

  it('treats a later inbound as re-initiated contact and clears the opt-out', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('STOP'));
    await d.dispatcher.handle(inbound('LIST'));

    // They messaged us — replies are owed again, so the guard must not
    // suppress them.
    expect(await d.optOut.isOptedOut(PHONE)).toBe(false);
    expect(d.sent).toHaveLength(2);
  });

  it('does not treat "cancel" as an opt-out', async () => {
    // Intake uses CANCEL to drop a draft; abandoning a form is not a request
    // to stop being messaged.
    const d = makeDeps();
    await d.dispatcher.handle(inbound('cancel'));
    expect(await d.optOut.isOptedOut(PHONE)).toBe(false);
  });

  it('answers the advertised PRICE entry word without promising a valuation', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('PRICE'));
    // Price guidance from confirmed sales — never a formal valuation
    // (Property Valuers Profession Act: only a registered valuer may value).
    expect(d.sent[0].text).toMatch(/price guidance/i);
    expect(d.sent[0].text).toMatch(/not a formal valuation/i);
    expect(d.sent[0].opts?.interactive).toMatchObject({
      kind: 'buttons',
      options: [{ id: 'START' }, { id: 'CONSULT' }, { id: 'HOW' }],
    });
  });

  it('routes the PRICE menu row the same way as the typed word', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('PRICE', 'What’s my home worth?'));
    expect(d.sent[0].text).toMatch(/price guidance/i);
  });

  it('still answers "valuation" as an alias', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('valuation'));
    expect(d.sent[0].text).toMatch(/price guidance/i);
  });

  it.each(['price is 2.5m', 'price?  R2 500 000', 'what is the value'])(
    'does not hijack a mid-intake message like %j',
    async (text) => {
      // "price" is exactly what intake asks a seller for, so only the bare
      // advertised word may pull them out of their draft.
      const d = makeDeps();
      await d.dispatcher.handle(inbound(text));
      expect(d.sent[0].text).not.toMatch(/price guidance/i);
    },
  );

  it('handles a buyer enquiry deep link, then a YES consent → BetterBond hand-off', async () => {
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
    expect(d.sent[1].text).toMatch(/BetterBond/i);
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

  it('routes a tapped option by its id, not its label', async () => {
    const d = makeDeps();
    // The label alone would never match UPSELL_RE — only the id does.
    await d.dispatcher.handle(tap('CERTS', 'Book my certificates'));
    expect(d.sent[0].text).toMatch(/inspectors/i);
    expect(d.sent[0].text).not.toMatch(/reply "list"/i);
  });

  it('starts intake from a tapped welcome row', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('START', 'List my property'));
    expect(await d.intakeStore.get(PHONE)).not.toBeNull();
  });

  it('takes a tapped YES as pre-qualification consent', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(inbound('ENQUIRE listing-1'));
    await d.dispatcher.handle(tap('YES', 'Yes, pre-qualify me'));
    expect(d.profiles.recordBuyerFinancialConsent).toHaveBeenCalledOnce();
    expect(d.sent[1].text).toMatch(/BetterBond/i);
  });
});

describe('dispatcher option threading', () => {
  it('sends the intake step options along with the reply', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('START', 'List my property'));
    await d.dispatcher.handle(tap('house', 'House'));
    await d.dispatcher.handle(tap('Newlands', 'Newlands'));
    // The address step offers a one-tap skip.
    expect(d.sent.at(-1)?.opts?.interactive).toMatchObject({
      kind: 'buttons',
      options: [{ id: 'SKIP' }],
    });
  });

  it('answers HOW with the explainer, not the list fallback', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('HOW', 'How it works'));
    expect(d.sent[0].text).toMatch(/how sold direct works/i);
    expect(d.sent[0].opts?.interactive).toBeDefined();
    expect(await d.intakeStore.get(PHONE)).toBeNull();
  });

  it('acknowledges "Nothing right now" from the service menu', async () => {
    const d = makeDeps();
    await d.dispatcher.handle(tap('NOTHING', 'Nothing right now'));
    expect(d.sent[0].text).toMatch(/no problem/i);
    expect(d.sent[0].text).not.toMatch(/0% commission/i);
  });
});
