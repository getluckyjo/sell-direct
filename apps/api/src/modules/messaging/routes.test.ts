import { describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../app';
import type { MessagingAdapter } from './types';
import type { MessageRepository } from './repository';
import type { InboundDispatcher } from './routes';

function fakeAdapter(
  overrides: Partial<MessagingAdapter> = {},
): MessagingAdapter {
  return {
    verifyChallenge: () => null,
    verifySignature: () => true,
    parseInbound: () => [],
    send: vi.fn(),
    fetchMedia: vi.fn(async () => ({
      bytes: Buffer.from(''),
      mimeType: 'image/jpeg',
    })),
    ...overrides,
  };
}

function fakeRepository(
  storedResult = true,
): MessageRepository & { recordInbound: ReturnType<typeof vi.fn> } {
  return {
    recordInbound: vi.fn().mockResolvedValue(storedResult),
    recordOutbound: vi.fn().mockResolvedValue(undefined),
  };
}

function fakeDispatcher(): InboundDispatcher & {
  handle: ReturnType<typeof vi.fn>;
} {
  return { handle: vi.fn().mockResolvedValue(undefined) };
}

const oneMessage = () =>
  fakeAdapter({
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
  });

describe('GET /api/webhooks/whatsapp (verification handshake)', () => {
  it('echoes the challenge on success', async () => {
    const app = buildServer({
      adapter: fakeAdapter({ verifyChallenge: () => '99' }),
      repository: fakeRepository(),
      dispatcher: fakeDispatcher(),
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
      dispatcher: fakeDispatcher(),
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
  it('persists, dispatches, and acknowledges a new message', async () => {
    const repository = fakeRepository(true);
    const dispatcher = fakeDispatcher();
    const app = buildServer({ adapter: oneMessage(), repository, dispatcher });

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
    expect(dispatcher.handle).toHaveBeenCalledOnce();
    await app.close();
  });

  it('does not dispatch a duplicate (already-stored) message', async () => {
    const repository = fakeRepository(false); // recordInbound → not newly stored
    const dispatcher = fakeDispatcher();
    const app = buildServer({ adapter: oneMessage(), repository, dispatcher });

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
    expect(repository.recordInbound).toHaveBeenCalledOnce();
    expect(dispatcher.handle).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects an invalid signature with 401 and persists nothing', async () => {
    const repository = fakeRepository();
    const dispatcher = fakeDispatcher();
    const app = buildServer({
      adapter: fakeAdapter({ verifySignature: () => false }),
      repository,
      dispatcher,
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
    expect(dispatcher.handle).not.toHaveBeenCalled();
    await app.close();
  });
});
