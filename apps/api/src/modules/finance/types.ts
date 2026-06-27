/**
 * Finance referral seam. Buyer pre-qualification is handed off to a licensed
 * bond originator (initially ooba) behind this interface — no own FSP licence,
 * and the partner can be swapped without touching business logic.
 */
export interface ReferralPayload {
  buyerId: string;
  name?: string;
  phone: string;
  listingId?: string;
  approvedAmountZar?: number;
  /** When the buyer gave explicit consent to share their data. */
  consentAt: Date;
}

export interface ReferralResult {
  referenceId: string;
  partner: string;
}

export interface FinanceReferralAdapter {
  submitReferral(payload: ReferralPayload): Promise<ReferralResult>;
}
