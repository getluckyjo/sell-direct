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
    expect(adapter.verifySignature(body, sign(body))).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify(SAMPLE_INBOUND);
    expect(adapter.verifySignature(body + ' ', sign(body))).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(adapter.verifySignature('{}', undefined)).toBe(false);
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
