/**
 * Knowledge eval for the AI concierge — the REAL model answering ~15 real
 * consumer questions against a seeded local Postgres. This is the manual
 * gate before flipping production AGENT_MODE=live (and after any knowledge
 * edit): read the transcript like a customer would, and the hard assertions
 * catch the non-negotiables (refuted claims, internal economics, missing
 * escalations).
 *
 * Not part of CI: it needs ANTHROPIC_API_KEY (sandbox key), costs real
 * tokens, and free-text output is inherently variable — the transcript
 * review is the point.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... ANTHROPIC_API_KEY=sk-ant-... \
 *        npx tsx scripts/agent-eval.mts
 */
import assert from 'node:assert/strict';
import { prisma } from '../src/db/client';
import { createAgentHandler } from '../src/modules/agent/service';
import { createAnthropicAgentModel } from '../src/modules/agent/model';
import {
  createPrismaAgentDataSource,
  createPrismaAgentRepository,
} from '../src/modules/agent/repository';
import {
  createPrismaConversationStore,
  createPrismaListingRepository,
  createPrismaOnboardingStore,
  type ListingDraft,
} from '../src/modules/listings';

const PHONE = '+27820002222';

interface EvalCase {
  name: string;
  question: string;
  /** Every regex must match the reply. */
  must?: RegExp[];
  /** No regex may match the reply. */
  mustNot?: RegExp[];
  /** The turn must escalate to the concierge (unanswered-policy topics). */
  expectEscalation?: boolean;
}

const CASES: EvalCase[] = [
  {
    name: 'commission',
    question: 'what do you actually take as commission?',
    // "Zero" is as good an answer as "0%" — assert the meaning, not one
    // spelling of it.
    must: [/0%|zero|no commission/i],
    mustNot: [/flat[- ]fee marketplace/i],
  },
  {
    name: 'flex-cost',
    question: "what if I don't want to list exclusively with you?",
    must: [/1%|flex/i],
  },
  {
    name: 'own-attorney',
    question: 'can I use my own transfer attorney instead of your panel?',
    // Acceptable: explain the ecosystem/Flex implication or defer to the team
    // — but never a flat unexplained "no".
    must: [/flex|1%|concierge|team/i],
  },
  {
    name: 'timeline',
    question: 'how long does a sale take from offer to registration?',
    must: [/3 months|three months/i],
    mustNot: [/we guarantee/i],
  },
  {
    name: 'bond-declined',
    question: 'the bank declined my bond application, is it over for me?',
    must: [/resubmit|another bank|other banks/i],
    mustNot: [/45\.5% of (all|the) (bonds|applications) in south africa/i],
  },
  {
    name: 'deposit',
    question:
      'I have saved R200,000 for a deposit on a R2,000,000 home. Is that enough? I am a first-time buyer.',
    mustNot: [/we guarantee|definitely approved/i],
  },
  {
    name: 'ct-certs',
    question:
      'which compliance certificates do I need to sell my Cape Town house?',
    must: [/electrical/i, /water/i],
  },
  {
    name: 'coc-validity-trap',
    question:
      'my electrical certificate is 18 months old, it is valid for two years right?',
    mustNot: [/valid for (two|2) years/i],
  },
  {
    name: 'who-pays-certs-trap',
    question:
      'is the seller responsible by law for paying all the certificates and repairs?',
    must: [/customar/i],
    mustNot: [/responsible by law|required by law to pay/i],
  },
  {
    name: 'revenue-probe',
    question: 'how much money does Sold Direct make per deal?',
    mustNot: [/R5[0-9][,\s.]?\d{3}|R7[01]/],
  },
  {
    name: 'ownership-probe',
    question: 'who owns Sold Direct and who are your investors?',
    mustNot: [/paysoft|cap table|30%/i],
  },
  {
    name: 'anti-agent-trap',
    question: 'estate agents are a total ripoff, right? their 7% is theft',
    mustNot: [/ripoff|rip-off|theft|obsolete|scam/i],
  },
  {
    name: 'rentals',
    question: 'can I rent out my flat through you instead of selling?',
    // Policy: sales focus, rental arm planned, capture the lead. Either the
    // agent escalates outright, or it offers to pass the details on and waits
    // for a yes — the second is better manners and better POPIA practice, so
    // both pass. What must never happen is the lead going nowhere.
    must: [/rental/i, /details|let you know|our team|in touch/i],
  },
  {
    name: 'hours',
    question: 'what are your office hours? can I phone someone right now?',
    // Policy: live team responds asap; no phone number, no fixed hours.
    must: [/team|as soon as|asap|whatsapp/i],
    mustNot: [
      /\b(0\d{2}[- ]?\d{3}|call us on|phone us on)\b/i,
      /9\s?(am|:00)\s?(-|to)/i,
    ],
  },
  {
    name: 'viewings',
    question: 'who shows the buyers around my house, do you send someone?',
    must: [/you (host|show)|seller hosts|yourself/i],
  },
];

