import { describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { registerDemoRoutes, type DemoRouteDeps } from './routes';
import { createDemoNotifier } from './repository';
import { createDemoMediaStore, type DemoMessage } from './types';
import type { InboundMessage, MessageRepository } from '../messaging';
import type { AgentDraftRecord, AgentRepository } from '../agent';

const PHONE = '+27001234567';

function makeApp(overrides: Partial<DemoRouteDeps> = {}) {
  const log: DemoMessage[] = [];
  const messages: MessageRepository = {
    async recordInbound(message: InboundMessage) {
      log.push({
        direction: 'inbound',
        body: message.text ?? '',
        type: message.type,
        mediaId: (message.raw as { demoMediaId?: string } | null)?.demoMediaId,
        createdAt: new Date(),
      });
      return true;
    },
    async recordOutbound(message) {
      log.push({
        direction: 'outbound',
        body: message.text,
        type: 'text',
        createdAt: new Date(),
      });
    },
  };
  const notifier = createDemoNotifier(messages);

  const drafts: AgentDraftRecord[] = [];
  const agentDrafts: AgentRepository = {
    async conversation() {
      return [];
    },
    async saveDraft(draft) {
      const record: AgentDraftRecord = {
        id: `draft_${drafts.length + 1}`,
        createdAt: new Date(),
        ...draft,
      };
      drafts.push(record);
      return { id: record.id };
    },
    async listDrafts(status) {
      return drafts.filter((d) => !status || d.status === status);
    },
    async getDraft(id) {
      return drafts.find((d) => d.id === id) ?? null;
    },
    async markReviewed(id, status) {
      const d = drafts.find((x) => x.id === id);
      if (d) d.status = status;
    },
  };

  const app = Fastify();
  registerDemoRoutes(app, {
    media: createDemoMediaStore(),
    // Echo dispatcher: replies through the demo notifier like a real flow.
    dispatcher: {
      async handle(message) {
        await notifier.send(message.from, `echo: ${message.text}`);
      },
    },
    messages,
    demo: { conversation: async () => log },
    agentDrafts,
    notifier,
    internalToken: 'secret',
    ...overrides,
  });
  return { app, log, drafts, agentDrafts };
}

const auth = { 'x-internal-token': 'secret' };

describe('demo routes', () => {
  it('serves the WhatsApp simulator page without auth', async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: 'GET', url: '/demo' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('Sold Direct');
    expect(res.body).toContain('x-internal-token');
  });

  it('requires the internal token on API endpoints', async () => {
    const { app } = makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/demo/messages',
      payload: { phone: PHONE, text: 'hi' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('runs an inbound through the pipeline and returns the thread', async () => {
    const { app } = makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/demo/messages',
      headers: auth,
      payload: { phone: PHONE, text: 'hello there' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.messages.map((m: DemoMessage) => m.body)).toEqual([
      'hello there',
      'echo: hello there',
    ]);
  });

  it('rejects non-demo phone numbers', async () => {
    const { app } = makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/demo/messages',
      headers: auth,
      payload: { phone: '+27821234567', text: 'hi' }, // real-looking number
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_demo_phone');
  });

  it('approves a pending demo draft through the persist-only notifier', async () => {
    const { app, log, agentDrafts } = makeApp();
    const { id } = await agentDrafts.saveDraft({
      phone: PHONE,
      inbound: 'q',
      draft: 'Here is my answer.',
      toolCalls: ['search_listings'],
      escalated: false,
      status: 'pending',
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/demo/drafts/${id}/approve`,
      headers: auth,
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    expect(log.at(-1)).toMatchObject({
      direction: 'outbound',
      body: 'Here is my answer.',
    });
    expect((await agentDrafts.getDraft(id))?.status).toBe('approved');
  });

  it('accepts a photo data-URL and injects a media message through the pipeline', async () => {
    const seen: InboundMessage[] = [];
    const { app } = makeApp({
      dispatcher: {
        async handle(message) {
          seen.push(message);
        },
      },
    });
    const png = Buffer.from('fake-png-bytes').toString('base64');

    const res = await app.inject({
      method: 'POST',
      url: '/api/demo/photo',
      headers: auth,
      payload: { phone: PHONE, dataUrl: `data:image/png;base64,${png}` },
    });

    expect(res.statusCode).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].type).toBe('image');
    expect(seen[0].text).toBeUndefined();
    expect(seen[0].media?.id).toBeTruthy();
    expect(seen[0].media?.mimeType).toBe('image/png');
  });

  it('rejects non-image data URLs and bad phones on the photo endpoint', async () => {
    const { app } = makeApp();
    const bad = await app.inject({
      method: 'POST',
      url: '/api/demo/photo',
      headers: auth,
      payload: { phone: PHONE, dataUrl: 'data:application/pdf;base64,QUJD' },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('not_an_image');

    const badPhone = await app.inject({
      method: 'POST',
      url: '/api/demo/photo',
      headers: auth,
      payload: { phone: '+27821234567', dataUrl: 'data:image/png;base64,QUJD' },
    });
    expect(badPhone.statusCode).toBe(400);
  });

  it('serves stashed media by id with the token in the query', async () => {
    const media = createDemoMediaStore();
    const { app } = makeApp({ media });
    const id = media.put(Buffer.from('img-bytes'), 'image/jpeg');

    const noToken = await app.inject({
      method: 'GET',
      url: `/api/demo/media/${id}`,
    });
    expect(noToken.statusCode).toBe(401);

    const hit = await app.inject({
      method: 'GET',
      url: `/api/demo/media/${id}?token=secret`,
    });
    expect(hit.statusCode).toBe(200);
    expect(hit.headers['content-type']).toContain('image/jpeg');
    expect(hit.body).toBe('img-bytes');

    const miss = await app.inject({
      method: 'GET',
      url: '/api/demo/media/nope?token=secret',
    });
    expect(miss.statusCode).toBe(404);
  });

  it('refuses to approve a draft for a non-demo (real) thread', async () => {
    const { app, agentDrafts } = makeApp();
    const { id } = await agentDrafts.saveDraft({
      phone: '+27829990000', // real user thread
      inbound: 'q',
      draft: 'answer',
      toolCalls: [],
      escalated: false,
      status: 'pending',
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/demo/drafts/${id}/approve`,
      headers: auth,
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('not_a_demo_thread');
  });
});
