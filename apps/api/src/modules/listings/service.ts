import {
  advanceIntake,
  missingFields,
  optionsFor,
  startIntake,
  FIELD_ORDER,
  type ExtractableField,
  type ExtractedListingFields,
  type IntakeResult,
  type IntakeState,
  type ListingDraft,
} from './intake';
import { createNoopExtractor, type IntakeFieldExtractor } from './extractor';
import type { ReplyOptions } from '../messaging/interactive';
import type { ConversationStore } from './store';
import type { OnboardingStore } from './onboarding';
import {
  renderEstimateLine,
  type PriceEstimate,
  type ValuationAdapter,
} from '../valuation';

export interface ListingIntakeDeps {
  store: ConversationStore;
  createListing: (
    phone: string,
    draft: ListingDraft,
  ) => Promise<{ id: string }>;
  /**
   * Optional LLM field extractor — lets a reply like "4 bedroom home in
   * Mowbray" fill several fields at once so no question is ever repeated.
   * Defaults to a noop (strictly scripted behaviour).
   */
  extractor?: IntakeFieldExtractor;
  /**
   * Optional post-publish state: when set, the seller's next text message is
   * treated as the (optional, SKIP-able) listing description.
   */
  onboarding?: OnboardingStore;
  /**
   * Optional price guidance (LOOM). Looked up ONCE per conversation when the
   * price question is reached; null (the production default while
   * unconfigured) means guidance is silently skipped — a fabricated range
   * must never reach a real seller.
   */
  valuation?: ValuationAdapter;
  /** Persists the shown estimate onto the listing at publish time. */
  saveEstimate?: (listingId: string, estimate: PriceEstimate) => Promise<void>;
}

export interface IntakeMessage {
  phone: string;
  text: string;
}

export interface IntakeReply {
  reply: string;
  /** Tappable options to send with the reply (one-tap answers). */
  options?: ReplyOptions;
  /** Set when this message completed the flow and created a listing. */
  listingId?: string;
  /**
   * True when the message matched no flow (no active draft, no trigger) and
   * `reply` is only the generic help text — the dispatcher may hand these to
   * the AI concierge instead.
   */
  fallback?: boolean;
}

export const START_RE = /^(list|sell)\b/i;
/** Trigger words + filler to strip when the trigger message carries a headline. */
const TRIGGER_PREFIX_RE = /^(list|sell)\b[\s:,-]*(my\s+|our\s+|the\s+)?/i;

/**
 * "List my property" on the welcome menu. A bare "list" now opens the welcome
 * (bio + menu) rather than the first question, so the menu row needs its own
 * keyword to *begin* the intake — otherwise tapping it would re-open the menu
 * it was tapped from.
 */
export const BEGIN_RE = /^(start|begin)\b/i;

/**
 * True when a message should *begin* the guided intake: the menu's START row,
 * or a trigger that already carries detail ("sell my 4 bed in Mowbray").
 *
 * A bare "list" is deliberately excluded — it opens the welcome menu, which
 * stays deterministic (and answerable with the AI concierge switched off).
 */
export function beginsIntake(text: string): boolean {
  const trimmed = text.trim();
  if (BEGIN_RE.test(trimmed)) return true;
  if (!START_RE.test(trimmed)) return false;
  return trimmed.replace(TRIGGER_PREFIX_RE, '').trim().length >= 3;
}

/**
 * The opening most sellers see. "list" is the advertised entry word, so it
 * leads with a short how-it-works bio and a dropdown menu instead of jumping
 * straight into the first question — a cold opener needs orientation before
 * it needs a form.
 */
export const WELCOME_REPLY =
  '👋 Welcome to Sold Direct — sell your Cape Town home with 0% commission.\n\n' +
  'How it works:\n' +
  '1️⃣ You build your listing right here — a few taps, no forms.\n' +
  '2️⃣ We syndicate it and send buyer enquiries straight to you.\n' +
  '3️⃣ Buyers pre-qualify for a bond in the chat, so you know who’s real.\n' +
  '4️⃣ Our registered property practitioners and WhatsApp concierge handle ' +
  'the offer, FICA and transfer admin with you.\n\n' +
  'What would you like to do?';

/** The welcome dropdown. Row ids are keywords the dispatcher already parses. */
export function welcomeMenu(): ReplyOptions {
  return {
    kind: 'list',
    button: 'Choose an option',
    sections: [
      {
        title: 'Sold Direct',
        rows: [
          {
            id: 'START',
            title: 'List my property',
            description: 'Build your listing in a few taps — live today.',
          },
          {
            id: 'HOW',
            title: 'How it works',
            description: 'The full journey, from listing to transfer.',
          },
          {
            id: 'COST',
            title: 'What it costs',
            description: 'How 0% commission works, and when it applies.',
          },
          {
            id: 'CONSULT',
            title: 'Talk to our team',
            description: 'A registered practitioner calls you back.',
          },
        ],
      },
    ],
  };
}

/**
 * Orchestrate one inbound message through the listing-intake flow: look up the
 * conversation, extract any fields the message already contains, advance the
 * data-first state machine, persist the new state, and on confirmation create
 * the listing and clear the conversation.
 */
