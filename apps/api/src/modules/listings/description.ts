import { START_RE } from './service';
import { DESCRIPTION_OPTIONS } from './intake';
import type { OnboardingStore } from './onboarding';
import type { DescriptionDrafter, ListingFacts } from './drafter';
import type { ReplyOptions } from '../messaging/interactive';

/**
 * The optional post-publish description step.
 *
 * The seller has three one-tap choices: skip it, write it themselves, or have
 * it drafted for them. A draft is only ever a proposal — nothing reaches the
 * listing until the seller taps "Use this", and the scripted path never
 * rewrites what a seller typed. Free text at any point is stored VERBATIM,
 * exactly as before. SKIP-able throughout; keyword triggers fall through so
 * "list" still starts a fresh intake.
 */
const SKIP_RE = /^\s*(skip|no|nope|later)\b/i;
const ENQUIRE_RE = /^enquire\b/i;
/** Control ids from the description buttons (each also typeable). */
const DRAFT_RE = /^\s*draft\s*$/i;
const TYPE_RE = /^\s*type\s*$/i;
const USE_RE = /^\s*use\s*$/i;
const MAX_DESCRIPTION_LENGTH = 2000;

/** Offered with a proposed draft — the seller always has the last word. */
const DRAFT_REVIEW_OPTIONS: ReplyOptions = {
  kind: 'buttons',
  options: [
    { id: 'USE', title: '✅ Use this' },
    { id: 'DRAFT', title: 'Try again' },
    { id: 'TYPE', title: 'I’ll write it' },
  ],
};

const PHOTO_NUDGE =
  '📸 Send your photos whenever you’re ready — your listing goes live with ' +
  'the first one.';

export interface DescriptionDeps {
  onboarding: OnboardingStore;
  setDescription: (listingId: string, description: string) => Promise<void>;
  /**
   * Optional "Write it for me" support. Without it, that button is never
   * offered and the step behaves exactly as it always has.
   */
  drafter?: DescriptionDrafter;
  /** Facts the drafter may use — never more than the seller told us. */
  listingFacts?: (listingId: string) => Promise<ListingFacts | null>;
}

export interface DescriptionResult {
  handled: boolean;
  reply?: string;
  options?: ReplyOptions;
}

export async function handleDescriptionMessage(
  deps: DescriptionDeps,
  message: { phone: string; text: string },
): Promise<DescriptionResult> {
  const state = await deps.onboarding.get(message.phone);
  if (!state) return { handled: false };

  const text = message.text.trim();
  if (text === '' || START_RE.test(text) || ENQUIRE_RE.test(text)) {
    // A new flow (or a pure photo message) — abandon the description step.
    if (START_RE.test(text) || ENQUIRE_RE.test(text)) {
      await deps.onboarding.clear(message.phone);
    }
    return { handled: false };
  }

  if (SKIP_RE.test(text)) {
    await deps.onboarding.clear(message.phone);
    return {
      handled: true,
      reply: `No problem — you can add a description any time. ${PHOTO_NUDGE}`,
    };
  }

  // "Use this" — the seller approved the draft we showed them.
  if (USE_RE.test(text) && state.draft) {
    await deps.setDescription(
      state.listingId,
      state.draft.slice(0, MAX_DESCRIPTION_LENGTH),
    );
    await deps.onboarding.clear(message.phone);
    return {
      handled: true,
      reply: `Description saved 👌 ${PHOTO_NUDGE}`,
    };
  }

  // "Write it for me" / "Try again".
  if (DRAFT_RE.test(text) && deps.drafter && deps.listingFacts) {
    const facts = await deps.listingFacts(state.listingId);
    const draft = facts ? await deps.drafter.draft(facts) : null;
    if (!draft) {
      // Silent failure by contract — never strand the seller.
      return {
        handled: true,
        reply:
          'I couldn’t draft one just now — send a sentence or two in your own ' +
          'words and I’ll save it, or skip for now.',
        options: DESCRIPTION_OPTIONS,
      };
    }
    await deps.onboarding.set(message.phone, { ...state, draft });
    return {
      handled: true,
      reply:
        `Here’s a draft — nothing is saved until you say so:\n\n"${draft}"\n\n` +
        'Happy with it?',
      options: DRAFT_REVIEW_OPTIONS,
    };
  }

  // "I'll write it" — invite the seller's own words.
  if (TYPE_RE.test(text)) {
    return {
      handled: true,
      reply:
        'Go ahead — a sentence or two about what makes it special. I’ll save ' +
        'it exactly as you write it.',
    };
  }

  // Anything else is the seller's own description, stored verbatim.
  await deps.setDescription(
    state.listingId,
    text.slice(0, MAX_DESCRIPTION_LENGTH),
  );
  await deps.onboarding.clear(message.phone);
  return {
    handled: true,
    reply: `Description saved 👌 ${PHOTO_NUDGE}`,
  };
}
