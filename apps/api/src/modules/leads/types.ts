export type LeadKind = 'waitlist' | 'investor';
export type LeadRole = 'seller' | 'buyer' | 'investor' | 'other';

/** A lead captured from one of the public sites (marketing / fundraising). */
export interface LeadInput {
  kind: LeadKind;
  email: string;
  name?: string;
  phone?: string;
  role?: LeadRole;
  message?: string;
  /** Free-text origin, e.g. "marketing:hero" or "fundraising:data-room". */
  source?: string;
  /** Must be true — explicit POPIA consent given on the form. */
  consent: boolean;
  /**
   * Separate, optional WhatsApp channel opt-in. Meta requires the channel to
   * be named explicitly in the opt-in, so this is never folded into
   * `consent` — a lead may accept contact and decline WhatsApp.
   */
  whatsappConsent?: boolean;
  /**
   * Version of the consent copy the form displayed
   * (`CONSENT_FORM_VERSION`). The wording itself is resolved server-side
   * from this version and stored as proof — the client never sends text.
   */
  consentFormVersion?: string;
}
