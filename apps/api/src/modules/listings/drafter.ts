import Anthropic from '@anthropic-ai/sdk';
import type { PropertyType } from '@sell-direct/shared';

/**
 * Drafts the optional portal description so a seller can tap "Write it for
 * me" instead of composing a paragraph on their phone.
 *
 * Two hard rules, both load-bearing:
 *  1. It only ever uses facts the seller gave us — it must never invent a
 *     feature. A fabricated "north-facing garden" is a misrepresentation in
 *     a property listing, not a harmless embellishment.
 *  2. The seller approves the text before it is saved. The drafter proposes;
 *     the seller decides.
 *
 * Like the extractor, implementations are SILENT failures: any error or
 * timeout returns null and the flow falls back to "type it yourself".
 */
export interface DescriptionDrafter {
  draft(facts: ListingFacts): Promise<string | null>;
}

export interface ListingFacts {
  title: string;
  propertyType?: PropertyType | null;
  suburb?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  priceZar?: number | null;
  photoCount?: number;
}

/** Used when no API key is configured, or drafting is switched off. */
export function createNoopDescriptionDrafter(): DescriptionDrafter {
  return {
    async draft() {
      return null;
    },
  };
}

const MAX_DRAFT_LENGTH = 600;

/**
 * Byte-stable (cache-friendly): the listing's facts travel in the user turn,
 * never here.
 *
 * The positioning rules mirror CLAUDE.md: never anti-agent, never
 * anti-PPRA, savings framed neutrally. A listing description is buyer-facing
 * copy, so it stays about the home — not about how the seller is selling it.
 */
const DRAFTER_SYSTEM_PROMPT = `You write short property-listing descriptions for a Cape Town marketplace where owners sell directly.

Rules:
- Use ONLY the facts given. Never invent, infer or embellish a feature — no gardens, views, finishes, renovations, security, parking, schools or amenities unless they appear in the facts. An invented feature is a misrepresentation.
- 2-3 sentences, 60 words maximum. Warm and factual, never salesy. No exclamation marks, no "stunning", "dream", "must-see".
- South African English, ZAR, en-ZA spelling.
- Describe the home only. Never mention commission, estate agents, the selling process, or Sold Direct.
- Do not include the price unless it is in the facts, and never present it as a bargain or compare it to anything.
- Output ONLY the description text — no preamble, no quotes, no headings.`;

function renderFacts(facts: ListingFacts): string {
  const lines = [`Headline: ${facts.title}`];
  if (facts.propertyType) lines.push(`Property type: ${facts.propertyType}`);
  if (facts.suburb) lines.push(`Suburb: ${facts.suburb}, Cape Town`);
  if (facts.bedrooms !== undefined && facts.bedrooms !== null) {
    lines.push(`Bedrooms: ${facts.bedrooms}`);
  }
  if (facts.bathrooms !== undefined && facts.bathrooms !== null) {
    lines.push(`Bathrooms: ${facts.bathrooms}`);
  }
  if (facts.priceZar) {
    lines.push(`Asking price: R${facts.priceZar.toLocaleString('en-ZA')}`);
  }
  return `Facts:\n${lines.join('\n')}\n\nWrite the description.`;
}

export interface AnthropicDrafterConfig {
  apiKey?: string;
  /** Override the model id (default claude-opus-4-8). */
  model?: string;
  log?: (message: string, error?: unknown) => void;
  /** Test seam: inject a fake client. */
  client?: Anthropic;
}

export function createAnthropicDescriptionDrafter(
  config: AnthropicDrafterConfig = {},
): DescriptionDrafter {
  const client =
    config.client ??
    new Anthropic(config.apiKey ? { apiKey: config.apiKey } : undefined);
  const model = config.model || 'claude-opus-4-8';
  const log = config.log ?? (() => {});

  return {
    async draft(facts) {
      try {
        const response = await client.messages.create({
          model,
          max_tokens: 300,
          system: DRAFTER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: renderFacts(facts) }],
        });
        const text = response.content
          .filter((block) => block.type === 'text')
          .map((block) => (block as { text: string }).text)
          .join('')
          .trim();
        return text.length > 0 ? text.slice(0, MAX_DRAFT_LENGTH) : null;
      } catch (error) {
        // Never surface a model failure to a seller mid-flow.
        log('description drafting failed', error);
        return null;
      }
    },
  };
}
