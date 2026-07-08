/**
 * End-to-end smoke test for the AI concierge (no live Anthropic call — the
 * model is scripted, everything else is real: Fastify server, webhook,
 * dispatcher, Prisma against a real Postgres, agent tools, draft queue).
 *
 *   1. Seed a seller + active listing.
 *   2. POST an inbound WhatsApp webhook ("what 2 beds are for sale in Sea Point?").
 *   3. Scripted model calls the real search_listings tool, drafts a reply.
 *   4. Assert: shadow draft persisted, canned help sent to the user.
 *   5. Approve the draft via POST /api/agent/drafts/:id/approve.
 *   6. Assert: the draft text was sent and the row is marked approved.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/agent-smoke.mts
 */
import assert from 'node:assert/strict';
import { buildServer } from '../src/app';
import { prisma } from '../src/db/client';
import { createAgentHandler } from '../src/modules/agent/service';
import {
  createPrismaAgentDataSource,
  createPrismaAgentRepository,
} from '../src/modules/agent/repository';
import type { AgentModel } from '../src/modules/agent/types';
import type {
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
} from '../src/modules/messaging';

const PHONE = '+27820001111';
const sent: OutboundMessage[] = [];

const fakeAdapter: MessagingAdapter = {
  verifyChallenge: () => null,
  verifySignature: () => true,
  parseInbound(payload) {
    const p = payload as { id: string; text: string };
    return [
      {
        waMessageId: p.id,
        from: PHONE,
        to: 'businessnumber',
        type: 'text',
        text: p.text,
        raw: {},
      } satisfies InboundMessage,
    ];
  },
  async send(message) {
    sent.push(message);
    return { waMessageId: `wamid.out.${sent.length}` };
  },
  async fetchMedia() {
    throw new Error('no media in this smoke');
  },
};

// Scripted model: proves the real tool implementations run against the real
// DB — it calls search_listings and folds the result into its reply.
const scriptedModel: AgentModel = {
  async reply(request) {
    const search = request.tools.find((t) => t.name === 'search_listings');
    assert.ok(search, 'search_listings tool must be offered to the model');
    const results = await search.run({ query: 'Sea Point' });
    return {
      text: `Yes! Currently on Sold Direct: ${results.split('\n')[0].replace(/^- /, '')} — want the WhatsApp enquiry link?`,
      toolCalls: ['search_listings'],
    };
  },
};

async function main() {
  // Fresh slate for repeat runs.
  await prisma.agentDraft.deleteMany();
  await prisma.message.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.seller.deleteMany();

  const seller = await prisma.seller.create({ data: { phone: '+27829998888' } });
  await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: '2-bed apartment in Sea Point',
      suburb: 'Sea Point',
      priceZar: 2_950_000,
      bedrooms: 2,
      bathrooms: 2,
      status: 'active',
    },
  });

  const agentRepository = createPrismaAgentRepository(prisma);
  const app = buildServer({
    adapter: fakeAdapter,
    agent: createAgentHandler({
      model: scriptedModel,
      repository: agentRepository,
      data: createPrismaAgentDataSource(prisma),
      notifier: {
        send: async (to, text) => {
          await fakeAdapter.send({ to, text });
        },
      },
      mode: 'shadow',
    }),
  });

  // 1. Inbound webhook → dispatcher → agent (shadow).
  const webhook = await app.inject({
    method: 'POST',
    url: '/api/webhooks/whatsapp',
    payload: { id: 'wamid.smoke.1', text: 'what 2 beds are for sale in Sea Point?' },
  });
  assert.equal(webhook.statusCode, 200, `webhook ack: ${webhook.body}`);
  // The dispatcher runs after the ack; give the promise chain a beat.
  await new Promise((r) => setTimeout(r, 300));

  const drafts = await prisma.agentDraft.findMany();
  assert.equal(drafts.length, 1, 'exactly one shadow draft stored');
  assert.equal(drafts[0].status, 'pending');
  assert.match(drafts[0].draft, /Sea Point/);
  assert.match(drafts[0].draft, /R2[.,\s]950[.,\s]000/);
  assert.deepEqual(drafts[0].toolCalls, ['search_listings']);
  assert.equal(sent.length, 1, 'user still got the canned help in shadow mode');
  assert.match(sent[0].text, /Reply "list"/);

  // 2. Concierge approves → the draft goes out.
  const approve = await app.inject({
    method: 'POST',
    url: `/api/agent/drafts/${drafts[0].id}/approve`,
    payload: {},
  });
  assert.equal(approve.statusCode, 200, `approve: ${approve.body}`);
  assert.equal(sent.length, 2);
  assert.match(sent[1].text, /Sea Point/);
  const reviewed = await prisma.agentDraft.findUnique({
    where: { id: drafts[0].id },
  });
  assert.equal(reviewed?.status, 'approved');

  // 3. Double-approve is rejected.
  const again = await app.inject({
    method: 'POST',
    url: `/api/agent/drafts/${drafts[0].id}/approve`,
    payload: {},
  });
  assert.equal(again.statusCode, 409);

  await app.close();
  await prisma.$disconnect();
  console.log('AGENT SMOKE: ALL ASSERTIONS PASSED');
  console.log('  draft:', drafts[0].draft);
  console.log('  sent after approval:', sent[1].text);
}

main().catch((err) => {
  console.error('AGENT SMOKE FAILED', err);
  process.exit(1);
});
