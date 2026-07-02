import type { DealStage } from '@sell-direct/shared';
import type { Notifier } from '../notifications';
import type { DeadlineRecord, DeadlineRepository } from './repository';

/**
 * Deadline countdown engine.
 *
 * One scheduler serves every dated obligation in the transfer journey
 * (suspensive bond conditions, FICA packs, certificate bookings): deadlines are
 * auto-created when a deal enters a stage, countdown reminders go out at fixed
 * day-offsets before due, and everything unresolved for a stage is resolved the
 * moment the deal advances. Missing a suspensive-condition date is a classic
 * SA deal-killer — see docs/BOTTLENECKS.md §2.
 */

/** Day-offsets before dueAt at which a reminder is sent (descending). */
export const REMINDER_TIERS = [7, 3, 1] as const;

export interface StageDeadlineRule {
  kind: string;
  label: string;
  days: number;
}

/** Deadlines auto-created when a deal ENTERS a stage. */
export const STAGE_DEADLINES: Partial<Record<DealStage, StageDeadlineRule[]>> =
  {
    // The OTP's bond suspensive condition — customarily ~21 days.
    offer_otp: [
      { kind: 'bond_condition', label: 'bond approval condition', days: 21 },
    ],
    documents_fica: [
      { kind: 'fica_documents', label: 'FICA document pack', days: 7 },
    ],
    clearance: [
      {
        kind: 'certificate_booking',
        label: 'compliance certificate inspections',
        days: 7,
      },
    ],
  };

/** Stages whose deadlines are resolved when the deal reaches `stage`. */
const RESOLVES: Partial<Record<DealStage, string[]>> = {
  bond_application: ['bond_condition'],
  bond_granted: ['bond_condition'],
  clearance: ['fica_documents'],
  lodgement: ['fica_documents', 'certificate_booking'],
  registered: ['bond_condition', 'fica_documents', 'certificate_booking'],
  cancelled: ['bond_condition', 'fica_documents', 'certificate_booking'],
};

export interface DeadlinePartyLookup {
  (dealId: string): Promise<{
    property: string;
    buyerPhone: string;
    sellerPhone?: string;
  } | null>;
}

export interface DeadlineEngineDeps {
  repository: DeadlineRepository;
  notifier: Notifier;
  lookup: DeadlinePartyLookup;
  /** transfer_status template SID, when approved (fallback: session text). */
  transferTemplateId?: string;
  log?: (message: string, error?: unknown) => void;
}

/** Called on every deal transition: create this stage's deadlines, resolve past ones. */
export async function applyStageDeadlines(
  repository: DeadlineRepository,
  dealId: string,
  stage: DealStage,
  now: Date = new Date(),
): Promise<void> {
  const resolves = RESOLVES[stage];
  if (resolves) await repository.resolve(dealId, resolves);
  for (const rule of STAGE_DEADLINES[stage] ?? []) {
    await repository.createIfAbsent({
      dealId,
      kind: rule.kind,
      label: rule.label,
      dueAt: new Date(now.getTime() + rule.days * 86_400_000),
    });
  }
}

/** Whole days until due, rounded up (0 = due today, negative = overdue). */
export function daysUntil(dueAt: Date, now: Date): number {
  return Math.ceil((dueAt.getTime() - now.getTime()) / 86_400_000);
}

/**
 * The reminder tier that should fire now, or null.
 * Picks the MOST URGENT tier whose window has opened (e.g. 2 days out → the
 * 3-day tier, never a stale 7-day one), and fires each tier at most once —
 * so a deadline discovered late sends one timely reminder, not a backlog.
 */
export function dueTier(
  deadline: Pick<DeadlineRecord, 'dueAt' | 'remindedAt'>,
  now: Date,
): number | null {
  const days = daysUntil(deadline.dueAt, now);
  let candidate: number | null = null;
  for (const tier of REMINDER_TIERS) {
    if (days <= tier) candidate = tier; // tiers descend, so this ends most-urgent
  }
  if (candidate === null || deadline.remindedAt.includes(candidate)) {
    return null;
  }
  return candidate;
}

function reminderText(
  label: string,
  days: number,
): { stage: string; detail: string } {
  const when =
    days <= 0 ? 'due TODAY' : days === 1 ? 'due tomorrow' : `${days} days left`;
  return {
    stage: `Reminder — ${label}: ${when}`,
    detail:
      'Missing this date can cancel the sale. Reply here if you need help and our concierge will step in.',
  };
}

/**
 * One scheduler tick: send every countdown reminder that is due.
 * Idempotent — each tier is recorded per deadline, so re-runs never re-send.
 */
export async function processDueReminders(
  deps: DeadlineEngineDeps,
  now: Date = new Date(),
): Promise<number> {
  const log = deps.log ?? (() => {});
  const horizon = new Date(
    now.getTime() + Math.max(...REMINDER_TIERS) * 86_400_000,
  );
  const due = await deps.repository.listUnresolvedDueBefore(horizon);

  let sent = 0;
  for (const deadline of due) {
    const tier = dueTier(deadline, now);
    if (tier === null) continue;
    try {
      const parties = await deps.lookup(deadline.dealId);
      if (!parties) continue;
      const { stage, detail } = reminderText(
        deadline.label,
        daysUntil(deadline.dueAt, now),
      );
      const targets = [parties.buyerPhone, parties.sellerPhone].filter(
        (p): p is string => Boolean(p),
      );
      for (const to of targets) {
        await deps.notifier.send(
          to,
          `📌 Transfer update for ${parties.property}: ${stage}. ${detail}`,
          deps.transferTemplateId
            ? {
                templateId: deps.transferTemplateId,
                variables: {
                  '1': parties.property,
                  '2': stage,
                  '3': detail,
                },
              }
            : undefined,
        );
        sent += 1;
      }
      await deps.repository.markReminded(deadline.id, tier);
    } catch (error) {
      log('deadline reminder failed', error);
    }
  }
  return sent;
}

/** Start the hourly scheduler (runtime only — never in tests/buildServer). */
export function startDeadlineScheduler(
  deps: DeadlineEngineDeps,
  intervalMs = 60 * 60 * 1000,
): NodeJS.Timeout {
  const log = deps.log ?? (() => {});
  const tick = () =>
    processDueReminders(deps).catch((err) => log('deadline tick failed', err));
  void tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return timer;
}
