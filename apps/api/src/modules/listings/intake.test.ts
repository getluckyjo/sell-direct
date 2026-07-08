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
    expect(r.reply).toMatch(/R2[\s,.  ]?100[\s,.  ]?000/);
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
      priceZar: 2100000,
      bedrooms: 2,
      bathrooms: 1,
      exclusivityTermDays: 90,
      tier: 'free',
    });
  });

  it('never re-asks fields the headline already answered (the Mowbray bug)', () => {
    let r = startIntake();
    r = advanceIntake(r.state, '4 bedroom home in mowbray', {
      suburb: 'Mowbray',
      bedrooms: 4,
    });

    expect(r.state.step).toBe('awaiting_price'); // suburb + bedrooms skipped
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
    // Exclusivity now leads to the confirm step, not instant publish.
    expect(advanceIntake(base, '120').state.step).toBe('awaiting_confirm');
  });

  it('confirm-step edits overwrite fields and re-render the summary', () => {
    const base: IntakeState = {
      step: 'awaiting_confirm',
      data: {
        title: '4 bedroom home in mowbray',
        suburb: 'Mowbray',
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
    expect(r.reply).toMatch(/4[\s,.  ]?500[\s,.  ]?000/);
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
    expect(r.state.step).toBe('awaiting_price');
    expect(r.reply).not.toMatch(DOUBLE_QUESTION);
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
    expect(nextStep(data)).toBe('awaiting_price');

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
