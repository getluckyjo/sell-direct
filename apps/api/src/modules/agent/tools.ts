import { DEPOSIT_BENCHMARKS } from './knowledge';
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
): AgentToolDefinition[] {
  return [
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
}
