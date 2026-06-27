import { advanceIntake, startIntake, type ListingDraft } from './intake';
import type { ConversationStore } from './store';

export interface ListingIntakeDeps {
  store: ConversationStore;
  createListing: (
    phone: string,
    draft: ListingDraft,
  ) => Promise<{ id: string }>;
}

export interface IntakeMessage {
  phone: string;
  text: string;
}

export interface IntakeReply {
  reply: string;
  /** Set when this message completed the flow and created a listing. */
  listingId?: string;
}

const START_RE = /^(list|sell)\b/i;

/**
 * Orchestrate one inbound message through the listing-intake flow: look up the
 * conversation, advance the pure state machine, persist the new state, and on
 * completion create the listing and clear the conversation.
 */
export async function handleListingIntakeMessage(
  deps: ListingIntakeDeps,
  message: IntakeMessage,
): Promise<IntakeReply> {
  const text = message.text.trim();
  const existing = await deps.store.get(message.phone);

  if (!existing) {
    if (START_RE.test(text)) {
      const started = startIntake();
      await deps.store.set(message.phone, started.state);
      return { reply: started.reply };
    }
    return {
      reply:
        'Hi! Reply "list" to put your property on the market with 0% commission.',
    };
  }

  const result = advanceIntake(existing, text);
  if (result.completed) {
    const listing = await deps.createListing(message.phone, result.completed);
    await deps.store.clear(message.phone);
    return { reply: result.reply, listingId: listing.id };
  }

  await deps.store.set(message.phone, result.state);
  return { reply: result.reply };
}
