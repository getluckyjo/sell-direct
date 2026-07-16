import type { EstimateRequest, PriceEstimate, ValuationAdapter } from './types';

export interface LoomConfig {
  apiUrl: string;
  apiKey: string;
  log?: (message: string, error?: unknown) => void;
  /** Test seam. */
  fetchImpl?: typeof fetch;
}

/**
 * LOOM Property Insights adapter (loom.co.za) — plain fetch, no SDK, same
 * pattern as the Supabase storage adapter.
 *
 * NOTE: the concrete endpoint path and response mapping are placeholders
 * until the LOOM subscription + API docs are in hand (portal.loom.co.za).
 * The shape below (POST /estimates with address/suburb) is a best guess kept
 * deliberately thin: whatever the real API looks like, only `mapResponse`
 * and the path should need to change. Estimates are best-effort — any
 * failure logs and returns null (callers silently skip guidance), and owner
 * PII in responses is never read (data minimisation, see types.ts).
 */
export function createLoomValuationAdapter(
  config: LoomConfig,
): ValuationAdapter {
  const log = config.log ?? (() => {});
  const doFetch = config.fetchImpl ?? fetch;

  return {
    async estimate(request: EstimateRequest): Promise<PriceEstimate | null> {
      try {
        const response = await doFetch(
          `${config.apiUrl.replace(/\/$/, '')}/estimates`, // TODO: real path per LOOM API docs
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${config.apiKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              address: request.address ?? undefined,
              suburb: request.suburb,
              bedrooms: request.bedrooms,
              bathrooms: request.bathrooms,
            }),
            signal: AbortSignal.timeout(8_000),
          },
        );
        if (!response.ok) {
          log(`[valuation] LOOM responded ${response.status}`);
          return null;
        }
        return mapResponse(await response.json());
      } catch (error) {
        log('[valuation] LOOM estimate failed (skipping guidance)', error);
        return null;
      }
    },
  };
}

/**
 * Maps the LOOM response to our minimal estimate — and nothing else. Owner
 * names/contact details in the payload are deliberately never read.
 * Exported for tests; adjust the field names once the real API docs arrive.
 */
export function mapResponse(payload: unknown): PriceEstimate | null {
  if (payload === null || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const low = typeof p.low_zar === 'number' ? p.low_zar : null;
  const high = typeof p.high_zar === 'number' ? p.high_zar : null;
  if (low === null || high === null || low <= 0 || high < low) return null;
  return {
    lowZar: Math.round(low),
    highZar: Math.round(high),
    comparablesCount:
      typeof p.comparables_count === 'number' ? p.comparables_count : undefined,
    source: 'LOOM Property Insights',
  };
}
