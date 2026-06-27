import type { ProfileRepository } from '../profiles';
import type { DealRepository } from '../deals';
import type { FinanceReferralAdapter } from '../finance';

export interface EnquiryDeps {
  profiles: ProfileRepository;
  deals: DealRepository;
  finance: FinanceReferralAdapter;
}

export interface EnquiryInput {
  phone: string;
  listingId: string;
  name?: string;
}

export interface EnquiryResult {
  buyerId: string;
  dealId: string;
  reply: string;
}

/**
 * A buyer enquires on a listing via WhatsApp: upsert the buyer profile and
 * create (or reuse) an enquiry-stage deal, then invite them to pre-qualify.
 */
export async function handleBuyerEnquiry(
  deps: EnquiryDeps,
  input: EnquiryInput,
): Promise<EnquiryResult> {
  const buyer = await deps.profiles.upsertBuyerByPhone(input.phone, input.name);
  const deal = await deps.deals.createOrGetEnquiryDeal(
    input.listingId,
    buyer.id,
  );
  return {
    buyerId: buyer.id,
    dealId: deal.id,
    reply:
      'Thanks for your interest! Want a free, no-obligation home-loan ' +
      'pre-qualification right here? Reply YES and we’ll ask your consent ' +
      'before sharing anything.',
  };
}

export interface PreQualInput {
  buyerId: string;
  phone: string;
  consent: boolean;
  listingId?: string;
  approvedAmountZar?: number;
}

export interface PreQualResult {
  accepted: boolean;
  referenceId?: string;
  reply: string;
}

/**
 * Capture bond pre-qualification intent and hand off to the originator partner.
 *
 * POPIA: without explicit consent we capture and submit **nothing** — no
 * financial fields are written and the referral adapter is never called.
 * Consent is recorded before the hand-off.
 */
export async function requestPreQualification(
  deps: EnquiryDeps,
  input: PreQualInput,
): Promise<PreQualResult> {
  if (!input.consent) {
    return {
      accepted: false,
      reply:
        'No problem — we won’t share anything. You can pre-qualify any ' +
        'time by replying YES.',
    };
  }

  const consentAt = new Date();
  await deps.profiles.recordBuyerFinancialConsent(
    input.buyerId,
    input.approvedAmountZar,
  );

  const result = await deps.finance.submitReferral({
    buyerId: input.buyerId,
    phone: input.phone,
    listingId: input.listingId,
    approvedAmountZar: input.approvedAmountZar,
    consentAt,
  });

  return {
    accepted: true,
    referenceId: result.referenceId,
    reply: `You’re being connected to ${result.partner} for a free, no-obligation pre-qualification. Reference: ${result.referenceId}.`,
  };
}
