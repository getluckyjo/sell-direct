/**
 * Agent seam. The rest of the app talks to the AI concierge only through
 * these interfaces, so the model provider (Anthropic today) sits behind an
 * adapter — same pattern as the messaging BSP seam.
 */

/** One turn of conversation history handed to the model. */
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * A tool the model may call while composing a reply. Implementations wrap
 * existing module services — the agent talks, code decides. Tools must never
 * mutate state that requires consent or a registered practitioner.
 */
export interface AgentToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool input (object type). */
  inputSchema: Record<string, unknown>;
  /** Execute the tool; the returned string goes back to the model. */
  run(input: unknown): Promise<string>;
}

export interface AgentModelRequest {
  system: string;
  messages: AgentMessage[];
  tools: AgentToolDefinition[];
}

export interface AgentModelReply {
  /** Final reply text (empty when the model produced no text). */
  text: string;
  /** Names of tools invoked while composing the reply (audit trail). */
  toolCalls: string[];
}

/** Model-provider adapter (Anthropic implementation in model.ts). */
export interface AgentModel {
  reply(request: AgentModelRequest): Promise<AgentModelReply>;
}

/** How agent replies leave the building. */
export type AgentMode = 'shadow' | 'live';

export interface AgentDraftRecord {
  id: string;
  phone: string;
  inbound: string;
  draft: string;
  toolCalls: string[];
  escalated: boolean;
  status: 'pending' | 'approved' | 'dismissed' | 'sent';
  createdAt: Date;
}

export interface AgentRepository {
  /**
   * Recent conversation with this phone number, oldest first, mapped to model
   * roles (inbound → user, outbound → assistant). Includes the current
   * inbound message (the webhook persists before dispatching).
   */
  conversation(phone: string, limit?: number): Promise<AgentMessage[]>;
  saveDraft(draft: {
    phone: string;
    inbound: string;
    draft: string;
    toolCalls: string[];
    escalated: boolean;
    status: AgentDraftRecord['status'];
  }): Promise<{ id: string }>;
  listDrafts(status?: AgentDraftRecord['status']): Promise<AgentDraftRecord[]>;
  getDraft(id: string): Promise<AgentDraftRecord | null>;
  markReviewed(
    id: string,
    status: 'approved' | 'dismissed',
  ): Promise<void>;
}
