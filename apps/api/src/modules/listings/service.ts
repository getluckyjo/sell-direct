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
    if (START_RE.test(text)) {
      // "sell my 4 bed in Mowbray" — the trigger message itself may carry
      // fields, and its remainder may be a perfectly good headline.
      const remainder = text.replace(TRIGGER_PREFIX_RE, '').trim();
      const extracted = await safeExtract(extractor, text, [
        ...FIELD_ORDER,
        'address',
      ]);
      if (remainder.length >= 3 && extracted.title === undefined) {
        extracted.title = remainder;
      }
      const started = await withPriceGuidance(deps, startIntake(extracted));
      await deps.store.set(message.phone, started.state);
      return { reply: started.reply, options: started.options };
    }
    return {
      reply:
        'Hi! I can put your property on the market with 0% commission — you ' +
        'stay in control, our team handles the admin. What would you like to do?',
      // `fallback` still lets the AI concierge claim the turn; when it does,
      // its own reply goes out instead of this menu.
      options: {
        kind: 'buttons',
        options: [
          { id: 'list', title: 'List my property' },
          { id: 'HOW', title: 'How it works' },
          { id: 'CONSULT', title: 'Talk to us' },
        ],
      },
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
