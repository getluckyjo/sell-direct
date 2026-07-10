import { describe, expect, it } from 'vitest';
import {
  AGENT_PROMPT_SECTIONS,
  AGENT_SYSTEM_PROMPT,
  PROMPT_POSITIONING,
} from './knowledge';

/**
 * Locks the load-bearing facts and forbidden claims of the agent's knowledge
 * base. If a knowledge edit trips one of these, it is changing something a
 * compliance or research decision depends on — check docs/BOTTLENECKS.md and
 * CLAUDE.md before "fixing" the test.
 */
describe('agent knowledge base', () => {
  it('is composed of the ordered sections (byte-stable, no interpolation)', () => {
    expect(AGENT_SYSTEM_PROMPT).toBe(AGENT_PROMPT_SECTIONS.join('\n\n'));
    // A date or timestamp in the prompt would break prompt-cache stability.
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/20\d\d-\d\d-\d\d/);
  });

  it('stays inside the prompt budget (~4k tokens)', () => {
    expect(AGENT_SYSTEM_PROMPT.length).toBeLessThan(16_000);
  });

  it('knows the pricing tiers and core product facts', () => {
    for (const fact of [
      '0% commission',
      'FLEX (1% of the sale price',
      '60, 90 or 120',
      'water installation certificate',
      'beetle',
      'voetstoots',
      'subject to bond approval within 21 days',
      'trust account',
      'CERTS',
      'COVER',
      'MOVE',
    ]) {
      expect(AGENT_SYSTEM_PROMPT).toContain(fact);
    }
  });

  it('knows the founder-answered policies (docs/AGENT-QUESTIONS.md round 1)', () => {
    // Q4 coverage radius, Q3 rentals planned, Q11 sectional title accepted,
    // Q8 own-bank → Flex, Q2 founder escalation, Q12 Flex sellable today.
    expect(AGENT_SYSTEM_PROMPT).toContain('150 km');
    expect(AGENT_SYSTEM_PROMPT).toMatch(/rental arm is planned/);
    expect(AGENT_SYSTEM_PROMPT).toMatch(/Sectional title .*is welcome/);
    expect(AGENT_SYSTEM_PROMPT).toMatch(/falls under Flex \(1%\)/);
    expect(AGENT_SYSTEM_PROMPT).toContain('Johannes');
    expect(AGENT_SYSTEM_PROMPT).toMatch(/Flex is available today/);
    // Q7 stays SOFT until the mandate contract is legal-reviewed: help the
    // seller review options, never a hard "cannot withdraw" rule.
    expect(AGENT_SYSTEM_PROMPT).toMatch(/help them review the options/);
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/cannot withdraw|withdrawal requires .*approval/i);
    // Q1/Q2: no invented contact channels or fixed hours.
    expect(AGENT_SYSTEM_PROMPT).toMatch(/Never give out a phone number or email/);
  });

  it('keeps the mandatory attribution framings', () => {
    expect(AGENT_SYSTEM_PROMPT).toContain('resubmitted via our originator');
    expect(AGENT_SYSTEM_PROMPT).toContain(
      "customarily the seller's responsibility under the offer to purchase",
    );
    expect(AGENT_SYSTEM_PROMPT).toMatch(/achieved average, never a promise/);
  });

  it('never contains refuted claims, banned framings or internal economics', () => {
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/valid for (two|2) years/i);
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/responsible by law/i);
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/reply VIEW\b/);
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/we guarantee/i);
    // Dataroom values must never enter the prompt — the model cannot leak
    // what is not in context.
    expect(AGENT_SYSTEM_PROMPT).not.toMatch(/R52|R71|Paysoft/);
  });

  it('names the banned framings only inside the positioning ban list', () => {
    // The positioning section legitimately quotes the banned phrases as
    // instructions; nowhere else may use them.
    expect(PROMPT_POSITIONING).toContain('resented cost');
    const rest = AGENT_PROMPT_SECTIONS.filter(
      (s) => s !== PROMPT_POSITIONING,
    ).join('\n\n');
    expect(rest).not.toContain('resented cost');
    expect(rest).not.toMatch(/\bobsolete\b/i);
  });
});
