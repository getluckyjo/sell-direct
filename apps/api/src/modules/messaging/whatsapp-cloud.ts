import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ChallengeQuery,
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
  SendResult,
} from './types';

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
interface MetaMessage {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
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

  verifySignature(
    rawBody: string,
    signatureHeader: string | undefined,
  ): boolean {
    if (!signatureHeader || !this.config.appSecret) return false;
    const expected =
      'sha256=' +
      createHmac('sha256', this.config.appSecret)
        .update(rawBody, 'utf8')
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
          out.push({
            waMessageId: String(m.id),
            from: String(m.from),
            to: String(to),
            type: String(m.type ?? 'unknown'),
            text: m.text?.body !== undefined ? String(m.text.body) : undefined,
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

  async send(message: OutboundMessage): Promise<SendResult> {
    const url = `${this.config.graphBase}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
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
        type: 'text',
        text: { body: message.text },
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
}
