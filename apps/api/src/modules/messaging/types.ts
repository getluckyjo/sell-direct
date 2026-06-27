/**
 * Messaging seam. The rest of the app talks WhatsApp only through
 * `MessagingAdapter`, so the BSP (WhatsApp Cloud API direct / Clickatell /
 * 360dialog / Twilio) can be swapped without touching business logic.
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
  text: string;
}

export interface SendResult {
  waMessageId?: string;
}

/** Query params Meta sends to the GET verification handshake. */
export type ChallengeQuery = Record<string, string | undefined>;

export interface MessagingAdapter {
  /** Meta webhook verification handshake — returns the challenge to echo, or null to reject. */
  verifyChallenge(query: ChallengeQuery): string | null;
  /** Verify `X-Hub-Signature-256` against the raw request body. */
  verifySignature(
    rawBody: string,
    signatureHeader: string | undefined,
  ): boolean;
  /** Parse an inbound webhook payload into normalised messages (non-message events ignored). */
  parseInbound(payload: unknown): InboundMessage[];
  /** Send an outbound message. */
  send(message: OutboundMessage): Promise<SendResult>;
}
