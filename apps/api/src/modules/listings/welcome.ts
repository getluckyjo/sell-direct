/**
 * The welcome menu: the copy a cold seller meets, and the keywords that open
 * it. "list" is the entry word we advertise, so it is the one message
 * guaranteed to arrive with no context — it orients before it interrogates.
 *
 * Deliberately pure (copy + regexes only, no I/O and no SDK imports) so the
 * dispatcher, the intake service and the browser demo bundle can all share
 * one source of truth for this copy.
 */

import type { ReplyOptions } from '../messaging/interactive';

/** The advertised entry words. */
export const START_RE = /^(list|sell)\b/i;

/** Trigger words + filler to strip when the trigger message carries a headline. */
export const TRIGGER_PREFIX_RE =
  /^(list|sell)\b[\s:,-]*(my\s+|our\s+|the\s+)?/i;

/**
 * "List my property" on the welcome menu. A bare "list" opens the welcome
 * (bio + menu) rather than the first question, so the menu row needs its own
 * keyword to *begin* the intake — otherwise tapping it would re-open the menu
 * it was tapped from.
 */
export const BEGIN_RE = /^(start|begin)\b/i;

/**
 * True when a message should *begin* the guided intake: the menu's START row,
 * or a trigger that already carries detail ("sell my 4 bed in Mowbray").
 *
 * A bare "list" is deliberately excluded — it opens the welcome menu, which
 * stays deterministic (and answerable with the AI concierge switched off).
 */
export function beginsIntake(text: string): boolean {
  const trimmed = text.trim();
  if (BEGIN_RE.test(trimmed)) return true;
  if (!START_RE.test(trimmed)) return false;
  return trimmed.replace(TRIGGER_PREFIX_RE, '').trim().length >= 3;
}

/** The opening most sellers see. */
export const WELCOME_REPLY =
  '👋 Welcome to Sold Direct — sell your Cape Town home with 0% commission.\n\n' +
  'How it works:\n' +
  '1️⃣ You build your listing right here — a few taps, no forms.\n' +
  '2️⃣ We syndicate it and send buyer enquiries straight to you.\n' +
  '3️⃣ Buyers pre-qualify for a bond in the chat, so you know who’s real.\n' +
  '4️⃣ Our registered property practitioners and WhatsApp concierge handle ' +
  'the offer, FICA and transfer admin with you.\n\n' +
  'What would you like to do?';

/** The welcome dropdown. Row ids are keywords the dispatcher already parses. */
export function welcomeMenu(): ReplyOptions {
  return {
    kind: 'list',
    button: 'Choose an option',
    sections: [
      {
        title: 'Sold Direct',
        rows: [
          {
            id: 'START',
            title: 'List my property',
            description: 'Build your listing in a few taps — live today.',
          },
          {
            id: 'HOW',
            title: 'How it works',
            description: 'The full journey, from listing to transfer.',
          },
          {
            id: 'COST',
            title: 'What it costs',
            description: 'How 0% commission works, and when it applies.',
          },
          {
            id: 'PRICE',
            title: 'What’s my home worth?',
            description: 'Free price guidance from recent nearby sales.',
          },
          {
            id: 'CONSULT',
            title: 'Talk to our team',
            description: 'A registered practitioner calls you back.',
          },
        ],
      },
    ],
  };
}

/**
 * "How it works" — a fixed explainer, so the menu is answerable with the AI
 * concierge switched off.
 */
export const HOW_RE = /^\s*how\s*$/i;
export const HOW_REPLY =
  'Here’s how Sold Direct works:\n\n' +
  '1️⃣ You list your property here on WhatsApp — a few taps, no forms.\n' +
  '2️⃣ We syndicate it and route buyer enquiries straight to you.\n' +
  '3️⃣ Buyers get bond pre-qualification in the chat, so you know who’s real.\n' +
  '4️⃣ Our registered property practitioners and WhatsApp concierge handle ' +
  'the offer, FICA and transfer admin with you.\n\n' +
  'It costs you 0% commission when you sell through our partners — on a ' +
  'R2.1m home, what a full-service sale (5–7% + VAT) would have cost is ' +
  'roughly R120 000–R170 000. Prefer a full-service agent? That’s a great ' +
  'choice too — we’re built for sellers who want to do it themselves.\n\n' +
  'Reply "list" whenever you’re ready.';

/** "What it costs" — same deal as HOW. */
export const COST_RE = /^\s*cost\s*$/i;
export const COST_REPLY =
  'What Sold Direct costs you:\n\n' +
  '🟢 *0% commission* when you list exclusively with us for the agreed term ' +
  'and transact through our bond and legal partners. The bank pays us an ' +
  'origination fee on the buyer’s bond, so you pay nothing.\n' +
  '🔵 *Flex — 1%* of the sale price if you’d rather keep full freedom, agreed ' +
  'upfront.\n\n' +
  'For context, on a R2.1m home what a full-service sale (5–7% + VAT) would ' +
  'have cost is roughly R120 000–R170 000. A full-service agent is a great ' +
  'choice for many sellers — we’re built for those who want to sell direct ' +
  'themselves, with our practitioners handling the admin.\n\n' +
  'No listing fee, no monthly fee, no lock-in beyond the term you choose.';

/**
 * "PRICE" — the second advertised entry word. All marketing sends people here
 * with LIST or PRICE pre-filled (`WHATSAPP_ENTRY_WORDS`), so this must answer
 * a cold, context-free message just as `list` does.
 *
 * Framing is deliberate and legally load-bearing. Under the Property Valuers
 * Profession Act only a registered valuer may perform a valuation, so we
 * advertise PRICE and the reply never promises one: market-data *price
 * guidance* from confirmed recent sales, and a pricing chat with a registered
 * property practitioner. Same rule as `valuation/types.ts` — the asking price
 * is always the seller's.
 *
 * Matching is exact for `price`, not prefixed, because "price" is also what
 * intake asks a seller for: `/^price\b/` would yank someone out of their
 * draft the moment they typed "price is 2.5m". `valuation` stays accepted as
 * an alias — people will still say it, and it cannot collide with a flow.
 */
export const PRICE_GUIDANCE_RE = /^\s*(price\s*$|valuation\b|valuate\b)/i;

export const PRICE_GUIDANCE_REPLY =
  '👋 Welcome to Sold Direct — happy to help you work out what your Cape ' +
  'Town home could be worth.\n\n' +
  'Two free ways, no obligation:\n\n' +
  '📊 *Price guidance in this chat* — a few quick questions about the home, ' +
  'then we show you what comparable homes nearby actually sold for, from ' +
  'confirmed sales data. That’s market guidance, not a formal valuation.\n\n' +
  '📞 *A pricing chat with our team* — one of our registered property ' +
  'practitioners talks you through it.\n\n' +
  'The asking price is always yours.';

/** The three ways on from the price-guidance reply. */
export function priceGuidanceOptions(): ReplyOptions {
  return {
    kind: 'buttons',
    options: [
      { id: 'START', title: 'Get price guidance' },
      { id: 'CONSULT', title: 'Talk to our team' },
      { id: 'HOW', title: 'How it works' },
    ],
  };
}
