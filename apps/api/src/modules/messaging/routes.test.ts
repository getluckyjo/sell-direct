import { describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../app';
import type { MessagingAdapter } from './types';
import type { MessageRepository } from './repository';

function fakeAdapter(
  overrides: Partial<MessagingAdapter> = {},
): MessagingAdapter {
  return {
    verifyChallenge: () => null,
    verifySignature: () => true,
    parseInbound: () => [],
    send: vi.fn(),
    ...overrides,
  };
}

function fakeRepository(): MessageRepository & {
  recordInbound: ReturnType<typeof vi.fn>;
} {
  return {
    recordInbound: vi.fn().mockResolvedValue(undefined),
    recordOutbound: vi.fn().mockResolvedValue(undefined),
  };
}

describe('GET /api/webhooks/whatsapp (verification handshake)', () => {
  it('echoes the challenge on success', async () => {
    const app = buildServer({
      adapter: fakeAdapter({ verifyChallenge: () => '99' }),
      repository: fakeRepository(),
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=x&hub.challenge=99',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('99');
    await app.close();
  });

  it('returns 403 when verification fails', async () => {
    const app = buildServer({
      adapter: fakeAdapter({ verifyChallenge: () => null }),
      repository: fakeRepository(),
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/webhooks/whatsapp?hub.verify_token=wrong',
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });
});

describe('POST /api/webhooks/whatsapp (inbound)', () => {
  it('persists parsed messages and acknowledges', async () => {
    const repository = fakeRepository();
    const app = buildServer({
      adapter: fakeAdapter({
        verifySignature: () => true,
        parseInbound: () => [
          {
            waMessageId: 'wamid.1',
            from: '27820001111',
            to: '27210000000',
            type: 'text',
            text: 'hi',
            raw: {},
          },
        ],
      }),
      repository,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/whatsapp',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=whatever',
      },
      payload: JSON.stringify({ entry: [] }),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ received: 1 });
    expect(repository.recordInbound).toHaveBeenCalledOnce();
    await app.close();
  });

  it('rejects an invalid signature with 401 and persists nothing', async () => {
    const repository = fakeRepository();
    const app = buildServer({
      adapter: fakeAdapter({ verifySignature: () => false }),
      repository,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/whatsapp',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=bad',
      },
      payload: JSON.stringify({ entry: [] }),
    });

    expect(res.statusCode).toBe(401);
    expect(repository.recordInbound).not.toHaveBeenCalled();
    await app.close();
  });
});
