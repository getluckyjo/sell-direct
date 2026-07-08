/**
 * WhatsApp demo simulator. The whole production pipeline runs for real —
 * dispatcher, scripted flows, AI concierge, Postgres — only the transport is
 * simulated: inbound arrives via an HTTP endpoint instead of a BSP webhook,
 * and outbound is persisted to the message log instead of hitting Meta/Twilio.
 *
 * Demo threads live in a reserved, invalid SA number range (+2700…) so they
 * can never collide with a real WhatsApp user once the BSP goes live.
 */

/** Only numbers in this shape may enter the demo pipeline. */
export const DEMO_PHONE_RE = /^\+2700\d{7}$/;

export interface DemoMessage {
  direction: 'inbound' | 'outbound';
  body: string;
  createdAt: Date;
}

export interface DemoRepository {
  /** Full demo thread for a phone, oldest first. */
  conversation(phone: string): Promise<DemoMessage[]>;
}
