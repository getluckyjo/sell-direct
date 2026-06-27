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
}
