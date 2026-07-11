import {
  advanceIntake,
  missingFields,
  startIntake,
  FIELD_ORDER,
  type ExtractableField,
  type ExtractedListingFields,
  type ListingDraft,
} from './intake';
import { createNoopExtractor, type IntakeFieldExtractor } from './extractor';
import type { ConversationStore } from './store';
import type { OnboardingStore } from './onboarding';

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
}

export interface IntakeMessage {
  phone: string;
  text: string;
}

export interface IntakeReply {
  reply: string;
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
      const started = startIntake(extracted);
      await deps.store.set(message.phone, started.state);
      return { reply: started.reply };
    }
    return {
      reply:
        'Hi! Reply "list" to put your property on the market with 0% commission.',
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
    editable.length > 0
      ? await safeExtract(extractor, text, editable)
      : {};

  const result = advanceIntake(existing, text, extracted);
  if (result.completed) {
    const listing = await deps.createListing(message.phone, result.completed);
    await deps.store.clear(message.phone);
    await deps.onboarding?.set(message.phone, { listingId: listing.id });
    return { reply: result.reply, listingId: listing.id };
  }

  await deps.store.set(message.phone, result.state);
  return { reply: result.reply };
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
