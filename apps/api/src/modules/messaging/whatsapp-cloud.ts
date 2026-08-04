import { createHmac, timingSafeEqual } from 'node:crypto';
import { buildMetaInteractive } from './interactive';
import type {
  ChallengeQuery,
  FetchedMedia,
  InboundMedia,
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
  SendResult,
  WebhookVerifyContext,
} from './types';

/** Read a single header value regardless of string / string[] shape. */
function headerValue(
  headers: WebhookVerifyContext['headers'],
  name: string,
): string | undefined {
  const v = headers[name];
  return Array.isArray(v) ? v[0] : v;
}

export interface WhatsAppCloudConfig {
  verifyToken: string;
  appSecret: string;
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  graphBase: string;
}

export function loadWhatsAppConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): WhatsAppCloudConfig {
  return {
    verifyToken: env.WHATSAPP_VERIFY_TOKEN ?? '',
    appSecret: env.WHATSAPP_APP_SECRET ?? '',
    accessToken: env.WHATSAPP_ACCESS_TOKEN ?? '',
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? '',
    apiVersion: env.WHATSAPP_API_VERSION ?? 'v21.0',
    graphBase: env.WHATSAPP_GRAPH_BASE ?? 'https://graph.facebook.com',
  };
}

// Minimal shape of the parts of Meta's webhook payload we consume.
interface MetaInteractive {
  type?: string;
  button_reply?: { id?: string; title?: string };
  list_reply?: { id?: string; title?: string; description?: string };
  /** WhatsApp Flows completion payload — captured as text, never as an id. */
  nfm_reply?: { name?: string; body?: string; response_json?: string };
}
interface MetaMessage {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  /** A tapped reply button or list row (session interactive message). */
  interactive?: MetaInteractive;
  /** A tapped quick-reply button on an approved template. */
  button?: { payload?: string; text?: string };
}
interface MetaMediaLookup {
  url?: string;
  mime_type?: string;
}
interface MetaChangeValue {
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  messages?: MetaMessage[];
}
interface MetaWebhookPayload {
  entry?: { changes?: { value?: MetaChangeValue }[] }[];
}
interface WaSendResponse {
  messages?: { id?: string }[];
}

/**
 * WhatsApp Business Platform (Cloud API) adapter.
 *
 * POPIA: this adapter never logs message bodies or full phone numbers. Callers
 * persist messages via the repository, which keeps the raw payload free of
 * secrets.
 */
export class WhatsAppCloudAdapter implements MessagingAdapter {
  constructor(private readonly config: WhatsAppCloudConfig) {}

  verifyChallenge(query: ChallengeQuery): string | null {
    const token = this.config.verifyToken;
    if (
      token !== '' &&
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === token
    ) {
      return query['hub.challenge'] ?? null;
    }
    return null;
  }

  verifySignature(ctx: WebhookVerifyContext): boolean {
    const signatureHeader = headerValue(ctx.headers, 'x-hub-signature-256');
    if (!signatureHeader || !this.config.appSecret) return false;
    const expected =
      'sha256=' +
      createHmac('sha256', this.config.appSecret)
        .update(ctx.rawBody, 'utf8')
        .digest('hex');
    const received = Buffer.from(signatureHeader);
    const computed = Buffer.from(expected);
    if (received.length !== computed.length) return false;
    return timingSafeEqual(received, computed);
  }

  parseInbound(payload: unknown): InboundMessage[] {
    const out: InboundMessage[] = [];
    if (payload === null || typeof payload !== 'object') return out;
    const entries = (payload as MetaWebhookPayload).entry;
    if (!Array.isArray(entries)) return out;

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const messages = value?.messages;
        if (!Array.isArray(messages)) continue;
        const to =
          value?.metadata?.display_phone_number ??
          value?.metadata?.phone_number_id ??
          '';
        for (const m of messages) {
          if (!m.id || !m.from) continue;
          const media: InboundMedia | undefined =
            m.type === 'image' && m.image?.id
              ? {
                  id: String(m.image.id),
                  mimeType: m.image.mime_type,
                  caption: m.image.caption,
                }
              : undefined;
          // A tap carries a machine-readable id plus a human label. The id
          // drives routing; the label becomes `text` so the message log,
          // agent history and demo thread read like a normal conversation.
          const interactive = m.interactive;
          const replyId =
            interactive?.button_reply?.id ??
            interactive?.list_reply?.id ??
            m.button?.payload;
          const label =
            interactive?.button_reply?.title ??
            interactive?.list_reply?.title ??
            m.button?.text ??
            interactive?.nfm_reply?.body;

          out.push({
            waMessageId: String(m.id),
            from: String(m.from),
            to: String(to),
            type: String(m.type ?? 'unknown'),
            // A caption stays on `media` — it must never trigger keyword routing.
            text:
              m.text?.body !== undefined
                ? String(m.text.body)
                : label !== undefined
                  ? String(label)
                  : undefined,
            media,
            replyId: replyId !== undefined ? String(replyId) : undefined,
            timestamp: m.timestamp
              ? new Date(Number(m.timestamp) * 1000)
              : undefined,
            raw: m,
          });
        }
      }
    }
    return out;
  }

  /**
   * Send a session message. When `interactive` is set the message goes as a
   * native reply-button / list message; `message.text` becomes its body.
   * Interactive is skipped when `templateId` is set (an approved template
   * carries its own buttons, and Meta rejects `type: 'interactive'` outside
   * the 24-hour session window anyway).
   */
  async send(message: OutboundMessage): Promise<SendResult> {
    const url = `${this.config.graphBase}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
    const interactive =
      message.interactive && !message.templateId
        ? buildMetaInteractive(message.text, message.interactive)
        : null;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        ...(interactive
          ? { type: 'interactive', interactive }
          : { type: 'text', text: { body: message.text } }),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `WhatsApp send failed: ${res.status} ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json().catch(() => ({}))) as WaSendResponse;
    return { waMessageId: data.messages?.[0]?.id };
  }

  /**
   * Meta media download is two-step: resolve the media id to a short-lived
   * URL via the Graph API, then fetch that URL — both with the Bearer token.
   * Never logs the token or the media URL (it embeds access credentials).
   */
  async fetchMedia(media: InboundMedia): Promise<FetchedMedia> {
    if (!media.id) {
      throw new Error('WhatsApp media fetch failed: no media id');
    }
    const auth = { Authorization: `Bearer ${this.config.accessToken}` };

    const lookupRes = await fetch(
      `${this.config.graphBase}/${this.config.apiVersion}/${media.id}`,
      { headers: auth },
    );
    if (!lookupRes.ok) {
      const detail = await lookupRes.text().catch(() => '');
      throw new Error(
        `WhatsApp media lookup failed: ${lookupRes.status} ${detail.slice(0, 200)}`,
      );
    }
    const lookup = (await lookupRes
      .json()
      .catch(() => ({}))) as MetaMediaLookup;
    if (!lookup.url) {
      throw new Error('WhatsApp media lookup failed: no url in response');
    }

    const mediaRes = await fetch(lookup.url, { headers: auth });
    if (!mediaRes.ok) {
      throw new Error(`WhatsApp media fetch failed: ${mediaRes.status}`);
    }
    const bytes = Buffer.from(await mediaRes.arrayBuffer());
    const mimeType =
      lookup.mime_type ??
      mediaRes.headers.get('content-type') ??
      media.mimeType ??
      'image/jpeg';
    return { bytes, mimeType };
  }
}
