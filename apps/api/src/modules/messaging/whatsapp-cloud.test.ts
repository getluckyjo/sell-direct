import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WhatsAppCloudAdapter,
  type WhatsAppCloudConfig,
} from './whatsapp-cloud';

const config: WhatsAppCloudConfig = {
  verifyToken: 'verify-me',
  appSecret: 'app-secret',
  accessToken: 'access-token',
  phoneNumberId: '123456',
  apiVersion: 'v21.0',
  graphBase: 'https://graph.example',
};

const adapter = new WhatsAppCloudAdapter(config);

function sign(body: string): string {
  return (
    'sha256=' +
    createHmac('sha256', config.appSecret).update(body).digest('hex')
  );
}

function ctx(rawBody: string, signature?: string) {
  return {
    rawBody,
    body: {},
    headers: signature
      ? { 'x-hub-signature-256': signature }
      : ({} as Record<string, string | string[] | undefined>),
    url: 'https://api.example/api/webhooks/whatsapp',
  };
}

/** Wrap a single Meta message node in the webhook envelope. */
function inboundWith(message: Record<string, unknown>) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { display_phone_number: '27210000000' },
              messages: [message],
            },
          },
        ],
      },
    ],
  };
}

const SAMPLE_INBOUND = {
  object: 'whatsapp_business_account',
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { display_phone_number: '27210000000' },
            messages: [
              {
                id: 'wamid.ABC',
                from: '27820001111',
                type: 'text',
                timestamp: '1700000000',
                text: { body: 'Hi, is the Sea Point flat still available?' },
              },
            ],
          },
        },
      ],
    },
  ],
};

describe('WhatsAppCloudAdapter.verifyChallenge', () => {
  it('echoes the challenge when mode + token match', () => {
    expect(
      adapter.verifyChallenge({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'verify-me',
        'hub.challenge': '42',
      }),
    ).toBe('42');
  });

  it('rejects a wrong token', () => {
    expect(
      adapter.verifyChallenge({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'nope',
        'hub.challenge': '42',
      }),
    ).toBeNull();
  });

  it('rejects when the configured token is empty', () => {
    const open = new WhatsAppCloudAdapter({ ...config, verifyToken: '' });
    expect(
      open.verifyChallenge({
        'hub.mode': 'subscribe',
        'hub.verify_token': '',
        'hub.challenge': '42',
      }),
    ).toBeNull();
  });
});

describe('WhatsAppCloudAdapter.verifySignature', () => {
  it('accepts a correct signature', () => {
    const body = JSON.stringify(SAMPLE_INBOUND);
    expect(adapter.verifySignature(ctx(body, sign(body)))).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify(SAMPLE_INBOUND);
    expect(adapter.verifySignature(ctx(body + ' ', sign(body)))).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(adapter.verifySignature(ctx('{}', undefined))).toBe(false);
  });
});

