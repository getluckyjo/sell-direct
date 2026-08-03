import { describe, expect, it } from 'vitest';
import {
  advanceIntake,
  applyExtracted,
  missingFields,
  nextStep,
  renderSummary,
  startIntake,
  composeTitle,
  optionsFor,
  validateField,
  withComposedTitle,
  type IntakeState,
  type IntakeStep,
} from './intake';
import type { ReplyOptions } from '../messaging/interactive';
import { CAPE_TOWN_REGIONS, MAX_SUBURBS_PER_REGION } from './suburbs';

const DOUBLE_QUESTION = /which suburb|how many bedrooms/i;

describe('listing intake state machine', () => {
  it('walks a full happy path to a confirmed listing', () => {
    let r = startIntake();
    expect(r.state.step).toBe('awaiting_property_type');

    r = advanceIntake(r.state, 'apartment');
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
    expect(r.reply).toMatch(/R2[\s,.  ]?100[\s,.  ]?000/);
    expect(r.reply).toMatch(/publish now/i);

    r = advanceIntake(r.state, 'YES');
    expect(r.state.step).toBe('completed');
    // Listing now pends until the first photo arrives.
    expect(r.reply).toMatch(/confirmed/i);
    expect(r.reply).toMatch(/photos/i);
    expect(r.reply).toMatch(/skip/i);
    expect(r.reply).not.toMatch(/is live/i);
    expect(r.completed).toEqual({
      // Composed from the taps — the seller never typed a headline.
      title: '2-bed apartment in Sea Point',
      propertyType: 'apartment',
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
      data: { propertyType: 'house', suburb: 'Sea Point', tier: 'free' },
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
        propertyType: 'house',
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
      propertyType: 'house',
      suburb: 'Mowbray',
      bedrooms: 4,
      title: '4 bedroom home in mowbray',
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
      propertyType: 'house',
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
      data: { propertyType: 'house', suburb: 'y', tier: 'free' },
    };
    const r = advanceIntake(state, 'five million rand', {
      priceZar: 5_000_000,
    });
    expect(r.state.data.priceZar).toBe(5_000_000);
    expect(r.state.step).toBe('awaiting_bedrooms');
  });

  it('drops invalid extracted values instead of applying them', () => {
    let r = startIntake();
    r = advanceIntake(r.state, 'house', {
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
      data: { propertyType: 'house', suburb: 'y', tier: 'free' },
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
        propertyType: 'house',
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
        propertyType: 'house',
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
    expect(r.reply).toMatch(/4[\s,.  ]?500[\s,.  ]?000/);
    expect(r.completed).toBeUndefined();

    const junk = advanceIntake(base, 'hmmmm');
    expect(junk.state.step).toBe('awaiting_confirm');
    expect(junk.reply).toMatch(/publish now/i);
  });

  it('startIntake with extracted trigger fields skips answered questions', () => {
    const r = startIntake({
      propertyType: 'house',
      suburb: 'Mowbray',
      bedrooms: 4,
    });
    expect(r.state.step).toBe('awaiting_address');
    expect(r.reply).not.toMatch(DOUBLE_QUESTION);

    // A trigger that already states the address skips that question too.
    const withAddress = startIntake({
      propertyType: 'house',
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

    const data = {
      propertyType: 'house' as const,
      suburb: 's',
      tier: 'free' as const,
    };
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
        propertyType: 'house',
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

/** A complete draft sitting at the confirm step. */
function confirmState(): IntakeState {
  return {
    step: 'awaiting_confirm',
    data: {
      title: '2-bed apartment in Sea Point',
      propertyType: 'apartment',
      suburb: 'Sea Point',
      address: '12 Milner Road',
      priceZar: 2100000,
      bedrooms: 2,
      bathrooms: 1,
      exclusivityTermDays: 90,
      tier: 'free',
    },
  };
}

function ids(options: ReplyOptions | undefined): string[] {
  if (!options) return [];
  return options.kind === 'buttons'
    ? options.options.map((o) => o.id)
    : options.sections.flatMap((s) => s.rows.map((r) => r.id));
}

describe('intake reply options', () => {
  it('offers the exclusivity term as three buttons', () => {
    const state: IntakeState = { step: 'awaiting_exclusivity', data: {} };
    const options = optionsFor('awaiting_exclusivity', state);
    expect(options?.kind).toBe('buttons');
    expect(ids(options)).toEqual(['60', '90', '120']);
  });

  it('offers bedrooms as a list including studio, bathrooms without', () => {
    const bed = optionsFor('awaiting_bedrooms', { step: 'awaiting_bedrooms', data: {} });
    expect(bed?.kind).toBe('list');
    expect(ids(bed)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
    const bath = optionsFor('awaiting_bathrooms', { step: 'awaiting_bathrooms', data: {} });
    expect(ids(bath)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('offers a skip button on the optional address step', () => {
    expect(ids(optionsFor('awaiting_address', { step: 'awaiting_address', data: {} })))
      .toEqual(['SKIP']);
  });

  it('offers price buttons only when an estimate is known', () => {
    const without: IntakeState = { step: 'awaiting_price', data: {} };
    expect(optionsFor('awaiting_price', without)).toBeUndefined();

    const withEstimate: IntakeState = {
      step: 'awaiting_price',
      data: {},
      estimate: { lowZar: 1_900_000, highZar: 2_300_000, source: 'test' },
    };
    // Rounded to R50k: low / mid / high of the band.
    expect(ids(optionsFor('awaiting_price', withEstimate))).toEqual([
      '1900000',
      '2100000',
      '2300000',
    ]);
  });

  it('dedupes price buttons when the band is narrow', () => {
    const state: IntakeState = {
      step: 'awaiting_price',
      data: {},
      estimate: { lowZar: 2_000_000, highZar: 2_010_000, source: 'test' },
    };
    expect(ids(optionsFor('awaiting_price', state))).toEqual(['2000000']);
  });

  it('never exceeds WhatsApp limits: 3 buttons, 10 list rows', () => {
    const steps: IntakeStep[] = [
      'awaiting_address',
      'awaiting_price',
      'awaiting_bedrooms',
      'awaiting_bathrooms',
      'awaiting_exclusivity',
      'awaiting_confirm',
      'awaiting_edit_choice',
    ];
    for (const step of steps) {
      const options = optionsFor(step, confirmState());
      if (!options) continue;
      if (options.kind === 'buttons') {
        expect(options.options.length).toBeLessThanOrEqual(3);
      } else {
        expect(ids(options).length).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('intake option ids are valid typed answers', () => {
  // The invariant the whole design rests on: tapping an option must be
  // exactly equivalent to typing its id, so a tap and a typed reply share
  // one code path and keyword-only providers lose nothing.
  const cases: { step: IntakeStep; state: () => IntakeState }[] = [
    {
      step: 'awaiting_exclusivity',
      state: () => ({
        step: 'awaiting_exclusivity',
        data: {
          propertyType: 'house',
          suburb: 's',
          address: null,
          priceZar: 2100000,
          bedrooms: 2,
          bathrooms: 1,
          tier: 'free',
        },
      }),
    },
    {
      step: 'awaiting_bedrooms',
      state: () => ({
        step: 'awaiting_bedrooms',
        data: { propertyType: 'house', suburb: 's', address: null, priceZar: 2100000, tier: 'free' },
      }),
    },
    {
      step: 'awaiting_bathrooms',
      state: () => ({
        step: 'awaiting_bathrooms',
        data: {
          propertyType: 'house',
          suburb: 's',
          address: null,
          priceZar: 2100000,
          bedrooms: 2,
          tier: 'free',
        },
      }),
    },
    {
      step: 'awaiting_address',
      state: () => ({
        step: 'awaiting_address',
        data: { propertyType: 'house', suburb: 's', tier: 'free' },
      }),
    },
    { step: 'awaiting_confirm', state: confirmState },
    {
      step: 'awaiting_edit_choice',
      state: () => ({ ...confirmState(), step: 'awaiting_edit_choice' }),
    },
  ];

  for (const { step, state } of cases) {
    it(`every ${step} option id is understood as text`, () => {
      const base = state();
      const options = optionsFor(step, base);
      for (const id of ids(options)) {
        const result = advanceIntake(base, id);
        // Understood = it moved on (or completed/cancelled), never re-asked.
        const movedOn =
          result.state.step !== step ||
          result.completed !== undefined ||
          result.cancelled === true;
        expect(movedOn, `"${id}" was not understood at ${step}`).toBe(true);
      }
    });
  }

  it('price button ids parse as prices', () => {
    const state: IntakeState = {
      step: 'awaiting_price',
      data: { propertyType: 'house', suburb: 's', address: null, tier: 'free' },
      estimate: { lowZar: 1_900_000, highZar: 2_300_000, source: 'test' },
    };
    for (const id of ids(optionsFor('awaiting_price', state))) {
      const result = advanceIntake(state, id);
      expect(result.state.data.priceZar).toBe(Number(id));
    }
  });
});

describe('confirm-step controls', () => {
  it('EDIT opens the field picker, and BACK returns to the summary', () => {
    const opened = advanceIntake(confirmState(), 'EDIT');
    expect(opened.state.step).toBe('awaiting_edit_choice');
    expect(ids(opened.options)).toContain('EDIT:priceZar');
    expect(ids(opened.options)).toContain('BACK');

    const back = advanceIntake(opened.state, 'BACK');
    expect(back.state.step).toBe('awaiting_confirm');
    expect(back.reply).toMatch(/here's your listing/i);
  });

  it('picking a field re-asks only that field, then returns to the summary', () => {
    const opened = advanceIntake(confirmState(), 'EDIT');
    const picked = advanceIntake(opened.state, 'EDIT:priceZar');
    expect(picked.state.step).toBe('awaiting_price');
    expect(picked.state.data.priceZar).toBeUndefined();
    // Everything else survives the edit.
    expect(picked.state.data.bedrooms).toBe(2);
    expect(picked.state.data.suburb).toBe('Sea Point');

    const answered = advanceIntake(picked.state, '2450000');
    expect(answered.state.step).toBe('awaiting_confirm');
    expect(answered.state.data.priceZar).toBe(2450000);
  });

  it('re-asking the address routes back through the address step', () => {
    const opened = advanceIntake(confirmState(), 'EDIT');
    const picked = advanceIntake(opened.state, 'EDIT:address');
    expect(picked.state.step).toBe('awaiting_address');
    expect(advanceIntake(picked.state, 'SKIP').state.step).toBe('awaiting_confirm');
  });

  it('ignores an unknown field id and keeps the picker on screen', () => {
    const opened = advanceIntake(confirmState(), 'EDIT');
    const bogus = advanceIntake(opened.state, 'EDIT:tier');
    expect(bogus.state.step).toBe('awaiting_edit_choice');
    expect(ids(bogus.options)).toContain('BACK');
  });

  it('CANCEL discards the draft', () => {
    const cancelled = advanceIntake(confirmState(), 'CANCEL');
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.completed).toBeUndefined();
    expect(cancelled.reply).toMatch(/discarded/i);
  });

  it('still publishes on a typed "yes"', () => {
    expect(advanceIntake(confirmState(), 'yes').completed).toBeDefined();
  });

  it('still accepts a typed correction at the summary', () => {
    const edited = advanceIntake(confirmState(), 'price 4500000', {
      priceZar: 4500000,
    });
    expect(edited.state.data.priceZar).toBe(4500000);
    expect(edited.state.step).toBe('awaiting_confirm');
  });
});

describe('two-tap suburb picker', () => {
  const start = (): IntakeState => ({
    step: 'awaiting_suburb',
    data: { propertyType: 'house', tier: 'free' },
  });

  it('offers the regions, plus a way out to free text', () => {
    const options = optionsFor('awaiting_suburb', start());
    expect(options?.kind).toBe('list');
    expect(ids(options)).toEqual([
      'REGION:atlantic',
      'REGION:citybowl',
      'REGION:southern',
      'REGION:northern',
      'REGION:falsebay',
      'REGION:westcoast',
      'OTHER',
    ]);
  });

  it('drills from a region into its suburbs and sets the suburb', () => {
    const picked = advanceIntake(start(), 'REGION:southern');
    expect(picked.state.step).toBe('awaiting_suburb_pick');
    expect(picked.state.pending?.region).toBe('southern');
    expect(ids(picked.options)).toContain('Newlands');

    const chosen = advanceIntake(picked.state, 'Newlands');
    expect(chosen.state.data.suburb).toBe('Newlands');
    expect(chosen.state.step).not.toBe('awaiting_suburb_pick');
  });

  it('keeps every suburb list inside WhatsApp’s 10-row limit', () => {
    for (const region of CAPE_TOWN_REGIONS) {
      expect(region.suburbs.length).toBeLessThanOrEqual(MAX_SUBURBS_PER_REGION);
      const state: IntakeState = {
        step: 'awaiting_suburb_pick',
        data: {},
        pending: { region: region.id },
      };
      // suburbs + "Other" + "Another region"
      expect(ids(optionsFor('awaiting_suburb_pick', state)).length).toBeLessThanOrEqual(10);
    }
  });

  it('goes back to the region list from a suburb list', () => {
    const picked = advanceIntake(start(), 'REGION:southern');
    const back = advanceIntake(picked.state, 'REGION:back');
    expect(back.state.step).toBe('awaiting_suburb');
    expect(ids(back.options)).toContain('REGION:atlantic');
    expect(back.state.data.suburb).toBeUndefined();
  });

  it('never stores a control id as the suburb', () => {
    // "REGION:southern" and "OTHER" are >= 2 chars, so validateField would
    // happily accept them — the control branch has to win.
    expect(advanceIntake(start(), 'REGION:southern').state.data.suburb).toBeUndefined();
    const other = advanceIntake(start(), 'OTHER');
    expect(other.state.data.suburb).toBeUndefined();
    expect(other.reply).toMatch(/what’s the suburb called/i);

    const picked = advanceIntake(start(), 'REGION:southern');
    expect(advanceIntake(picked.state, 'OTHER').state.data.suburb).toBeUndefined();
  });

  it('still accepts a typed suburb at the region step', () => {
    const typed = advanceIntake(start(), 'Mowbray');
    expect(typed.state.data.suburb).toBe('Mowbray');
  });

  it('accepts a typed suburb that is not on the region list', () => {
    const picked = advanceIntake(start(), 'REGION:southern');
    const typed = advanceIntake(picked.state, 'Harfield Village');
    expect(typed.state.data.suburb).toBe('Harfield Village');
  });
});

describe('property type picker and composed headline', () => {
  it('asks for the property type first, as a list', () => {
    const r = startIntake();
    expect(r.state.step).toBe('awaiting_property_type');
    expect(ids(r.options)).toEqual([
      'house',
      'apartment',
      'townhouse',
      'estate',
      'land',
      'other',
    ]);
  });

  it('every property-type id is understood as text', () => {
    const base = startIntake().state;
    for (const id of ids(optionsFor('awaiting_property_type', base))) {
      expect(advanceIntake(base, id).state.data.propertyType).toBe(id);
    }
  });

  it('composes a headline from the taps', () => {
    expect(
      composeTitle({ propertyType: 'apartment', suburb: 'Sea Point', bedrooms: 3 }),
    ).toBe('3-bed apartment in Sea Point');
    expect(
      composeTitle({ propertyType: 'apartment', suburb: 'Sea Point', bedrooms: 0 }),
    ).toBe('Studio apartment in Sea Point');
    expect(composeTitle({ propertyType: 'land', suburb: 'Noordhoek', bedrooms: 0 })).toBe(
      'Vacant land in Noordhoek',
    );
    expect(composeTitle({ propertyType: 'estate', suburb: 'Durbanville', bedrooms: 4 })).toBe(
      '4-bed home in a secure estate in Durbanville',
    );
    // Not enough to say anything real yet.
    expect(composeTitle({ propertyType: 'house' })).toBeUndefined();
    expect(composeTitle({ suburb: 'Newlands' })).toBeUndefined();
    // Bedrooms not yet known — still a usable headline.
    expect(composeTitle({ propertyType: 'house', suburb: 'Newlands' })).toBe(
      'House in Newlands',
    );
  });

  it('a seller-written headline always beats the composed one', () => {
    const stated = withComposedTitle({
      title: 'Sunny cottage with mountain views',
      propertyType: 'house',
      suburb: 'Newlands',
      bedrooms: 3,
    });
    expect(stated.title).toBe('Sunny cottage with mountain views');
  });

  it('lets a seller write their own headline from the edit list', () => {
    const opened = advanceIntake(confirmState(), 'EDIT');
    expect(ids(opened.options)).toContain('EDIT:title');
    const picked = advanceIntake(opened.state, 'EDIT:title');
    expect(picked.state.step).toBe('awaiting_title');
    expect(picked.state.data.title).toBeUndefined();

    const written = advanceIntake(picked.state, 'Sunny 2-bed with sea views');
    expect(written.state.data.title).toBe('Sunny 2-bed with sea views');
    expect(written.state.step).toBe('awaiting_confirm');

    // Too short → re-asked, not silently accepted.
    expect(advanceIntake(picked.state, 'x').state.step).toBe('awaiting_title');
  });

  it('re-picking the property type recomposes the headline', () => {
    const noTitle: IntakeState = {
      ...confirmState(),
      data: { ...confirmState().data, title: undefined },
    };
    const picked = advanceIntake(advanceIntake(noTitle, 'EDIT').state, 'EDIT:propertyType');
    expect(picked.state.step).toBe('awaiting_property_type');
    const done = advanceIntake(picked.state, 'townhouse');
    expect(done.state.step).toBe('awaiting_confirm');
    expect(done.reply).toContain('2-bed townhouse in Sea Point');
  });

  it('rejects a property type that is not on the list', () => {
    expect(validateField('propertyType', 'castle')).toBeNull();
    expect(validateField('propertyType', 'HOUSE')).toBe('house');
  });
});
