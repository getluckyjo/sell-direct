import { describe, expect, it, vi } from 'vitest';
import {
  handleBuyerEnquiry,
  requestPreQualification,
  type EnquiryDeps,
} from './service';

function makeDeps() {
  const profiles = {
    upsertBuyerByPhone: vi.fn().mockResolvedValue({ id: 'buyer_1' }),
    recordBuyerFinancialConsent: vi.fn().mockResolvedValue(undefined),
  };
  const deals = {
    createOrGetEnquiryDeal: vi
      .fn()
      .mockResolvedValue({ id: 'deal_1', status: 'enquiry' }),
  };
  const finance = {
    submitReferral: vi
      .fn()
      .mockResolvedValue({ referenceId: 'ooba-stub-buyer_1', partner: 'ooba' }),
  };
  return { profiles, deals, finance } satisfies EnquiryDeps & {
    profiles: typeof profiles;
    deals: typeof deals;
    finance: typeof finance;
  };
}

describe('buyer enquiry', () => {
  it('creates a buyer + enquiry deal and invites pre-qualification', async () => {
    const deps = makeDeps();
    const res = await handleBuyerEnquiry(deps, {
      phone: '27820001234',
      listingId: 'listing_1',
      name: 'Lerato',
    });
    expect(deps.profiles.upsertBuyerByPhone).toHaveBeenCalledWith(
      '27820001234',
      'Lerato',
    );
    expect(deps.deals.createOrGetEnquiryDeal).toHaveBeenCalledWith(
      'listing_1',
      'buyer_1',
    );
    expect(res).toMatchObject({ buyerId: 'buyer_1', dealId: 'deal_1' });
    expect(res.reply).toMatch(/pre-qualif/i);
  });
});

describe('bond pre-qualification (consent-gated)', () => {
  it('captures and submits NOTHING without consent', async () => {
    const deps = makeDeps();
    const res = await requestPreQualification(deps, {
      buyerId: 'buyer_1',
      phone: '27820001234',
      consent: false,
      approvedAmountZar: 2400000,
    });
    expect(res.accepted).toBe(false);
    expect(deps.profiles.recordBuyerFinancialConsent).not.toHaveBeenCalled();
    expect(deps.finance.submitReferral).not.toHaveBeenCalled();
  });

  it('records consent then hands off to the originator when consented', async () => {
    const deps = makeDeps();
    const res = await requestPreQualification(deps, {
      buyerId: 'buyer_1',
      phone: '27820001234',
      consent: true,
      listingId: 'listing_1',
      approvedAmountZar: 2400000,
    });
    expect(deps.profiles.recordBuyerFinancialConsent).toHaveBeenCalledWith(
      'buyer_1',
      2400000,
    );
    expect(deps.finance.submitReferral).toHaveBeenCalledOnce();
    expect(res.accepted).toBe(true);
    expect(res.referenceId).toBe('ooba-stub-buyer_1');
  });
});
