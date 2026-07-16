import { START_RE } from './service';
import type { OnboardingStore } from './onboarding';

/**
 * The optional post-publish description step (scripted path). The seller's
 * next text message after confirming a listing is stored VERBATIM as the
 * portal description — the scripted path never rewrites; only the live agent
 * drafts copy, and only with explicit approval. SKIP-able; keyword triggers
 * fall through so "list" still starts a fresh intake.
 */
const SKIP_RE = /^\s*(skip|no|nope|later)\b/i;
const ENQUIRE_RE = /^enquire\b/i;
const MAX_DESCRIPTION_LENGTH = 2000;

export interface DescriptionDeps {
  onboarding: OnboardingStore;
  setDescription: (listingId: string, description: string) => Promise<void>;
}

export interface DescriptionResult {
  handled: boolean;
  reply?: string;
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
      reply:
        'No problem — you can add a description any time. 📸 Send your photos ' +
        'whenever you’re ready and your listing goes live with the first one.',
    };
  }

  await deps.setDescription(
    state.listingId,
    text.slice(0, MAX_DESCRIPTION_LENGTH),
  );
  await deps.onboarding.clear(message.phone);
  return {
    handled: true,
    reply:
      'Description saved 👌 Now send 5–10 photos whenever you’re ready — ' +
      'your listing goes live with the first one.',
  };
}
