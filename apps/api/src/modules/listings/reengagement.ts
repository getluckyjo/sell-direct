/**
 * One nudge for a seller who started a listing and went quiet.
 *
 * A 20-seller simulation had 10% stop part-way — one at the suburb picker,
 * one at the price — and nothing ever followed up. Those drafts are the
 * cheapest demand in the funnel: the seller has already told us what they own.
 *
 * Deliberately conservative:
 *   · exactly one nudge per draft, ever (the store records it)
 *   · only after a quiet period, so nobody is chased mid-thought
 *   · a WhatsApp session expires 24 hours after the seller's last message, so
 *     beyond that only an approved template may be sent — without one
 *     configured we skip rather than send something Meta will reject
 *   · demo threads are never messaged
 */

import type { ConversationStore } from './store';
import type { IntakeState, IntakeStep } from './intake';

/** Demo threads live in a reserved, invalid SA range and must never be sent to. */
const DEMO_PHONE_RE = /^\+2700\d{7}$/;

/** WhatsApp's free-form session window, measured from the seller's last message. */
export const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface ReengagementDeps {
  store: ConversationStore;
  /** Free-text send — valid only inside the 24-hour session window. */
  send(phone: string, text: string): Promise<void>;
  /**
   * Approved-template send, for drafts already outside the window. Omit and
   * those drafts are left alone rather than sent something that would fail.
   */
  sendTemplate?: (phone: string, templateId: string) => Promise<void>;
  /** `TEMPLATE_REENGAGEMENT`; required for the out-of-window path. */
  reengagementTemplateId?: string;
  /** How long a draft must be quiet before it is nudged. Default 6 hours. */
  idleMs?: number;
  now?: () => Date;
  log?: (message: string, error?: unknown) => void;
}

export interface ReengagementRun {
  considered: number;
  nudged: number;
  skippedOutOfWindow: number;
  failed: number;
}

/** What the seller was in the middle of, so the nudge can name it. */
function describeStep(step: IntakeStep): string {
  switch (step) {
    case 'awaiting_property_type':
      return 'what kind of home it is';
    case 'awaiting_suburb':
    case 'awaiting_suburb_pick':
      return 'which suburb it is in';
    case 'awaiting_address':
      return 'the street address';
    case 'awaiting_price':
      return 'your asking price';
    case 'awaiting_bedrooms':
      return 'how many bedrooms';
    case 'awaiting_bathrooms':
      return 'how many bathrooms';
    case 'awaiting_exclusivity':
      return 'the listing term';
    case 'awaiting_confirm':
      return 'confirming your listing';
    default:
      return 'your listing';
  }
}

export function composeNudge(state: IntakeState): string {
  const where = state.data.suburb ? ` in ${state.data.suburb}` : '';
  return (
    `👋 Your Sold Direct listing${where} is still saved — we stopped at ` +
    `${describeStep(state.step)}.\n\n` +
    'Reply here to carry on where you left off; it takes about a minute. ' +
    'Reply CANCEL to discard it, or CONSULT if you’d rather talk to one ' +
    'of our practitioners first.'
  );
}

/**
 * Sweep quiet drafts and nudge each one once. Never throws: a single failed
 * send is logged and the sweep continues.
 */
export async function nudgeStaleDrafts(
  deps: ReengagementDeps,
): Promise<ReengagementRun> {
  const now = deps.now?.() ?? new Date();
  const idleMs = deps.idleMs ?? 6 * 60 * 60 * 1000;
  const log = deps.log ?? (() => {});

  const stale = await deps.store.findStale(new Date(now.getTime() - idleMs));
  const run: ReengagementRun = {
    considered: stale.length,
    nudged: 0,
    skippedOutOfWindow: 0,
    failed: 0,
  };

  for (const draft of stale) {
    if (DEMO_PHONE_RE.test(draft.phone)) continue;

    const withinSession =
      now.getTime() - draft.lastActivity.getTime() < SESSION_WINDOW_MS;
    try {
      if (withinSession) {
        await deps.send(draft.phone, composeNudge(draft.state));
      } else if (deps.sendTemplate && deps.reengagementTemplateId) {
        await deps.sendTemplate(draft.phone, deps.reengagementTemplateId);
      } else {
        // No approved template configured — sending free text here would be
        // rejected by WhatsApp, so leave the draft for a human to pick up.
        run.skippedOutOfWindow += 1;
        continue;
      }
      await deps.store.markNudged(draft.phone, now);
      run.nudged += 1;
    } catch (error) {
      run.failed += 1;
      log(`re-engagement nudge failed for ${draft.phone}`, error);
    }
  }

  return run;
}

/**
 * Runtime-only sweep. Mirrors the deadline scheduler: hourly tick, unref'd so
 * it never holds the process open, and never started from `buildServer` so
 * tests stay timer-free.
 */
export function startReengagementScheduler(
  deps: ReengagementDeps,
  intervalMs = 60 * 60 * 1000,
): NodeJS.Timeout {
  const log = deps.log ?? (() => {});
  const tick = () =>
    nudgeStaleDrafts(deps).catch((err) =>
      log('re-engagement sweep failed', err),
    );
  void tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return timer;
}
