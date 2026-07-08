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
  /** 'text' | 'image' — image bubbles render via mediaId. */
  type: string;
  /** Serve the image via GET /api/demo/media/:id (in-memory stash). */
  mediaId?: string;
  createdAt: Date;
}

export interface DemoRepository {
  /** Full demo thread for a phone, oldest first. */
  conversation(phone: string): Promise<DemoMessage[]>;
}

/**
 * In-memory stash for demo photo bytes. Deliberately ephemeral: image
 * bubbles in old demo threads 404 after an API restart while the text rows
 * persist — an acceptable demo limitation. (Production photos go through the
 * real StorageProvider; this stash only feeds the demo's fetchMedia.)
 */
export interface DemoMediaStore {
  put(bytes: Buffer, mimeType: string): string;
  get(id: string): { bytes: Buffer; mimeType: string } | undefined;
}

export function createDemoMediaStore(): DemoMediaStore {
  const items = new Map<string, { bytes: Buffer; mimeType: string }>();
  let seq = 0;
  return {
    put(bytes, mimeType) {
      seq += 1;
      const id = `demomedia-${Date.now()}-${seq}`;
      items.set(id, { bytes, mimeType });
      return id;
    },
    get(id) {
      return items.get(id);
    },
  };
}
