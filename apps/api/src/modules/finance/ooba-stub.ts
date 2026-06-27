import type {
  FinanceReferralAdapter,
  ReferralPayload,
  ReferralResult,
} from './types';

function redactPhone(phone: string): string {
  return phone.length <= 4
    ? '****'
    : `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}

/**
 * Stub originator (ooba) referral adapter.
 *
 * Does NOT call any real API. It logs only a redacted, consented summary — no
 * full phone number and no financial amounts — and returns a synthetic
 * reference id. Replace with a real adapter once the ooba partnership and API
 * are in place.
 */
export class ObaReferralStub implements FinanceReferralAdapter {
  constructor(private readonly log: (message: string) => void = () => {}) {}

  async submitReferral(payload: ReferralPayload): Promise<ReferralResult> {
    const referenceId = `ooba-stub-${payload.buyerId.slice(0, 8)}`;
    this.log(
      `[finance] referral queued -> ooba for ${redactPhone(payload.phone)} ` +
        `(consented ${payload.consentAt.toISOString()})`,
    );
    return { referenceId, partner: 'ooba' };
  }
}