describe('WhatsAppCloudAdapter.parseInbound', () => {
  it('extracts a normalised message', () => {
    const [msg] = adapter.parseInbound(SAMPLE_INBOUND);
    expect(msg).toMatchObject({
      waMessageId: 'wamid.ABC',
      from: '27820001111',
      to: '27210000000',
      type: 'text',
      text: 'Hi, is the Sea Point flat still available?',
    });
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it('ignores status/non-message events and malformed payloads', () => {
    expect(
      adapter.parseInbound({ entry: [{ changes: [{ value: {} }] }] }),
    ).toEqual([]);
    expect(adapter.parseInbound({})).toEqual([]);
    expect(adapter.parseInbound(null)).toEqual([]);
  });

  it('leaves replyId undefined for a plain text message', () => {
    const [msg] = adapter.parseInbound(SAMPLE_INBOUND);
    expect(msg.replyId).toBeUndefined();
  });

  it('parses a tapped reply button into replyId + label', () => {
    const [msg] = adapter.parseInbound(
      inboundWith({
        id: 'wamid.BTN',
        from: '27820001111',
        type: 'interactive',
        interactive: {
          type: 'button_reply',
          button_reply: { id: '90', title: '90 days ★' },
        },
      }),
    );
    expect(msg.replyId).toBe('90');
    expect(msg.text).toBe('90 days ★'); // the label reads naturally in the log
  });

  it('parses a tapped list row into replyId + label', () => {
    const [msg] = adapter.parseInbound(
      inboundWith({
        id: 'wamid.LIST',
        from: '27820001111',
        type: 'interactive',
        interactive: {
          type: 'list_reply',
          list_reply: { id: 'CERTS', title: 'Book my certificates' },
        },
      }),
    );
    expect(msg.replyId).toBe('CERTS');
    expect(msg.text).toBe('Book my certificates');
  });

  it('parses a template quick-reply button payload', () => {
    const [msg] = adapter.parseInbound(
      inboundWith({
        id: 'wamid.QR',
        from: '27820001111',
        type: 'button',
        button: { payload: 'YES', text: 'Yes, I agree' },
      }),
    );
    expect(msg.replyId).toBe('YES');
    expect(msg.text).toBe('Yes, I agree');
  });

  it('reads a Flows completion as text with no replyId', () => {
    const [msg] = adapter.parseInbound(
      inboundWith({
        id: 'wamid.FLOW',
        from: '27820001111',
        type: 'interactive',
        interactive: {
          type: 'nfm_reply',
          nfm_reply: { name: 'flow', body: 'Sent' },
        },
      }),
    );
    expect(msg.replyId).toBeUndefined();
    expect(msg.text).toBe('Sent');
  });
});

describe('WhatsAppCloudAdapter.send', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to the Graph API and returns the message id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: 'wamid.OUT' }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.send({ to: '27820001111', text: 'Yes!' });

    expect(result.waMessageId).toBe('wamid.OUT');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.example/v21.0/123456/messages');
    expect(init.headers.Authorization).toBe('Bearer access-token');
    expect(JSON.parse(init.body)).toMatchObject({
      messaging_product: 'whatsapp',
      to: '27820001111',
      text: { body: 'Yes!' },
    });
  });

  it('sends reply buttons as a native interactive message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.send({
      to: '27820001111',
      text: 'Exclusive listing term?',
      interactive: {
        kind: 'buttons',
        options: [
          { id: '60', title: '60 days' },
          { id: '90', title: '90 days ★' },
          { id: '120', title: '120 days' },
        ],
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe('interactive');
    expect(body.text).toBeUndefined();
    expect(body.interactive.type).toBe('button');
    expect(body.interactive.body).toEqual({ text: 'Exclusive listing term?' });
    expect(body.interactive.action.buttons).toEqual([
      { type: 'reply', reply: { id: '60', title: '60 days' } },
      { type: 'reply', reply: { id: '90', title: '90 days ★' } },
      { type: 'reply', reply: { id: '120', title: '120 days' } },
    ]);
  });

  it('sends a list menu as a native interactive message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.send({
      to: '27820001111',
      text: 'How many bedrooms?',
      interactive: {
        kind: 'list',
        button: 'Choose',
        sections: [
          { title: 'Bedrooms', rows: [{ id: '2', title: '2 bedrooms' }] },
        ],
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe('interactive');
    expect(body.interactive.type).toBe('list');
    expect(body.interactive.action.button).toBe('Choose');
    expect(body.interactive.action.sections).toEqual([
      { title: 'Bedrooms', rows: [{ id: '2', title: '2 bedrooms' }] },
    ]);
  });

  it('ignores interactive options when a template is requested', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await adapter.send({
      to: '27820001111',
      text: 'Your bond was approved.',
      templateId: 'bond_approved',
      interactive: { kind: 'buttons', options: [{ id: 'YES', title: 'Yes' }] },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe('text');
    expect(body.interactive).toBeUndefined();
  });

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('bad', { status: 400 })),
    );
    await expect(adapter.send({ to: 'x', text: 'y' })).rejects.toThrow(
      /WhatsApp send failed: 400/,
    );
  });
});

describe('WhatsAppCloudAdapter media', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses an inbound image into media (caption never becomes text)', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { display_phone_number: '27210000000' },
                messages: [
                  {
                    id: 'wamid.IMG',
                    from: '27820001111',
                    type: 'image',
                    timestamp: '1700000000',
                    image: {
                      id: 'media-123',
                      mime_type: 'image/jpeg',
                      caption: 'list my house',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const [msg] = adapter.parseInbound(payload);
    expect(msg.type).toBe('image');
    expect(msg.text).toBeUndefined(); // caption must not trigger keyword routing
    expect(msg.media).toEqual({
      id: 'media-123',
      mimeType: 'image/jpeg',
      caption: 'list my house',
    });
  });

  it('fetchMedia resolves the id then downloads with the bearer token', async () => {
    const bytes = Buffer.from('image-bytes');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: 'https://lookaside.example/media/abc', mime_type: 'image/png' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(bytes, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.fetchMedia({ id: 'media-123' });

    expect(result.mimeType).toBe('image/png');
    expect(result.bytes.equals(bytes)).toBe(true);
    const [lookupUrl, lookupInit] = fetchMock.mock.calls[0];
    expect(lookupUrl).toBe('https://graph.example/v21.0/media-123');
    expect(lookupInit.headers.Authorization).toBe('Bearer access-token');
    const [mediaUrl, mediaInit] = fetchMock.mock.calls[1];
    expect(mediaUrl).toBe('https://lookaside.example/media/abc');
    expect(mediaInit.headers.Authorization).toBe('Bearer access-token');
  });

  it('fetchMedia throws on a failed lookup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 404 })),
    );
    await expect(adapter.fetchMedia({ id: 'gone' })).rejects.toThrow(/404/);
  });
});
