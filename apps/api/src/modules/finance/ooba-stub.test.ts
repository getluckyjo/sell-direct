import { describe, expect, it } from 'vitest';
import { ObaReferralStub } from './ooba-stub';

describe('ObaReferralStub', () => {
  it('returns an ooba reference and never calls a real API', async () => {
    const stub = new ObaReferralStub();
    const result = await stub.submitReferral({
      buyerId: 'buyer_abcdef12345',
      phone: '27820001234',
      approvedAmountZar: 2400000,
      consentAt: new Date('2026-06-27T00:00:00Z'),
    });
    expect(result.partner).toBe('ooba');
    expect(result.referenceId).toMatch(/^ooba-stub-/);
  });

  it('logs only a redacted summary — no full phone, no amount', async () => {
    const lines: string[] = [];
    const stub = new ObaReferralStub((m) => lines.push(m));
    await stub.submitReferral({
      buyerId: 'buyer_abcdef12345',
      phone: '27820001234',
      approvedAmountZar: 2400000,
      consentAt: new Date('2026-06-27T00:00:00Z'),
    });
    const log = lines.join('\n');
    expect(log).not.toContain('27820001234');
    expect(log).not.toContain('2400000');
    expect(log).toContain('ooba');
  });
});
