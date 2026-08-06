import type { Notifier } from '../notifications';
import type { ValuationAdapter } from '../valuation';
import { AGENT_SYSTEM_PROMPT } from './knowledge';
import {
  buildAgentTools,
  type AgentDataSource,
  type AgentIntakeAccess,
  type AgentTurnContext,
} from './tools';
import type { AgentMode, AgentModel, AgentRepository } from './types';

export interface AgentServiceDeps {
  model: AgentModel;
  repository: AgentRepository;
  data: AgentDataSource;
  notifier: Notifier;
  /**
   * shadow — draft only, nothing is sent (concierge approves from the queue).
   * live — reply is sent immediately; the draft row is kept as the audit record.
   */
  mode: AgentMode;
  /**
   * Listing-intake write access. Only exercised in live mode — a shadow
   * agent must never mutate drafts while users receive the canned replies.
   */
  intake?: AgentIntakeAccess;
  /** Optional market price estimates (read-only tool; both modes). */
  valuation?: ValuationAdapter;
  log?: (message: string, error?: unknown) => void;
}

export interface AgentInbound {
  phone: string;
  text: string;
}

export interface AgentTurnOutcome {
  /** Whether a reply actually went out to the user this turn. */
  sent: boolean;
  draftId?: string;
}

export interface AgentHandler {
  handle(message: AgentInbound): Promise<AgentTurnOutcome>;
  /** The dispatcher routes structured flows to the agent only when live. */
  readonly mode: AgentMode;
}

/**
 * One agentic turn: load the conversation, let the model reply with tools,
 * then either send (live) or park the draft for concierge review (shadow).
 * Every turn writes an AgentDraft row — that is the audit trail.
 */
export function createAgentHandler(deps: AgentServiceDeps): AgentHandler {
  const log = deps.log ?? (() => {});

  return {
    mode: deps.mode,
    async handle(message) {
      const ctx: AgentTurnContext = { escalated: false };
      const tools = buildAgentTools(
        deps.data,
        message.phone,
        ctx,
        deps.mode === 'live' ? deps.intake : undefined,
        deps.valuation,
      );

      // The webhook persists the inbound before dispatching, so the history
      // normally already ends with this message. Guard for the empty case
      // (fresh DB in tests, media-only bodies) so the model always has a turn.
      let messages = await deps.repository.conversation(message.phone);
      if (
        messages.length === 0 ||
        messages[messages.length - 1].role !== 'user'
      ) {
        messages = [...messages, { role: 'user', content: message.text }];
      }

      const reply = await deps.model.reply({
        system: AGENT_SYSTEM_PROMPT,
        messages,
        tools,
      });

      const text =
        reply.text ||
        "Thanks — I'm looping in our concierge team so a human can help you properly. They'll WhatsApp you shortly.";
      const escalated = ctx.escalated || !reply.text;

      if (deps.mode === 'live') {
        await deps.notifier.send(message.phone, text);
        const draft = await deps.repository.saveDraft({
          phone: message.phone,
          inbound: message.text,
          draft: text,
          toolCalls: reply.toolCalls,
          escalated,
          status: 'sent',
        });
        if (escalated) {
          log(
            `agent escalated thread ${message.phone}: ${ctx.escalationReason ?? 'no text reply'}`,
          );
        }
        return { sent: true, draftId: draft.id };
      }

      const draft = await deps.repository.saveDraft({
        phone: message.phone,
        inbound: message.text,
        draft: text,
        toolCalls: reply.toolCalls,
        escalated,
        status: 'pending',
      });
      return { sent: false, draftId: draft.id };
    },
  };
}
