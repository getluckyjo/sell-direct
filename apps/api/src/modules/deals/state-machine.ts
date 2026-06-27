import type { DealStage } from '@sell-direct/shared';

/**
 * The deal state machine — the heart of Sell Direct.
 *
 * Models the South African property transfer journey as an explicit set of
 * allowed transitions. The flow is linear (enquiry → … → registered); a deal
 * may be `cancelled` from any non-terminal stage. `registered` and `cancelled`
 * are terminal.
 *
 * This module is intentionally free of any database or I/O concerns so the
 * transition rules can be unit-tested in isolation.
 */
export const DEAL_TRANSITIONS: Record<DealStage, readonly DealStage[]> = {
  enquiry: ['offer_otp', 'cancelled'],
  offer_otp: ['bond_application', 'cancelled'],
  bond_application: ['bond_granted', 'cancelled'],
  bond_granted: ['documents_fica', 'cancelled'],
  documents_fica: ['clearance', 'cancelled'],
  clearance: ['lodgement', 'cancelled'],
  lodgement: ['registered', 'cancelled'],
  registered: [],
  cancelled: [],
};

/** Stages from which no further transition is possible. */
export function isTerminal(stage: DealStage): boolean {
  return DEAL_TRANSITIONS[stage].length === 0;
}

/** Whether moving directly from `from` to `to` is allowed. */
export function canTransition(from: DealStage, to: DealStage): boolean {
  return DEAL_TRANSITIONS[from].includes(to);
}

/** The stages reachable in one step from `from`. */
export function nextStages(from: DealStage): readonly DealStage[] {
  return DEAL_TRANSITIONS[from];
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: DealStage,
    readonly to: DealStage,
  ) {
    super(`Invalid deal transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Throws {@link InvalidTransitionError} if the transition is not allowed. */
export function assertTransition(from: DealStage, to: DealStage): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
