/**
 * End-to-end smoke for agent-led listing intake (no live Anthropic call —
 * the model is scripted; everything else is real: webhook, dispatcher
 * live-routing, write tools, Prisma against a real Postgres).
 *
 *   1. "list my home in Gardens" → agent extracts what it can, asks for the rest.
 *   2. "3 bed 2 bath for R2.5m, 90 days" → agent completes the draft, summarises.
 *   3. "YES" → agent publishes. Assert: listing row exists, conversation
 *      state cleared, audit drafts carry the write-tool calls.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... WHATSAPP_PHONE_NUMBER_ID=x \
 *      npx tsx scripts/intake-smoke.mts
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
import {
  createPrismaConversationStore,
  createPrismaListingRepository,
} from '../src/modules/listings';
import type {
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
} from '../src/modules/messaging';

const PHONE = '+27820005555';
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
};

/**
 * Scripted model standing in for Claude: exercises the real write tools the
 * way the prompt instructs — update as details arrive, summary, publish only
 * after YES.
 */
const scriptedModel: AgentModel = {
  async reply(request) {
    const last = request.messages[request.messages.length - 1].content;
    const update = request.tools.find((t) => t.name === 'update_listing_draft');
    const publish = request.tools.find((t) => t.name === 'publish_listing');
    assert.ok(update && publish, 'write tools must be offered in live mode');

    if (/^list my home in gardens/i.test(last)) {
      const result = await update.run({ title: 'Home in Gardens', suburb: 'Gardens' });
      assert.match(result, /Still missing: priceZar, bedrooms, bathrooms, exclusivityTermDays/);
      return {
        text: 'Lovely — a home in Gardens. What is the asking price, and how many bedrooms and bathrooms?',
        toolCalls: ['update_listing_draft'],
      };
    }
    if (/3 bed 2 bath/i.test(last)) {
      const result = await update.run({
        price_zar: 2_500_000,
        bedrooms: 3,
        bathrooms: 2,
        exclusivity_term_days: 90,
      });
      assert.match(result, /All fields present/);
      return {
        text: 'Here is your listing: "Home in Gardens", Gardens, R2,500,000, 3 bed / 2 bath, 90-day term. Reply YES to go live.',
        toolCalls: ['update_listing_draft'],
      };
    }
    if (/^yes/i.test(last)) {
      const result = await publish.run({ confirm: true });
      assert.match(result, /Published listing/);
      return {
        text: 'Your listing is live! 🎉 Tip: reply CERTS and we will book your compliance certificates early.',
        toolCalls: ['publish_listing'],
      };
    }
    throw new Error(`unscripted turn: ${last}`);
  },
};

async function main() {
  await prisma.agentDraft.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationState.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.seller.deleteMany();

  const agentRepository = createPrismaAgentRepository(prisma);
  const store = createPrismaConversationStore(prisma);
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
      mode: 'live',
      intake: {
        store,
        createListing: (phone, draft) =>
          createPrismaListingRepository(prisma).createFromDraft(phone, draft),
      },
    }),
  });

  async function say(id: string, text: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/whatsapp',
      payload: { id, text },
    });
    assert.equal(res.statusCode, 200, res.body);
    await new Promise((r) => setTimeout(r, 250)); // dispatch runs post-ack
  }

  await say('wamid.smoke.i1', 'list my home in Gardens');
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /asking price/i);
  assert.doesNotMatch(sent[0].text, /which suburb/i);

  await say('wamid.smoke.i2', '3 bed 2 bath for R2.5m, 90 days exclusive');
  assert.equal(sent.length, 2);
  assert.match(sent[1].text, /reply yes/i);

  await say('wamid.smoke.i3', 'YES');
  assert.equal(sent.length, 3);
  assert.match(sent[2].text, /live/i);

  const listings = await prisma.listing.findMany();
  assert.equal(listings.length, 1, 'exactly one listing created');
  assert.equal(listings[0].title, 'Home in Gardens');
  assert.equal(Number(listings[0].priceZar), 2_500_000);
  assert.equal(await store.get(PHONE), null, 'conversation state cleared');

  const audits = await prisma.agentDraft.findMany({ orderBy: { createdAt: 'asc' } });
  assert.equal(audits.length, 3, 'every live turn audited');
  assert.deepEqual(audits.at(-1)?.toolCalls, ['publish_listing']);

  await app.close();
  await prisma.$disconnect();
  console.log('INTAKE SMOKE: ALL ASSERTIONS PASSED');
  console.log('  listing:', listings[0].title, Number(listings[0].priceZar));
}

main().catch((err) => {
  console.error('INTAKE SMOKE FAILED', err);
  process.exit(1);
});
