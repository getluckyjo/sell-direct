import { DEPOSIT_BENCHMARKS } from './knowledge';
import {
  FIELD_ORDER,
  missingFields,
  nextStep,
  renderSummary,
  validateField,
  type ConversationStore,
  type IntakeField,
  type ListingDraft,
} from '../listings';
import type { AgentToolDefinition } from './types';

/**
 * Read-only data the agent's tools may reach. Deliberately narrow: the agent
 * talks, code decides — nothing here mutates a listing, deal or consent
 * record. Outputs exclude phone numbers and other party PII.
 */
export interface AgentDataSource {
  searchListings(query: string): Promise<AgentListing[]>;
  /** Deals this phone number participates in (as buyer or seller). */
  dealsForPhone(phone: string): Promise<AgentDeal[]>;
}

export interface AgentListing {
  id: string;
  title: string;
  suburb: string | null;
  priceZar: number;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
}

export interface AgentDeal {
  id: string;
  role: 'buyer' | 'seller';
  property: string;
  status: string;
  updatedAt: Date;
}

/** Mutable per-turn flags the tools report back to the service. */
export interface AgentTurnContext {
  escalated: boolean;
  escalationReason?: string;
}

/**
 * Write access for agent-led listing intake (live mode only). Backed by the
 * SAME conversation store + repository as the scripted flow, and `step` is
 * always derived from the data — so hand-off works in both directions: the
 * agent can adopt a scripted draft, and if the agent dies mid-intake the
 * scripted flow resumes at the first missing field.
 */
export interface AgentIntakeAccess {
  store: ConversationStore;
  createListing: (
    phone: string,
    draft: ListingDraft,
  ) => Promise<{ id: string }>;
}

const STAGE_LABELS: Record<string, string> = {
  enquiry: 'enquiry received',
  offer_otp: 'offer to purchase (OTP)',
  bond_application: 'bond application in progress',
  bond_granted: 'bond granted',
  documents_fica: 'FICA documents',
  clearance: 'rates & levy clearance',
  lodgement: 'lodged at the Deeds Office',
  registered: 'registered — transfer complete',
  cancelled: 'cancelled',
};

export function formatRand(amount: number): string {
  return `R${Math.round(amount).toLocaleString('en-ZA')}`;
}

/**
 * Compare a buyer's deposit to the verified oobarometer benchmarks
 * (docs/BOTTLENECKS.md §1.2). Pure — exported for tests.
 */
export function benchmarkDeposit(input: {
  purchasePriceZar: number;
  depositZar: number;
  firstTimeBuyer: boolean;
}): string {
  const { purchasePriceZar, depositZar, firstTimeBuyer } = input;
  if (purchasePriceZar <= 0) return 'Purchase price must be positive.';
  const pct = (depositZar / purchasePriceZar) * 100;
  const benchmark = firstTimeBuyer
    ? DEPOSIT_BENCHMARKS.firstTimeDepositPct
    : DEPOSIT_BENCHMARKS.averageDepositPct;
  const lines = [
    `Deposit ${formatRand(depositZar)} on ${formatRand(purchasePriceZar)} = ${pct.toFixed(1)}% of purchase price.`,
    `Benchmark for ${firstTimeBuyer ? 'first-time buyers' : 'all buyers'}: ${benchmark}% average.`,
    pct >= benchmark
      ? 'At or above benchmark — a strong position going into a bond application.'
      : 'Below benchmark — flag early, before an OTP is signed on hope.',
  ];
  if (firstTimeBuyer) {
    lines.push(
      `${DEPOSIT_BENCHMARKS.firstTimeZeroDepositPct}% of first-time buyers apply for 100% (zero-deposit) bonds — offer to check eligibility, never promise approval.`,
    );
  }
  return lines.join('\n');
}

/**
 * Build the tool set for one agent turn. `phone` scopes deal lookups to the
 * person in the conversation; `ctx` carries the escalation flag back to the
 * service.
 */
