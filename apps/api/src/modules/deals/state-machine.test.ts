import { describe, it, expect } from 'vitest';
import { DEAL_STAGES, type DealStage } from '@sell-direct/shared';
import {
  DEAL_TRANSITIONS,
  canTransition,
  assertTransition,
  nextStages,
  isTerminal,
  InvalidTransitionError,
} from './state-machine';

const HAPPY_PATH: DealStage[] = [
  'enquiry',
  'offer_otp',
  'bond_application',
  'bond_granted',
  'documents_fica',
  'clearance',
  'lodgement',
  'registered',
];

describe('deal state machine', () => {
  it('defines a transition list for every stage', () => {
    for (const stage of DEAL_STAGES) {
      expect(DEAL_TRANSITIONS[stage]).toBeDefined();
    }
  });

  it('allows the full happy path step by step', () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(canTransition(HAPPY_PATH[i], HAPPY_PATH[i + 1])).toBe(true);
    }
  });

  it('allows cancellation from every non-terminal stage', () => {
    for (const stage of DEAL_STAGES) {
      if (isTerminal(stage)) continue;
      expect(canTransition(stage, 'cancelled')).toBe(true);
    }
  });

  it('treats registered and cancelled as terminal', () => {
    expect(isTerminal('registered')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(nextStages('registered')).toHaveLength(0);
    expect(nextStages('cancelled')).toHaveLength(0);
  });

  it('rejects skipping a stage', () => {
    expect(canTransition('enquiry', 'bond_application')).toBe(false);
    expect(canTransition('offer_otp', 'registered')).toBe(false);
  });

  it('rejects backward transitions', () => {
    expect(canTransition('bond_granted', 'offer_otp')).toBe(false);
    expect(canTransition('registered', 'lodgement')).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const stage of DEAL_STAGES) {
      expect(canTransition(stage, stage)).toBe(false);
    }
  });

  it('assertTransition throws InvalidTransitionError on an illegal move', () => {
    expect(() => assertTransition('enquiry', 'registered')).toThrow(
      InvalidTransitionError,
    );
  });

  it('assertTransition is silent on a legal move', () => {
    expect(() => assertTransition('clearance', 'lodgement')).not.toThrow();
  });
});
