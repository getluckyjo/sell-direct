import type { DealTier } from '@sell-direct/shared';

/**
 * Guided WhatsApp listing-intake conversation, as a pure state machine.
 *
 * Deliberately free of any database, WhatsApp or I/O concern so the whole
 * conversation can be driven and asserted in unit tests. The orchestrator
 * (service.ts) wires this to a conversation store and the listings repository.
 */
export type IntakeStep =
  | 'awaiting_title'
  | 'awaiting_suburb'
  | 'awaiting_price'
  | 'awaiting_bedrooms'
  | 'awaiting_bathrooms'
  | 'awaiting_exclusivity'
  | 'completed';

export interface ListingDraft {
  title: string;
  suburb: string;
  priceZar: number;
  bedrooms: number;
  bathrooms: number;
  exclusivityTermDays: number;
  tier: DealTier;
}

export interface IntakeState {
  step: IntakeStep;
  data: Partial<ListingDraft>;
}

export interface IntakeResult {
  state: IntakeState;
  reply: string;
  /** Present only when the conversation just produced a complete listing. */
  completed?: ListingDraft;
}

const PROMPTS: Record<Exclude<IntakeStep, 'completed'>, string> = {
  awaiting_title:
    'Let\'s list your property — 0% commission. What\'s a short headline? (e.g. "2-bed apartment in Sea Point")',
  awaiting_suburb: 'Which suburb is it in?',
  awaiting_price:
    "What's the asking price in Rand? (digits only, e.g. 2100000)",
  awaiting_bedrooms: 'How many bedrooms?',
  awaiting_bathrooms: 'How many bathrooms?',
  awaiting_exclusivity:
    'Exclusive listing term in days — reply 60, 90 or 120 (90 is recommended).',
};

/** Begin a new intake conversation. */
export function startIntake(): IntakeResult {
  return {
    state: { step: 'awaiting_title', data: { tier: 'free' } },
    reply: PROMPTS.awaiting_title,
  };
}

function parseWholeNumber(input: string): number | null {
  const digits = input.replace(/[\s,rR]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return Number.parseInt(digits, 10);
}

/** Advance the conversation with the user's latest reply. */
export function advanceIntake(state: IntakeState, input: string): IntakeResult {
  const text = input.trim();
  const data = { ...state.data };

  switch (state.step) {
    case 'awaiting_title': {
      if (text.length < 3) {
        return reask(
          state,
          'Please give a short headline (at least 3 characters).',
        );
      }
      data.title = text;
      return step('awaiting_suburb', data);
    }
    case 'awaiting_suburb': {
      if (text.length < 2) {
        return reask(state, 'Please tell me the suburb.');
      }
      data.suburb = text;
      return step('awaiting_price', data);
    }
    case 'awaiting_price': {
      const price = parseWholeNumber(text);
      if (price === null || price < 100000) {
        return reask(
          state,
          'Please send the price as digits in Rand, e.g. 2100000.',
        );
      }
      data.priceZar = price;
      return step('awaiting_bedrooms', data);
    }
    case 'awaiting_bedrooms': {
      const beds = parseWholeNumber(text);
      if (beds === null || beds > 20) {
        return reask(state, 'How many bedrooms? Please reply with a number.');
      }
      data.bedrooms = beds;
      return step('awaiting_bathrooms', data);
    }
    case 'awaiting_bathrooms': {
      const baths = parseWholeNumber(text);
      if (baths === null || baths > 20) {
        return reask(state, 'How many bathrooms? Please reply with a number.');
      }
      data.bathrooms = baths;
      return step('awaiting_exclusivity', data);
    }
    case 'awaiting_exclusivity': {
      const term = parseWholeNumber(text);
      if (term !== 60 && term !== 90 && term !== 120) {
        return reask(state, 'Please reply 60, 90 or 120.');
      }
      data.exclusivityTermDays = term;
      const completed = data as ListingDraft;
      return {
        state: { step: 'completed', data },
        reply: `Done! Your listing "${completed.title}" in ${completed.suburb} at R${completed.priceZar.toLocaleString('en-ZA')} is live. 🎉 We'll start finding buyers.`,
        completed,
      };
    }
    case 'completed':
      return {
        state,
        reply:
          'Your listing is already in. Reply "list" to add another property.',
      };
  }
}

function step(
  next: Exclude<IntakeStep, 'completed'>,
  data: Partial<ListingDraft>,
): IntakeResult {
  return { state: { step: next, data }, reply: PROMPTS[next] };
}

function reask(state: IntakeState, reply: string): IntakeResult {
  return { state, reply };
}