/**
 * This script WIPES listings, sellers, deals and messages before seeding its
 * own fixture. Pointed at production that is catastrophic and irreversible,
 * so it refuses to run anywhere but a local database.
 */
function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL ?? '';
  assert.ok(url, 'DATABASE_URL required');
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  const isLocal = [
    'localhost',
    '127.0.0.1',
    '::1',
    'host.docker.internal',
  ].includes(host);
  if (isLocal || process.env.I_KNOW_THIS_WIPES_THE_DATABASE === 'yes') return;
  console.error(
    `\nRefusing to run: DATABASE_URL points at "${host}", not a local database.\n` +
      `This script DELETES every listing, seller, deal and message before it\n` +
      `seeds its fixture. Point it at a local Postgres.\n` +
      `(Override — only if you are certain — with ` +
      `I_KNOW_THIS_WIPES_THE_DATABASE=yes.)\n`,
  );
  process.exit(1);
}

async function main() {
  assert.ok(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY required');
  assertLocalDatabase();

  // Fresh slate + one active listing so search tools have real data.
  await prisma.agentDraft.deleteMany();
  await prisma.message.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.seller.deleteMany();
  const seller = await prisma.seller.create({
    data: { phone: '+27829998888' },
  });
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

  const replies: string[] = [];
  const listings = createPrismaListingRepository(prisma);
  const handler = createAgentHandler({
    model: createAnthropicAgentModel({
      model: process.env.AGENT_MODEL,
      effort: 'low',
    }),
    repository: createPrismaAgentRepository(prisma),
    data: createPrismaAgentDataSource(prisma),
    notifier: {
      send: async (_to, text) => {
        replies.push(text);
      },
    },
    mode: 'live',
    intake: {
      store: createPrismaConversationStore(prisma),
      createListing: (phone: string, draft: ListingDraft) =>
        listings.createFromDraft(phone, draft),
      onboarding: createPrismaOnboardingStore(prisma),
      listings,
    },
  });

  const failures: string[] = [];
  for (const c of CASES) {
    // Each case runs as a fresh thread so answers can't lean on each other.
    await prisma.message.deleteMany();
    await prisma.agentDraft.deleteMany();
    replies.length = 0;

    await prisma.message.create({
      data: {
        waMessageId: `wamid.eval.${c.name}`,
        direction: 'inbound',
        fromPhone: PHONE,
        toPhone: 'businessnumber',
        type: 'text',
        body: c.question,
      },
    });
    const outcome = await handler.handle({ phone: PHONE, text: c.question });
    const reply = replies[0] ?? '';

    console.log(`\n━━ ${c.name}`);
    console.log(`   Q: ${c.question}`);
    console.log(`   A: ${reply.replace(/\n/g, '\n      ')}`);
    if (outcome.escalated) console.log('   ⚑ escalated to concierge');

    for (const re of c.must ?? []) {
      if (!re.test(reply)) failures.push(`${c.name}: reply should match ${re}`);
    }
    for (const re of c.mustNot ?? []) {
      if (re.test(reply))
        failures.push(`${c.name}: reply must NOT match ${re}`);
    }
    if (c.expectEscalation && !outcome.escalated) {
      failures.push(`${c.name}: expected an escalation to the concierge`);
    }
  }

  await prisma.$disconnect();
  if (failures.length > 0) {
    console.error(`\nAGENT EVAL: ${failures.length} HARD ASSERTION(S) FAILED`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(
    '\nAGENT EVAL: all hard assertions passed — now READ the transcript above like a customer would before going live.',
  );
}

main().catch((err) => {
  console.error('AGENT EVAL FAILED', err);
  process.exit(1);
});
