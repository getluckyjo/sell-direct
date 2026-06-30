export const APP_NAME = 'Sold Direct';

/**
 * Deal stages model the South African property transfer journey.
 *
 * This is the shared source of truth for the stage names. The full state
 * machine — valid transitions plus the append-only deal_events log — is
 * implemented in PR 2 (deals module).
 */
export const DEAL_STAGES = [
  'enquiry',
  'offer_otp',
  'bond_application',
  'bond_granted',
  'documents_fica',
  'clearance',
  'lodgement',
  'registered',
  'cancelled',
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

/** Commercial path a deal is on (affects the conditional 0% commission). */
export type DealTier = 'free' | 'flex';
