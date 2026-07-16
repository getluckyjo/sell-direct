import { describe, expect, it } from 'vitest';
import {
  advanceIntake,
  applyExtracted,
  missingFields,
  nextStep,
  renderSummary,
  startIntake,
  validateField,
  type IntakeState,
} from './intake';

const DOUBLE_QUESTION = /which suburb|how many bedrooms/i;

describe('listing intake state machine', () => {
  it('walks a full happy path to a confirmed listing', () => {
    let r = startIntake();
    expect(r.state.step).toBe('awaiting_title');

    r = advanceIntake(r.state, '2-bed apartment in Sea Point');
    expect(r.state.step).toBe('awaiting_suburb');
    r = advanceIntake(r.state, 'Sea Point');
    // The optional address is asked once, just before the price.
    expect(r.state.step).toBe('awaiting_address');
    expect(r.reply).toMatch(/kept private/i);
    r = advanceIntake(r.state, '12 Milner Road');
    expect(r.state.step).toBe('awaiting_price');
    r = advanceIntake(r.state, 'R 2,100,000');
    expect(r.state.step).toBe('awaiting_bedrooms');
    r = advanceIntake(r.state, '2');
    expect(r.state.step).toBe('awaiting_bathrooms');
    r = advanceIntake(r.state, '1');
    expect(r.state.step).toBe('awaiting_exclusivity');
    r = advanceIntake(r.state, '90');

    // Summary + confirm replaces instant publish.
    expect(r.state.step).toBe('awaiting_confirm');
    expect(r.completed).toBeUndefined();
    expect(r.reply).toMatch(/R2[\s,.\u00a0\u202f]?100[\s,.\u00a0\u202f]?000/);
    expect(r.reply).toMatch(/reply yes/i);

    r = advanceIntake(r.state, 'YES');
    expect(r.state.step).toBe('completed');
    // Listing now pends until the first photo arrives.
    expect(r.reply).toMatch(/confirmed/i);
    expect(r.reply).toMatch(/photos/i);
    expect(r.reply).toMatch(/skip/i);
    expect(r.reply).not.toMatch(/is live/i);
    expect(r.completed).toEqual({
      title: '2-bed apartment in Sea Point',
      suburb: 'Sea Point',
      address: '12 Milner Road',
      priceZar: 2100000,
      bedrooms: 2,
      bathrooms: 1,
      exclusivityTermDays: 90,
      tier: 'free',
    });
  });

  it('the address step is optional: SKIP records null and moves to price', () => {
    const state: IntakeState = {
      step: 'awaiting_address',
      data: { title: 'x', suburb: 'Sea Point', tier: 'free' },
    };
    const r = advanceIntake(state, 'skip');
    expect(r.state.data.address).toBeNull();
    expect(r.state.step).toBe('awaiting_price');

    // Too short to be an address → gentle re-ask, still skippable.
    const bad = advanceIntake(state, 'abc');
    expect(bad.state.step).toBe('awaiting_address');
    expect(bad.reply).toMatch(/skip/i);

    // The summary shows the address only when given.
    expect(
      renderSummary({
        title: 't',
        suburb: 's',
        address: '12 Milner Road',
        priceZar: 2_000_000,
        bedrooms: 2,
        bathrooms: 1,
        exclusivityTermDays: 90,
        tier: 'free',
      }),
    ).toMatch(/12 Milner Road \(kept private\)/);
  });

  it('never re-asks fields the headline already answered (the Mowbray bug)', () => {
    let r = startIntake();
    r = advanceIntake(r.state, '4 bedroom home in mowbray', {
      suburb: 'Mowbray',
      bedrooms: 4,
    });

    // Suburb + bedrooms skipped; the optional address slots in before price.
    expect(r.state.step).toBe('awaiting_address');
    expect(r.state.data).toMatchObject({
      title: '4 bedroom home in mowbray',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
    expect(r.reply).not.toMatch(DOUBLE_QUESTION);
    expect(r.reply).toMatch(/got it/i); // acknowledges what it understood
  });

  it('a multi-field message jumps straight to the last missing field', () => {
    let r = startIntake();
    r = advanceIntake(r.state, 'Family home in Mowbray', {
      suburb: 'Mowbray',
      bedrooms: 3,
      bathrooms: 2,
      priceZar: 5_000_000,
    });
    expect(r.state.step).toBe('awaiting_exclusivity');
    expect(r.reply).not.toMatch(DOUBLE_QUESTION);
  });

  it('extraction can answer the current numeric question in words', () => {
    const state: IntakeState = {
      step: 'awaiting_price',
      data: { title: 'x', suburb: 'y', tier: 'free' },
    };
    const r = advanceIntake(state, 'five million rand', {
      priceZar: 5_000_000,
    });
    expect(r.state.data.priceZar).toBe(5_000_000);
    expect(r.state.step).toBe('awaiting_bedrooms');
  });

  it('drops invalid extracted values instead of applying them', () => {
    let r = startIntake();
    r = advanceIntake(r.state, '50 bedroom palace for R5000', {
      bedrooms: 50, // > 20 → rejected
      priceZar: 5000, // < 100000 → rejected
    });
    expect(r.state.data.bedrooms).toBeUndefined();
    expect(r.state.data.priceZar).toBeUndefined();
    expect(r.state.step).toBe('awaiting_suburb');
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
    // Exclusivity leads to the unanswered address question, then confirm.
    const done = advanceIntake(base, '120');
    expect(done.state.step).toBe('awaiting_address');
    expect(advanceIntake(done.state, 'skip').state.step).toBe(
      'awaiting_confirm',
    );
  });

  it('confirm-step edits overwrite fields and re-render the summary', () => {
    const base: IntakeState = {
      step: 'awaiting_confirm',
      data: {
        title: '4 bedroom home in mowbray',
        suburb: 'Mowbray',
        address: null, // asked and skipped on the way here
        priceZar: 5_000_000,
        bedrooms: 4,
        bathrooms: 2,
        exclusivityTermDays: 90,
        tier: 'free',
      },
    };
    const r = advanceIntake(base, 'actually make the price 4500000', {
      priceZar: 4_500_000,
    });
    expect(r.state.step).toBe('awaiting_confirm');
    expect(r.state.data.priceZar).toBe(4_500_000);
    expect(r.reply).toMatch(/updated/i);
    expect(r.reply).toMatch(/4[\s,.\u00a0\u202f]?500[\s,.\u00a0\u202f]?000/);
    expect(r.completed).toBeUndefined();

    const junk = advanceIntake(base, 'hmmmm');
    expect(junk.state.step).toBe('awaiting_confirm');
    expect(junk.reply).toMatch(/reply yes/i);
  });

  it('startIntake with extracted trigger fields skips answered questions', () => {
    const r = startIntake({
      title: '4 bed in Mowbray',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
    expect(r.state.step).toBe('awaiting_address');
    expect(r.reply).not.toMatch(DOUBLE_QUESTION);

    // A trigger that already states the address skips that question too.
    const withAddress = startIntake({
      title: '4 bed at 12 Milner Rd',
      suburb: 'Mowbray',
      address: '12 Milner Rd',
      bedrooms: 4,
    });
    expect(withAddress.state.step).toBe('awaiting_price');
    expect(withAddress.state.data.address).toBe('12 Milner Rd');
  });

  it('helpers: validateField, missingFields, nextStep, renderSummary', () => {
    expect(validateField('priceZar', 99_999)).toBeNull();
    expect(validateField('priceZar', 100_000)).toBe(100_000);
    expect(validateField('bedrooms', 21)).toBeNull();
    expect(validateField('exclusivityTermDays', 61)).toBeNull();
    expect(validateField('suburb', ' Mowbray ')).toBe('Mowbray');

    const data = { title: 't', suburb: 's', tier: 'free' as const };
    expect(missingFields(data)).toEqual([
      'priceZar',
      'bedrooms',
      'bathrooms',
      'exclusivityTermDays',
    ]);
    // Address (unanswered) slots in before the price question…
    expect(nextStep(data)).toBe('awaiting_address');
    // …and never re-appears once answered or skipped.
    expect(nextStep({ ...data, address: null })).toBe('awaiting_price');
    expect(nextStep({ ...data, address: '12 Milner Rd' })).toBe(
      'awaiting_price',
    );

    const { data: merged, applied } = applyExtracted(data, {
      priceZar: 2_000_000,
      suburb: 'Claremont', // already filled, not overwritten
    });
    expect(applied).toEqual(['priceZar']);
    expect(merged.suburb).toBe('s');

    expect(
      renderSummary({
        title: 't',
        suburb: 's',
        priceZar: 2_000_000,
        bedrooms: 2,
        bathrooms: 1,
        exclusivityTermDays: 90,
        tier: 'free',
      }),
    ).toMatch(/90-day exclusive/);
  });
});
