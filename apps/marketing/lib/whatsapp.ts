import { WHATSAPP_ENTRY_WORDS, whatsappDeepLink } from '@sell-direct/shared';

/**
 * The public WhatsApp sender, E.164 (e.g. "+27871234567").
 *
 * Read as a literal so Next inlines it at build time — and remember that a
 * change here needs a REDEPLOY, not just an env edit.
 */
const SENDER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export interface WhatsAppCta {
  href: string;
  /** The word the tap pre-fills — worth showing, since it teaches the channel. */
  word: string;
}

export interface WhatsAppCtas {
  list: WhatsAppCta;
  valuation: WhatsAppCta;
}

/**
 * The two advertised routes into the channel — "send LIST" and "send
 * VALUATION" — as click-to-WhatsApp links with the word pre-filled.
 *
 * Returns **null until a sender number is configured**. The sender is pending
 * Meta approval (`docs/META-ONBOARDING.md`), so every caller falls back to the
 * waitlist rather than rendering a link that opens WhatsApp to nowhere.
 *
 * Why the whole funnel is shaped this way: a user-initiated message opens
 * WhatsApp's 24-hour session window, inside which we reply with free text —
 * no approved template needed, and no prior opt-in required to answer them.
 */
export function whatsappCtas(): WhatsAppCtas | null {
  const list = whatsappDeepLink(SENDER, WHATSAPP_ENTRY_WORDS.list);
  const valuation = whatsappDeepLink(SENDER, WHATSAPP_ENTRY_WORDS.valuation);
  if (!list || !valuation) return null;
  return {
    list: { href: list, word: WHATSAPP_ENTRY_WORDS.list },
    valuation: { href: valuation, word: WHATSAPP_ENTRY_WORDS.valuation },
  };
}
