import type { ExtractedListingFields, IntakeField } from './intake';

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
    fields: readonly IntakeField[],
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
