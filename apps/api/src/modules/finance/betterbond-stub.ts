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
 * Stub originator (BetterBond) referral adapter.
 *
 * Does NOT call any real API. It logs only a redacted, consented summary — no
 * full phone number and no financial amounts — and returns a synthetic
 * reference id. Replace with a real adapter once the BetterBond partnership
 * and API are in place.
 */
export class BetterBondReferralStub implements FinanceReferralAdapter {
  constructor(private readonly log: (message: string) => void = () => {}) {}

  async submitReferral(payload: ReferralPayload): Promise<ReferralResult> {
    const referenceId = `betterbond-stub-${payload.buyerId.slice(0, 8)}`;
    this.log(
      `[finance] referral queued -> BetterBond for ${redactPhone(payload.phone)} ` +
        `(consented ${payload.consentAt.toISOString()})`,
    );
    return { referenceId, partner: 'BetterBond' };
  }
}