export function buildAgentTools(
  data: AgentDataSource,
  phone: string,
  ctx: AgentTurnContext,
  intake?: AgentIntakeAccess,
): AgentToolDefinition[] {
  const tools: AgentToolDefinition[] = [
    {
      name: 'search_listings',
      description:
        'Search active Sold Direct listings by suburb or title keywords. ' +
        'Returns up to 5 matches with price, beds/baths and listing id. ' +
        'Call this before making any claim about what is for sale.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Suburb or keywords, e.g. "Sea Point" or "2 bed apartment"',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      async run(input) {
        const { query } = input as { query: string };
        const listings = await data.searchListings(query);
        if (listings.length === 0) {
          return `No active listings match "${query}". Do not invent any.`;
        }
        return listings
          .map(
            (l) =>
              `- ${l.title} (${l.suburb ?? 'Cape Town'}) — ${formatRand(l.priceZar)}, ` +
              `${l.bedrooms ?? '?'} bed / ${l.bathrooms ?? '?'} bath [id: ${l.id}]`,
          )
          .join('\n');
      },
    },
    {
      name: 'get_my_deals',
      description:
        "The user's deals (as buyer or seller) and where each one is in the " +
        'SA transfer journey. Call this whenever they ask about progress, ' +
        'status, "what happens next", or their sale/purchase.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      async run() {
        const deals = await data.dealsForPhone(phone);
        if (deals.length === 0) {
          return 'No deals found for this person yet.';
        }
        return deals
          .map(
            (d) =>
              `- ${d.property}: ${STAGE_LABELS[d.status] ?? d.status} ` +
              `(their role: ${d.role}; last update ${d.updatedAt.toISOString().slice(0, 10)})`,
          )
          .join('\n');
      },
    },
    {
      name: 'benchmark_deposit',
      description:
        "Compare a buyer's deposit to verified SA market benchmarks " +
        '(oobarometer). Use when a buyer mentions their deposit, affordability ' +
        'or first-time-buyer status. Numbers only — no documents, no PII.',
      inputSchema: {
        type: 'object',
        properties: {
          purchase_price_zar: {
            type: 'number',
            description: 'Purchase price in Rand',
          },
          deposit_zar: {
            type: 'number',
            description: 'Deposit the buyer has available, in Rand',
          },
          first_time_buyer: {
            type: 'boolean',
            description: 'Whether this is a first-time buyer',
          },
        },
        required: ['purchase_price_zar', 'deposit_zar', 'first_time_buyer'],
        additionalProperties: false,
      },
      async run(input) {
        const args = input as {
          purchase_price_zar: number;
          deposit_zar: number;
          first_time_buyer: boolean;
        };
        return benchmarkDeposit({
          purchasePriceZar: args.purchase_price_zar,
          depositZar: args.deposit_zar,
          firstTimeBuyer: args.first_time_buyer,
        });
      },
    },
    {
      name: 'escalate_to_concierge',
      description:
        'Flag this thread for the human concierge team. Use for anything ' +
        'contractual (offers, mandates, negotiation, pricing advice), ' +
        'financial/legal advice, sensitive personal information, an upset ' +
        'user, or any request your other tools cannot answer. Still reply to ' +
        'the user yourself, telling them a human will follow up.',
      inputSchema: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'One line for the concierge: what does this person need?',
          },
        },
        required: ['reason'],
        additionalProperties: false,
      },
      async run(input) {
        const { reason } = input as { reason: string };
        ctx.escalated = true;
        ctx.escalationReason = reason;
        return 'Concierge team notified. Tell the user a human will WhatsApp them shortly.';
      },
    },
  ];

  if (intake) {
    tools.push(...buildIntakeWriteTools(intake, phone));
  }
  return tools;
}

const WIRE_TO_FIELD: Record<string, IntakeField> = {
  title: 'title',
  suburb: 'suburb',
  price_zar: 'priceZar',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  exclusivity_term_days: 'exclusivityTermDays',
};

