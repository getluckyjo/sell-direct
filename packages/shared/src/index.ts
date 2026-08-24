export const APP_NAME = 'Sold Direct';

/**
 * Deal stages model the South African property transfer journey.
 *
 * This is the shared source of truth for the stage names. The full state
 * machine — valid transitions plus the append-only deal_events log — is
 * implemented in PR 2 (deals module).
 */
export const DEAL_STAGES = [
  'enquiry',
  'offer_otp',
  'bond_application',
  'bond_granted',
  'documents_fica',
  'clearance',
  'lodgement',
  'registered',
  'cancelled',
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

/** Commercial path a deal is on (affects the conditional 0% commission). */
export type DealTier = 'free' | 'flex';

/**
 * Property types offered in the WhatsApp intake picker. Kept deliberately
 * short — it exists so the seller taps instead of typing, and so we can
 * compose a headline ("3-bed apartment in Sea Point") without asking for one.
 */
export const PROPERTY_TYPES = [
  'house',
  'apartment',
  'townhouse',
  'estate',
  'land',
  'other',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

/**
 * Rand, formatted the South African way: "R2 100 000".
 *
 * Deliberately NOT `toLocaleString('en-ZA')` — that depends on the host's ICU
 * build, so the same price renders "R2 100 000" on a full-ICU Node and
 * "R2,100,000" in a browser or a small-ICU runtime. Sellers see these numbers
 * in WhatsApp messages, so the grouping is pinned here instead of inherited.
 */
export function formatZar(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  return `${sign}R${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

// ── Consent: POPIA processing + the separate WhatsApp opt-in ──────────────

/**
 * Consent wording, versioned.
 *
 * Two rules drive this shape:
 *
 * 1. **Meta requires the WhatsApp channel to be named explicitly** in the
 *    opt-in. A general "I agree to be contacted" is not enough, so the
 *    WhatsApp consent is its own optional field — someone can accept email
 *    and decline WhatsApp, and the two consents stay separately provable.
 * 2. **Store proof, not assertion.** A form submits only the *version* it
 *    displayed; the server resolves the exact wording from this registry and
 *    stores it on the record. A lead can therefore never claim wording that
 *    was never on screen, and old versions stay resolvable after copy changes.
 *
 * When the copy changes, add a NEW version key and point
 * `CONSENT_FORM_VERSION` at it. Never edit a published version in place —
 * that would silently rewrite the proof attached to existing records.
 */
export const CONSENT_FORM_VERSION = '2026-08-20.1';

export interface ConsentWording {
  /** POPIA processing consent — required to submit any form. */
  processing: string;
  /** WhatsApp channel opt-in — optional, unticked, never bundled. */
  whatsapp: string;
}

export const CONSENT_WORDING: Record<string, ConsentWording> = {
  '2026-08-20.1': {
    processing:
      'I agree to be contacted about Sold Direct and accept that my details ' +
      'are processed per the POPIA privacy notice.',
    whatsapp:
      'Yes — Sold Direct may message me on WhatsApp about listing or selling ' +
      'my home. Optional, and I can reply STOP at any time.',
  },
};

/** The wording for a version, or null when the version is unknown. */
export function consentWording(version: string): ConsentWording | null {
  return CONSENT_WORDING[version] ?? null;
}

// ── The advertised WhatsApp entry words ───────────────────────────────────

/**
 * Every marketing CTA points at WhatsApp with one of these pre-filled. They
 * are the first thing a cold user ever sends us, so the dispatcher must
 * answer both with no prior context (`listings/welcome.ts`).
 *
 * They also matter commercially: a user-initiated message opens WhatsApp's
 * 24-hour session window, inside which we reply with free text and need no
 * approved template and no prior opt-in. That is why the whole funnel is
 * "send LIST" rather than "we'll message you".
 */
export const WHATSAPP_ENTRY_WORDS = {
  /** Start a listing. */
  list: 'LIST',
  /**
   * Find out what a home is worth. The word is deliberately PRICE rather
   * than VALUATION: under the Property Valuers Profession Act only a
   * registered valuer may perform a valuation, and we offer market-data
   * price guidance from confirmed sales.
   */
  price: 'PRICE',
} as const;

export type WhatsAppEntryWord =
  (typeof WHATSAPP_ENTRY_WORDS)[keyof typeof WHATSAPP_ENTRY_WORDS];

/**
 * A click-to-WhatsApp deep link that opens the chat with `text` pre-filled.
 *
 * Returns null when no sender number is configured — the sender is pending
 * Meta approval (`docs/META-ONBOARDING.md`), so callers must have a fallback
 * rather than rendering a link to nowhere.
 */
export function whatsappDeepLink(
  senderNumber: string | undefined | null,
  text: string,
): string | null {
  const digits = (senderNumber ?? '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
