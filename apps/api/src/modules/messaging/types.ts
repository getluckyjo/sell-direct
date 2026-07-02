/**
 * Messaging seam. The rest of the app talks WhatsApp only through
 * `MessagingAdapter`, so the BSP (WhatsApp Cloud API direct / Twilio /
 * Clickatell / 360dialog) can be swapped without touching business logic.
 */

/** A normalised inbound message, provider-agnostic. */
export interface InboundMessage {
  /** Provider message id — used for idempotent persistence. */
  waMessageId: string;
  /** Sender's WhatsApp number (PII — the contact key). */
  from: string;
  /** Our receiving number / display number. */
  to: string;
  /** Message type (text, image, …). */
  type: string;
  /** Text body, when present. */
  text?: string;
  timestamp?: Date;
  /** The raw provider message node (must be free of secrets before persisting). */
  raw: unknown;
}

/** An outbound message to send. */
export interface OutboundMessage {
  /** Recipient WhatsApp number. */
  to: string;
  /** Session-message body / template fallback text. */
  text: string;
  /**
   * Provider template identifier for business-initiated messages sent outside
   * the 24-hour session window (Twilio Content SID / Meta template name).
   * When set, the adapter sends the approved template instead of free text.
   */
  templateId?: string;
  /** Template variable substitutions, keyed by the template's placeholders. */
  variables?: Record<string, string>;
}

export interface SendResult {
  waMessageId?: string;
}

/** Query params Meta sends to the GET verification handshake. */
export type ChallengeQuery = Record<string, string | undefined>;

/**
 * Everything an adapter may need to verify an inbound webhook's authenticity.
 * Meta signs the raw JSON body (`x-hub-signature-256`); Twilio signs the full
 * URL + sorted form params (`x-twilio-signature`) — so the context carries both.
 */
export interface WebhookVerifyContext {
  /** Exact raw request body bytes (used by Meta's HMAC). */
  rawBody: string;
  /** Parsed body: Meta JSON object, or Twilio's form fields as a record. */
  body: unknown;
  /** Request headers (adapter picks the signature header it needs). */
  headers: Record<string, string | string[] | undefined>;
  /** Full public URL the provider called (used by Twilio's signature). */
  url: string;
}

export interface MessagingAdapter {
  /** Meta webhook verification handshake — returns the challenge to echo, or null to reject. */
  verifyChallenge(query: ChallengeQuery): string | null;
  /** Verify the inbound webhook signature for this provider. */
  verifySignature(ctx: WebhookVerifyContext): boolean;
  /** Parse an inbound webhook payload into normalised messages (non-message events ignored). */
  parseInbound(payload: unknown): InboundMessage[];
  /** Send an outbound message. */
  send(message: OutboundMessage): Promise<SendResult>;
}
