import { formatZar } from '@sell-direct/shared';
/**
 * Valuation seam. Price guidance comes from a market-data partner (LOOM
 * Property Insights) behind this interface — swappable, best-effort, and
 * strictly data-minimised.
 *
 * Hard rules:
 * - `estimate` returns null whenever no real data is available. Callers
 *   silently skip guidance on null — a fabricated range must NEVER reach a
 *   real seller (this is why there is no "stub with numbers" in production;
 *   the demo injects its own clearly-mock adapter).
 * - POPIA data minimisation: partner responses may include property-owner
 *   names and contact numbers. That data never crosses this interface —
 *   only the price range and comparables metadata below.
 * - Copy framing (Property Valuers Profession Act): this is a market-data
 *   ESTIMATE, never a "valuation"; the asking price is always the seller's.
 */
export interface EstimateRequest {
  /** Street address when the seller gave one — the most accurate lookup. */
  address?: string | null;
  suburb: string;
  bedrooms?: number;
  bathrooms?: number;
}

export interface PriceEstimate {
  lowZar: number;
  highZar: number;
  /** How many recent comparable sales informed the range, when known. */
  comparablesCount?: number;
  /** Attribution shown to the user (e.g. "LOOM Property Insights"). */
  source: string;
}

export interface ValuationAdapter {
  /** Best-effort: null means "no guidance" — never throws to callers. */
  estimate(request: EstimateRequest): Promise<PriceEstimate | null>;
}

/** Render the user-facing guidance line — one place, one framing. */
export function renderEstimateLine(estimate: PriceEstimate): string {
  return (
    `💡 Price guidance: homes like yours recently sold for ` +
    `${formatZar(estimate.lowZar)}–${formatZar(estimate.highZar)} (based on confirmed ` +
    `sales via ${estimate.source}). The asking price is yours — reply ` +
    `CONSULT anytime for a free pricing chat with our team.`
  );
}