export async function handleListingIntakeMessage(
  deps: ListingIntakeDeps,
  message: IntakeMessage,
): Promise<IntakeReply> {
  const text = message.text.trim();
  const extractor = deps.extractor ?? createNoopExtractor();
  const existing = await deps.store.get(message.phone);

  if (!existing) {
    // "List my property" from the welcome menu — skip the bio, ask question 1.
    if (BEGIN_RE.test(text)) {
      const started = await withPriceGuidance(deps, startIntake({}));
      await deps.store.set(message.phone, started.state);
      return { reply: started.reply, options: started.options };
    }
    if (START_RE.test(text)) {
      // "sell my 4 bed in Mowbray" — the trigger message itself may carry
      // fields, and its remainder may be a perfectly good headline. A seller
      // who already told us something should never be sent back to a menu.
      const remainder = text.replace(TRIGGER_PREFIX_RE, '').trim();
      if (remainder.length < 3) {
        // Bare "list" — the advertised opener. Orient first, then the menu.
        return { reply: WELCOME_REPLY, options: welcomeMenu() };
      }
      const extracted = await safeExtract(extractor, text, [
        ...FIELD_ORDER,
        'address',
      ]);
      if (extracted.title === undefined) {
        extracted.title = remainder;
      }
      const started = await withPriceGuidance(deps, startIntake(extracted));
      await deps.store.set(message.phone, started.state);
      return { reply: started.reply, options: started.options };
    }
    return {
      reply: WELCOME_REPLY,
      options: welcomeMenu(),
      // `fallback` still lets the AI concierge claim the turn; when it does,
      // its own reply goes out instead of this menu.
      fallback: true,
    };
  }

  // Editable set: the missing fields (plus the optional address while it is
  // unanswered) — or everything at the confirm step, where "price 4500000"
  // style corrections may overwrite.
  const editable: readonly ExtractableField[] =
    existing.step === 'awaiting_confirm'
      ? [...FIELD_ORDER, 'address']
      : [
          ...missingFields(existing.data),
          ...(existing.data.address === undefined
            ? (['address'] as const)
            : []),
        ];
  const extracted =
    editable.length > 0 ? await safeExtract(extractor, text, editable) : {};

  const result = await withPriceGuidance(
    deps,
    advanceIntake(existing, text, extracted),
    existing,
  );
  if (result.cancelled) {
    await deps.store.clear(message.phone);
    return { reply: result.reply };
  }
  if (result.completed) {
    const listing = await deps.createListing(message.phone, result.completed);
    // The estimate the seller saw at the price step sticks to the listing.
    if (existing.estimate && deps.saveEstimate) {
      await deps.saveEstimate(listing.id, existing.estimate);
    }
    await deps.store.clear(message.phone);
    await deps.onboarding?.set(message.phone, { listingId: listing.id });
    return {
      reply: result.reply,
      options: result.options,
      listingId: listing.id,
    };
  }

  await deps.store.set(message.phone, result.state);
  return { reply: result.reply, options: result.options };
}

/**
 * When the conversation lands on the price question, fetch the market
 * estimate ONCE (cached on the conversation state — `null` records a lookup
 * with no data) and append the guidance line to the price prompt. Best
 * effort: any failure records null and the prompt goes out unchanged.
 */
async function withPriceGuidance(
  deps: ListingIntakeDeps,
  result: IntakeResult,
  previous?: IntakeState,
): Promise<IntakeResult> {
  // The pure machine builds fresh states — carry the cached estimate over.
  let state: IntakeState = { ...result.state };
  if (state.estimate === undefined && previous?.estimate !== undefined) {
    state = { ...state, estimate: previous.estimate };
  }
  if (!deps.valuation || result.completed || state.step !== 'awaiting_price') {
    // Only the price step's options depend on the estimate. Everything else
    // keeps what the machine produced — recomputing here would wipe options
    // the machine attached outside the step table (e.g. the description
    // buttons on the publish confirmation).
    return {
      ...result,
      state,
      options:
        state.step === 'awaiting_price' && !result.completed
          ? optionsFor(state.step, state)
          : result.options,
    };
  }
  if (state.estimate === undefined) {
    let estimate: PriceEstimate | null = null;
    try {
      estimate = await deps.valuation.estimate({
        address: state.data.address,
        suburb: state.data.suburb ?? '',
        bedrooms: state.data.bedrooms,
        bathrooms: state.data.bathrooms,
      });
    } catch {
      estimate = null;
    }
    state = { ...state, estimate };
  }
  const reply =
    state.estimate && /asking price/i.test(result.reply)
      ? `${result.reply}\n${renderEstimateLine(state.estimate)}`
      : result.reply;
  // The estimate arrives after the machine ran, so the price buttons (built
  // from the band) can only be computed here.
  return { ...result, state, reply, options: optionsFor(state.step, state) };
}

/** Extraction is best-effort — a failure must never stall the conversation. */
async function safeExtract(
  extractor: IntakeFieldExtractor,
  text: string,
  fields: readonly ExtractableField[],
): Promise<ExtractedListingFields> {
  try {
    return await extractor.extract(text, fields);
  } catch {
    return {};
  }
}