function draftStatus(data: Partial<ListingDraft>): string {
  const missing = missingFields(data);
  const have = FIELD_ORDER.filter((f) => data[f] !== undefined)
    .map((f) => `${f}: ${String(data[f])}`)
    .join('; ');
  if (missing.length > 0) {
    return `Draft so far — ${have || 'nothing yet'}.\nStill missing: ${missing.join(', ')}. Ask only for these.`;
  }
  return (
    `All fields present:\n${renderSummary(data as ListingDraft)}\n` +
    `Show the seller this summary and get an explicit YES before calling publish_listing.`
  );
}

/**
 * The agent talks, code decides: these tools validate and persist through
 * the same rules as the scripted flow; publish refuses without an explicit
 * confirmation and a complete draft.
 */
function buildIntakeWriteTools(
  intake: AgentIntakeAccess,
  phone: string,
): AgentToolDefinition[] {
  return [
    {
      name: 'update_listing_draft',
      description:
        "Create or update the seller's listing draft with details they have " +
        'stated. Call this whenever the seller provides listing information. ' +
        'Returns the current draft and which fields are still missing — ask ' +
        'only for those. Never invent or assume a value the seller did not ' +
        'give. Constraints: price min R100,000; bedrooms/bathrooms 0–20; ' +
        'exclusivity term 60, 90 or 120 days.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short listing headline, verbatim from the seller' },
          suburb: { type: 'string', description: 'Cape Town suburb' },
          price_zar: { type: 'integer', description: 'Asking price in whole Rand (min 100000)' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'integer' },
          exclusivity_term_days: {
            type: 'integer',
            enum: [60, 90, 120],
            description: 'Exclusive listing term in days',
          },
        },
        required: [],
        additionalProperties: false,
      },
      async run(input) {
        const provided = (input ?? {}) as Record<string, unknown>;
        const existing = await intake.store.get(phone);
        const data: Partial<ListingDraft> = {
          tier: 'free',
          ...(existing?.data ?? {}),
        };
        const rejected: string[] = [];
        for (const [wireKey, field] of Object.entries(WIRE_TO_FIELD)) {
          const value = provided[wireKey];
          if (value === undefined || value === null) continue;
          const valid = validateField(field, value);
          if (valid === null) {
            rejected.push(
              `${wireKey}=${JSON.stringify(value)} rejected (out of bounds — ask the seller to correct it)`,
            );
            continue;
          }
          (data as Record<string, unknown>)[field] = valid;
        }
        await intake.store.set(phone, { step: nextStep(data), data });
        const rejectedNote = rejected.length ? `${rejected.join('\n')}\n` : '';
        return `${rejectedNote}${draftStatus(data)}`;
      },
    },
    {
      name: 'publish_listing',
      description:
        'Publish the completed listing draft. Only call this AFTER you have ' +
        'shown the seller a full summary AND their latest message explicitly ' +
        'confirms it (e.g. YES). Never call speculatively.',
      inputSchema: {
        type: 'object',
        properties: {
          confirm: {
            type: 'boolean',
            description:
              'Must be true, and only after the seller explicitly confirmed the summary',
          },
        },
        required: ['confirm'],
        additionalProperties: false,
      },
      async run(input) {
        const { confirm } = (input ?? {}) as { confirm?: boolean };
        if (confirm !== true) {
          return 'Refused: publish requires confirm=true after the seller explicitly confirmed the summary.';
        }
        const existing = await intake.store.get(phone);
        const data: Partial<ListingDraft> = {
          tier: 'free',
          ...(existing?.data ?? {}),
        };
        const missing = missingFields(data);
        if (missing.length > 0) {
          return `Refused: the draft is incomplete. Still missing: ${missing.join(', ')}. Collect these first.`;
        }
        const listing = await intake.createListing(phone, data as ListingDraft);
        await intake.store.clear(phone);
        return (
          `Published listing ${listing.id} — it is live. Tell the seller, and add the ` +
          `compliance-certificates heads-up: every Cape Town sale needs certificates before ` +
          `transfer; replying CERTS books trusted inspectors early and avoids weeks of delay.`
        );
      },
    },
  ];
}
