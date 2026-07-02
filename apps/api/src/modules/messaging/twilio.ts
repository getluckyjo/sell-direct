import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
  SendResult,
  WebhookVerifyContext,
} from './types';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  /** WhatsApp sender, E.164 (e.g. +27...) or a full `whatsapp:+27...`. */
  from: string;
  /** Optional Messaging Service SID — used instead of `from` when set. */
  messagingServiceSid: string;
  /** Twilio REST base (override for tests). */
  apiBase: string;
  /**
   * The exact public URL Twilio is configured to call. Twilio's signature is
   * computed over this URL, so behind a proxy set it explicitly; otherwise the
   * URL reconstructed from forwarded headers is used.
   */
  webhookUrl: string;
}

export function loadTwilioConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TwilioConfig {
  return {
    accountSid: env.TWILIO_ACCOUNT_SID ?? '',
    authToken: env.TWILIO_AUTH_TOKEN ?? '',
    from: env.TWILIO_WHATSAPP_FROM ?? '',
    messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID ?? '',
    apiBase: env.TWILIO_API_BASE ?? 'https://api.twilio.com',
    webhookUrl: env.TWILIO_WEBHOOK_URL ?? '',
  };
}

function headerValue(
  headers: WebhookVerifyContext['headers'],
  name: string,
): string | undefined {
  const v = headers[name];
  return Array.isArray(v) ? v[0] : v;
}

/** Strip Twilio's `whatsapp:` channel prefix, leaving the E.164 number. */
function stripChannel(value: string): string {
  return value.replace(/^whatsapp:/i, '');
}

/** Ensure a number carries the `whatsapp:` channel prefix for the Send API. */
function withChannel(value: string): string {
  return /^whatsapp:/i.test(value) ? value : `whatsapp:${value}`;
}

interface TwilioSendResponse {
  sid?: string;
}

/**
 * Twilio WhatsApp adapter.
 *
 * Differences from the Meta Cloud API adapter:
 *   • inbound is `application/x-www-form-urlencoded`, not JSON;
 *   • the signature is base64 HMAC-SHA1 of (URL + alphabetically-sorted
 *     concatenated form params), sent as `X-Twilio-Signature`;
 *   • sending uses the Twilio REST Messages API (Basic auth), with templates
 *     addressed by Content SID.
 *
 * POPIA: never logs message bodies or full phone numbers; the raw node we
 * persist is Twilio's form fields, which carry no secrets.
 */
export class TwilioWhatsAppAdapter implements MessagingAdapter {
  constructor(private readonly config: TwilioConfig) {}

  /** Twilio has no GET challenge handshake; always reject the GET verify. */
  verifyChallenge(): string | null {
    return null;
  }

  verifySignature(ctx: WebhookVerifyContext): boolean {
    const received = headerValue(ctx.headers, 'x-twilio-signature');
    if (!received || !this.config.authToken) return false;

    const url = this.config.webhookUrl || ctx.url;
    const params =
      ctx.body && typeof ctx.body === 'object'
        ? (ctx.body as Record<string, string>)
        : {};

    // Twilio: URL followed by each POST param (sorted by key) as key+value.
    const data =
      url +
      Object.keys(params)
        .sort()
        .map((key) => key + String(params[key]))
        .join('');

    const expected = createHmac('sha1', this.config.authToken)
      .update(Buffer.from(data, 'utf8'))
      .digest('base64');

    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  parseInbound(payload: unknown): InboundMessage[] {
    if (payload === null || typeof payload !== 'object') return [];
    const p = payload as Record<string, string>;
    const sid = p.MessageSid ?? p.SmsMessageSid ?? p.SmsSid;
    const from = p.From;
    if (!sid || !from) return [];

    const numMedia = Number(p.NumMedia ?? '0');
    const type =
      numMedia > 0 ? (p.MediaContentType0?.split('/')[0] ?? 'media') : 'text';
    // Quick-reply / list buttons arrive as ButtonText; fall back to Body.
    const text =
      p.Body !== undefined && p.Body !== ''
        ? String(p.Body)
        : p.ButtonText !== undefined
          ? String(p.ButtonText)
          : undefined;

    return [
      {
        waMessageId: String(sid),
        from: stripChannel(String(from)),
        to: stripChannel(String(p.To ?? '')),
        type,
        text,
        // Twilio's inbound webhook carries no message timestamp; use receipt time.
        timestamp: undefined,
        raw: p,
      },
    ];
  }

  async send(message: OutboundMessage): Promise<SendResult> {
    const url = `${this.config.apiBase}/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const form = new URLSearchParams();
    form.set('To', withChannel(message.to));
    if (this.config.messagingServiceSid) {
      form.set('MessagingServiceSid', this.config.messagingServiceSid);
    } else {
      form.set('From', withChannel(this.config.from));
    }

    if (message.templateId) {
      form.set('ContentSid', message.templateId);
      if (message.variables) {
        form.set('ContentVariables', JSON.stringify(message.variables));
      }
    } else {
      form.set('Body', message.text);
    }

    const auth = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`,
    ).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `Twilio send failed: ${res.status} ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json().catch(() => ({}))) as TwilioSendResponse;
    return { waMessageId: data.sid };
  }
}
