/**
 * Browser entry point for the standalone (hostable) demo.
 *
 * Bundles the REAL conversation code — the same `intake.ts` state machine,
 * the same `welcome.ts` copy and the same deterministic demo valuation
 * adapter the server uses — so a hosted page behaves identically to the
 * WhatsApp flow. Only the things that need a server are replaced: the
 * conversation store becomes an in-memory object, and no listing is written
 * to Postgres.
 *
 * Deliberately imports the leaf modules rather than `../listings` (the barrel
 * re-exports the LLM extractor, which pulls the Anthropic SDK into the
 * bundle). Anything imported here must stay free of Node and network code.
 */

import {
  advanceIntake,
  optionsFor,
  startIntake,
  withComposedTitle,
  type IntakeResult,
  type IntakeState,
} from '../listings/intake';
import {
  beginsIntake,
  COST_RE,
  COST_REPLY,
  HOW_RE,
  HOW_REPLY,
  START_RE,
  TRIGGER_PREFIX_RE,
  WELCOME_REPLY,
  welcomeMenu,
} from '../listings/welcome';
import { createDemoValuationAdapter } from '../valuation/factory';
import { renderEstimateLine } from '../valuation/types';
import type { ReplyOptions } from '../messaging/interactive';

export interface FlowReply {
  text: string;
  options?: ReplyOptions;
}

const valuation = createDemoValuationAdapter();

/** Mirrors the dispatcher's CONSULT acknowledgement. */
const CONSULT_RE = /^\s*consult\s*$/i;
const CONSULT_REPLY =
  '👍 Great — our team will WhatsApp you shortly for a free, no-obligation ' +
  'pricing chat about your home. The asking price is always yours; we bring ' +
  'the recent-sales data.';

const MENU_FOOTER: ReplyOptions = {
  kind: 'buttons',
  options: [
    { id: 'START', title: 'List my property' },
    { id: 'HOW', title: 'How it works' },
    { id: 'COST', title: 'What it costs' },
  ],
};

/**
 * One seller conversation. `state` is the same `IntakeState` the server keeps
 * in Postgres — here it just lives in a closure.
 */
export function createFlow() {
  let state: IntakeState | null = null;

  /** The server's withPriceGuidance, minus the persistence. */
  async function withPriceGuidance(
    result: IntakeResult,
    previous?: IntakeState | null,
  ): Promise<IntakeResult> {
    let next: IntakeState = { ...result.state };
    if (next.estimate === undefined && previous?.estimate !== undefined) {
      next = { ...next, estimate: previous.estimate };
    }
    if (result.completed || next.step !== 'awaiting_price') {
      return {
        ...result,
        state: next,
        options:
          next.step === 'awaiting_price' && !result.completed
            ? optionsFor(next.step, next)
            : result.options,
      };
    }
    if (next.estimate === undefined) {
      let estimate = null;
      try {
        estimate = await valuation.estimate({
          address: next.data.address,
          suburb: next.data.suburb ?? '',
          bedrooms: next.data.bedrooms,
          bathrooms: next.data.bathrooms,
        });
      } catch {
        estimate = null;
      }
      next = { ...next, estimate };
    }
    const line = next.estimate ? renderEstimateLine(next.estimate) : '';
    return {
      ...result,
      state: next,
      reply: line ? `${result.reply}\n\n${line}` : result.reply,
      options: optionsFor(next.step, next),
    };
  }

  return {
    /** Feed one inbound message (typed text, or a tapped option's id). */
    async send(text: string): Promise<FlowReply> {
      const input = text.trim();

      if (!state) {
        if (HOW_RE.test(input)) {
          return { text: HOW_REPLY, options: MENU_FOOTER };
        }
        if (COST_RE.test(input)) {
          return { text: COST_REPLY, options: MENU_FOOTER };
        }
        if (CONSULT_RE.test(input)) {
          return { text: CONSULT_REPLY, options: MENU_FOOTER };
        }
        if (beginsIntake(input)) {
          const extracted = START_RE.test(input)
            ? { title: input.replace(TRIGGER_PREFIX_RE, '').trim() }
            : {};
          const started = await withPriceGuidance(startIntake(extracted));
          state = started.state;
          return { text: started.reply, options: started.options };
        }
        // Bare "list" and anything unrecognised: orient, then the dropdown.
        return { text: WELCOME_REPLY, options: welcomeMenu() };
      }

      const result = await withPriceGuidance(
        advanceIntake(state, input),
        state,
      );
      if (result.cancelled) {
        state = null;
        return { text: result.reply };
      }
      if (result.completed) {
        state = null;
        return { text: result.reply, options: result.options };
      }
      state = result.state;
      return { text: result.reply, options: result.options };
    },

    /**
     * The live conversation state — the same typed record the server persists.
     * Exposed so the page can show chat turning into structured data as it
     * happens, which is the whole point of the flow.
     */
    snapshot(): { step: string; data: IntakeState['data'] } | null {
      // Composed through the same helper the summary uses, so the headline
      // shown here is exactly the one that gets persisted.
      return state
        ? { step: state.step, data: withComposedTitle(state.data) }
        : null;
    },

    reset(): void {
      state = null;
    },
  };
}
