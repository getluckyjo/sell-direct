import Anthropic from '@anthropic-ai/sdk';
import { betaJSONSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import {
  validateAddress,
  validateField,
  type ExtractableField,
  type ExtractedListingFields,
  type IntakeField,
} from './intake';

/**
 * Extracts listing fields a user stated in a freeform WhatsApp message
 * ("4 bedroom home in Mowbray for R5m") so the intake never re-asks them.
 *
 * Implementations MUST be silent failures: return `{}` on any error or
 * timeout — the scripted flow then simply asks its next question. An
 * extractor never writes user-facing text.
 */
export interface IntakeFieldExtractor {
  /** `fields` limits which keys may be returned (the still-missing ones). */
  extract(
    message: string,
    fields: readonly ExtractableField[],
  ): Promise<ExtractedListingFields>;
}

/** Used when no API key is configured or extraction is switched off. */
export function createNoopExtractor(): IntakeFieldExtractor {
  return {
    async extract() {
      return {};
    },
  };
}

/**
 * Structured-output schema: every key required, null when the user didn't
 * state that fact. snake_case on the wire; mapped back in toExtractedFields.
 */
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: ['string', 'null'] },
    suburb: { type: ['string', 'null'] },
    address: { type: ['string', 'null'] },
    price_zar: { type: ['integer', 'null'] },
    bedrooms: { type: ['integer', 'null'] },
    bathrooms: { type: ['integer', 'null'] },
    exclusivity_term_days: { type: ['integer', 'null'] },
  },
  required: [
    'title',
    'suburb',
    'address',
    'price_zar',
    'bedrooms',
    'bathrooms',
    'exclusivity_term_days',
  ],
  additionalProperties: false,
} as const;

const WIRE_TO_FIELD: Record<string, ExtractableField> = {
  title: 'title',
  suburb: 'suburb',
  address: 'address',
  price_zar: 'priceZar',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  exclusivity_term_days: 'exclusivityTermDays',
};

/**
 * Byte-stable (cache-friendly) — the allowed-fields list travels in the user
 * turn, never here. The extractor NEVER writes user-facing text.
 */
const EXTRACTOR_SYSTEM_PROMPT = `You extract structured property-listing fields from a single WhatsApp message written by a home seller in Cape Town, South Africa.

Rules:
- Return ONLY facts the seller explicitly stated in this message. Never guess, infer, or fill defaults.
- Set every field the message does not clearly state to null.
- Only return fields named in the "Fields to look for" list; everything else must be null.
- price_zar is the asking price in whole Rand: interpret "R5m", "5 million", "R5,000,000" and "5000000" all as 5000000. A number is only a price when the message presents it as the price.
- bedrooms/bathrooms only when the message states the count ("4 bed", "four bedrooms", "2 bathrooms").
- suburb is a Cape Town area name the seller mentions as the location (e.g. Mowbray, Sea Point, Gardens).
- address only when the message states a street address (number and street, e.g. "12 Milner Road"); a suburb alone is never an address.
- exclusivity_term_days only when the seller names a listing term in days (60, 90 or 120).
- title only when the message reads as a listing headline or description of the property.
- You never write user-facing text; your output is consumed by software.`;

/** Pure mapper: raw parsed output → validated fields (exported for tests). */
export function toExtractedFields(
  raw: unknown,
  fields: readonly ExtractableField[],
): ExtractedListingFields {
  if (raw === null || typeof raw !== 'object') return {};
  const out: ExtractedListingFields = {};
  for (const [wireKey, field] of Object.entries(WIRE_TO_FIELD)) {
    const value = (raw as Record<string, unknown>)[wireKey];
    if (value === null || value === undefined) continue;
    if (!fields.includes(field)) continue;
    const valid =
      field === 'address'
        ? validateAddress(value)
        : validateField(field as IntakeField, value);
    if (valid === null) continue;
    (out as Record<string, unknown>)[field] = valid;
  }
  return out;
}

export interface AnthropicExtractorConfig {
  apiKey?: string;
  /** Override the model id (default claude-opus-4-8). */
  model?: string;
  log?: (message: string, error?: unknown) => void;
  /** Test seam: inject a fake client. */
  client?: Anthropic;
}

/**
 * Anthropic implementation: one small structured-outputs call per intake
 * turn (~300 input tokens, effort low, no thinking) — never authors text,
 * never throws; any failure degrades to `{}` and the scripted flow simply
 * asks its next question.
 */
export function createAnthropicIntakeExtractor(
  config: AnthropicExtractorConfig = {},
): IntakeFieldExtractor {
  const client =
    config.client ??
    new Anthropic(config.apiKey ? { apiKey: config.apiKey } : undefined);
  const model = config.model || 'claude-opus-4-8';
  const log = config.log ?? (() => {});

  return {
    async extract(message, fields) {
      if (fields.length === 0 || message.trim() === '') return {};
      try {
        const started = Date.now();
        const response = await client.beta.messages.parse(
          {
            model,
            max_tokens: 1024,
            output_config: {
              format: betaJSONSchemaOutputFormat(EXTRACTION_SCHEMA),
              effort: 'low',
            },
            system: [
              {
                type: 'text',
                text: EXTRACTOR_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: [
              {
                role: 'user',
                content:
                  `Fields to look for: ${fields.join(', ')}\n` +
                  `Message: """${message}"""`,
              },
            ],
          },
          { timeout: 5_000 },
        );
        const extracted = toExtractedFields(response.parsed_output, fields);
        log(
          `intake extraction took ${Date.now() - started}ms, fields: ${
            Object.keys(extracted).join(',') || 'none'
          }`,
        );
        return extracted;
      } catch (error) {
        log('intake extraction failed (continuing scripted)', error);
        return {};
      }
    },
  };
}
