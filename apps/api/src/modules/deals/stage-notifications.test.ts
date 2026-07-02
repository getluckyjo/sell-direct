import { describe, expect, it } from 'vitest';
import { buildStageNotifications } from './stage-notifications';

const ctx = {
  property: '23 Vredehoek Ave',
  buyerPhone: '+27820001111',
  sellerPhone: '+27830002222',
};

describe('buildStageNotifications', () => {
  it('offer_otp notifies both parties with the otp_status template', () => {
    const out = buildStageNotifications('offer_otp', ctx);
    expect(out).toHaveLength(2);
    expect(out.map((n) => n.to)).toEqual([ctx.buyerPhone, ctx.sellerPhone]);
    for (const n of out) {
      expect(n.templateKey).toBe('otp_status');
      expect(n.variables?.['1']).toBe(ctx.property);
      expect(n.text).toContain(ctx.property);
    }
  });

  it('offer_otp uses the operator note as the status sentence', () => {
    const [n] = buildStageNotifications('offer_otp', {
      ...ctx,
      note: 'the seller countered at R6 000 000',
    });
    expect(n.variables?.['2']).toBe('the seller countered at R6 000 000');
  });

  it('bond_granted with bank + amount uses the bond_approved template for the buyer', () => {
    const out = buildStageNotifications('bond_granted', {
      ...ctx,
      bank: 'Standard Bank',
      amountZar: 'R5 400 000',
    });
    const buyer = out.find((n) => n.to === ctx.buyerPhone);
    expect(buyer?.templateKey).toBe('bond_approved');
    expect(buyer?.variables).toEqual({
      '1': ctx.property,
      '2': 'Standard Bank',
      '3': 'R5 400 000',
    });
    // seller still gets a transfer update
    const seller = out.find((n) => n.to === ctx.sellerPhone);
    expect(seller?.templateKey).toBe('transfer_status');
  });

  it('bond_granted without bank details falls back to transfer_status (no blank variables)', () => {
    const out = buildStageNotifications('bond_granted', ctx);
    const buyer = out.find((n) => n.to === ctx.buyerPhone);
    expect(buyer?.templateKey).toBe('transfer_status');
    expect(Object.values(buyer?.variables ?? {})).not.toContain('');
  });

  it('documents_fica addresses each party with their own checklist', () => {
    const out = buildStageNotifications('documents_fica', ctx);
    expect(out).toHaveLength(2);
    expect(out[0].variables?.['2']).toBe('the buyer');
    expect(out[1].variables?.['2']).toBe('the seller');
    for (const n of out) expect(n.templateKey).toBe('fica_checklist');
  });

  it('clearance sends compliance certs to the seller and a transfer update to the buyer', () => {
    const out = buildStageNotifications('clearance', ctx);
    const seller = out.find((n) => n.to === ctx.sellerPhone);
    const buyer = out.find((n) => n.to === ctx.buyerPhone);
    expect(seller?.templateKey).toBe('compliance_certs');
    expect(buyer?.templateKey).toBe('transfer_status');
  });

  it('registered congratulates both parties', () => {
    const out = buildStageNotifications('registered', ctx);
    expect(out).toHaveLength(2);
    for (const n of out) {
      expect(n.templateKey).toBe('transfer_status');
      expect(n.variables?.['2']).toMatch(/Registered/);
    }
  });

  it('cancelled is plain text (no template)', () => {
    const out = buildStageNotifications('cancelled', ctx);
    expect(out).toHaveLength(2);
    for (const n of out) expect(n.templateKey).toBeUndefined();
  });

  it('handles a missing seller phone (buyer-only deal context)', () => {
    const out = buildStageNotifications('lodgement', {
      property: ctx.property,
      buyerPhone: ctx.buyerPhone,
    });
    expect(out).toHaveLength(1);
    expect(out[0].to).toBe(ctx.buyerPhone);
  });

  it('enquiry produces no notifications', () => {
    expect(buildStageNotifications('enquiry', ctx)).toEqual([]);
  });
});
