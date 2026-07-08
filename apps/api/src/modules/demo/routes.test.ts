import { describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { registerDemoRoutes, type DemoRouteDeps } from './routes';
import { createDemoNotifier } from './repository';
import type { DemoMessage } from './types';
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
        createdAt: new Date(),
      });
      return true;
    },
    async recordOutbound(message) {
      log.push({
        direction: 'outbound',
        body: message.text,
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
