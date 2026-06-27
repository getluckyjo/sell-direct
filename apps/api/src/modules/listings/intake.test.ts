import { describe, expect, it } from 'vitest';
import { advanceIntake, startIntake, type IntakeState } from './intake';

describe('listing intake state machine', () => {
  it('walks a full happy path to a complete draft', () => {
    let r = startIntake();
    expect(r.state.step).toBe('awaiting_title');

    r = advanceIntake(r.state, '2-bed apartment in Sea Point');
    expect(r.state.step).toBe('awaiting_suburb');
    r = advanceIntake(r.state, 'Sea Point');
    expect(r.state.step).toBe('awaiting_price');
    r = advanceIntake(r.state, 'R 2,100,000');
    expect(r.state.step).toBe('awaiting_bedrooms');
    r = advanceIntake(r.state, '2');
    expect(r.state.step).toBe('awaiting_bathrooms');
    r = advanceIntake(r.state, '1');
    expect(r.state.step).toBe('awaiting_exclusivity');
    r = advanceIntake(r.state, '90');

    expect(r.state.step).toBe('completed');
    expect(r.completed).toEqual({
      title: '2-bed apartment in Sea Point',
      suburb: 'Sea Point',
      priceZar: 2100000,
      bedrooms: 2,
      bathrooms: 1,
      exclusivityTermDays: 90,
      tier: 'free',
    });
  });

  it('re-asks on an unparseable price and keeps the step', () => {
    const state: IntakeState = {
      step: 'awaiting_price',
      data: { title: 'x', suburb: 'y', tier: 'free' },
    };
    const r = advanceIntake(state, 'about two million');
    expect(r.state.step).toBe('awaiting_price');
    expect(r.completed).toBeUndefined();
    expect(r.reply).toMatch(/digits/i);
  });

  it('only accepts 60/90/120 for the exclusivity term', () => {
    const base: IntakeState = {
      step: 'awaiting_exclusivity',
      data: {
        title: 't',
        suburb: 's',
        priceZar: 2000000,
        bedrooms: 2,
        bathrooms: 1,
        tier: 'free',
      },
    };
    expect(advanceIntake(base, '45').state.step).toBe('awaiting_exclusivity');
    expect(advanceIntake(base, '120').completed?.exclusivityTermDays).toBe(120);
  });
});
