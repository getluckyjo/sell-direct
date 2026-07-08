import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TwilioWhatsAppAdapter, type TwilioConfig } from './twilio';
import type { WebhookVerifyContext } from './types';

const config: TwilioConfig = {
  accountSid: 'AC_test',
  authToken: 'twilio-auth-token',
  from: '+14155238886',
  messagingServiceSid: '',
  apiBase: 'https://api.twilio.example',
  webhookUrl: '', // reconstruct from ctx.url
};

const adapter = new TwilioWhatsAppAdapter(config);

const WEBHOOK_URL = 'https://api.example/api/webhooks/whatsapp';

/** Twilio: base64 HMAC-SHA1 of (URL + sorted key+value concatenation). */
function twilioSignature(url: string, params: Record<string, string>): string {
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join('');
  return createHmac('sha1', config.authToken)
    .update(Buffer.from(data, 'utf8'))
    .digest('base64');
}

function ctx(
  params: Record<string, string>,
  signature?: string,
): WebhookVerifyContext {
  return {
    rawBody: new URLSearchParams(params).toString(),
    body: params,
    headers: signature ? { 'x-twilio-signature': signature } : {},
    url: WEBHOOK_URL,
  };
}

const INBOUND = {
  MessageSid: 'SM123',
  From: 'whatsapp:+27820001111',
  To: 'whatsapp:+14155238886',
  Body: 'Is the Sea Point flat still available?',
  NumMedia: '0',
};

describe('TwilioWhatsAppAdapter.verifyChallenge', () => {
  it('always returns null (Twilio has no GET handshake)', () => {
    expect(adapter.verifyChallenge()).toBeNull();
  });
});

describe('TwilioWhatsAppAdapter.verifySignature', () => {
  it('accepts a correctly-signed request', () => {
    const sig = twilioSignature(WEBHOOK_URL, INBOUND);
    expect(adapter.verifySignature(ctx(INBOUND, sig))).toBe(true);
  });

  it('rejects a tampered param', () => {
    const sig = twilioSignature(WEBHOOK_URL, INBOUND);
    const tampered = { ...INBOUND, Body: 'different' };
    expect(adapter.verifySignature(ctx(tampered, sig))).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(adapter.verifySignature(ctx(INBOUND, undefined))).toBe(false);
  });

  it('uses the configured webhook URL when set', () => {
    const fixed = new TwilioWhatsAppAdapter({
      ...config,
      webhookUrl: 'https://fixed.example/hook',
    });
    const sig = twilioSignature('https://fixed.example/hook', INBOUND);
    // ctx.url differs, but the configured URL is what Twilio signed.
    expect(fixed.verifySignature(ctx(INBOUND, sig))).toBe(true);
  });
});

describe('TwilioWhatsAppAdapter.parseInbound', () => {
  it('normalises a form payload and strips the whatsapp: prefix', () => {
    const [msg] = adapter.parseInbound(INBOUND);
    expect(msg).toMatchObject({
      waMessageId: 'SM123',
      from: '+27820001111',
      to: '+14155238886',
      type: 'text',
      text: 'Is the Sea Point flat still available?',
    });
  });

  it('reads a quick-reply button as text', () => {
    const [msg] = adapter.parseInbound({
      MessageSid: 'SM9',
      From: 'whatsapp:+27820001111',
      Body: '',
      ButtonText: 'YES',
    });
    expect(msg.text).toBe('YES');
  });

  it('returns [] for a non-message payload', () => {
    expect(adapter.parseInbound({ AccountSid: 'AC' })).toEqual([]);
    expect(adapter.parseInbound(null)).toEqual([]);
  });
});

describe('TwilioWhatsAppAdapter.send', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs a session text with Basic auth and the whatsapp: channel', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ sid: 'SMout' }), { status: 201 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.send({ to: '+27820001111', text: 'Yes!' });

    expect(result.waMessageId).toBe('SMout');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.twilio.example/2010-04-01/Accounts/AC_test/Messages.json',
    );
    expect(init.headers.Authorization).toMatch(/^Basic /);
    const body = new URLSearchParams(init.body as string);
    expect(body.get('To')).toBe('whatsapp:+27820001111');
    expect(body.get('From')).toBe('whatsapp:+14155238886');
    expect(body.get('Body')).toBe('Yes!');
  });

  it('sends a template via ContentSid + ContentVariables', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ sid: 'SMtpl' }), { status: 201 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await adapter.send({
      to: '+27820001111',
      text: 'fallback',
      templateId: 'HXabc123',
      variables: { '1': 'Maria' },
    });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body as string);
    expect(body.get('ContentSid')).toBe('HXabc123');
    expect(body.get('ContentVariables')).toBe(JSON.stringify({ '1': 'Maria' }));
    expect(body.get('Body')).toBeNull();
  });

  it('prefers a Messaging Service SID over From when configured', async () => {
    const svc = new TwilioWhatsAppAdapter({
      ...config,
      messagingServiceSid: 'MG123',
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ sid: 'SMx' }), { status: 201 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await svc.send({ to: '+27820001111', text: 'Hi' });

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body as string);
    expect(body.get('MessagingServiceSid')).toBe('MG123');
    expect(body.get('From')).toBeNull();
  });

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('bad', { status: 400 })),
    );
    await expect(adapter.send({ to: 'x', text: 'y' })).rejects.toThrow(
      /Twilio send failed: 400/,
    );
  });
});

describe('TwilioWhatsAppAdapter media', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses inbound media into media (Body becomes the caption, not text)', () => {
    const [msg] = adapter.parseInbound({
      MessageSid: 'SM123',
      From: 'whatsapp:+27820001111',
      To: 'whatsapp:+14155238886',
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.example/media/ME123',
      MediaContentType0: 'image/jpeg',
      Body: 'our lounge',
    });
    expect(msg.type).toBe('image');
    expect(msg.text).toBeUndefined();
    expect(msg.media).toEqual({
      url: 'https://api.twilio.example/media/ME123',
      mimeType: 'image/jpeg',
      caption: 'our lounge',
    });
  });

  it('fetchMedia downloads with Basic auth', async () => {
    const bytes = Buffer.from('img');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(bytes, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.fetchMedia({
      url: 'https://api.twilio.example/media/ME123',
    });

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.bytes.equals(bytes)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.twilio.example/media/ME123');
    const expectedAuth =
      'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    expect(init.headers.Authorization).toBe(expectedAuth);
  });
});
