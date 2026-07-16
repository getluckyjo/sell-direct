import { createLoomValuationAdapter } from './loom';
import type { EstimateRequest, ValuationAdapter } from './types';

/**
 * No-guidance adapter: the PRODUCTION default until LOOM credentials are
 * configured. Returning null makes every caller silently skip price
 * guidance — a fabricated range must never reach a real seller.
 */
export function createNoopValuationAdapter(): ValuationAdapter {
  return {
    async estimate() {
      return null;
    },
  };
}

/**
 * DEMO-ONLY mock: a deterministic, plausible range so the simulator can show
 * the guidance experience. Wired exclusively to the demo dispatcher in
 * app.ts (reserved +2700 numbers) — never to production flows.
 */
export function createDemoValuationAdapter(): ValuationAdapter {
  return {
    async estimate(request: EstimateRequest) {
      // Deterministic: seeded by suburb + bedrooms so demo runs are stable.
      const seed =
        [...request.suburb.toLowerCase()].reduce(
          (a, c) => a + c.charCodeAt(0),
          0,
        ) +
        (request.bedrooms ?? 2) * 7;
      const mid =
        1_500_000 + (seed % 40) * 100_000 + (request.bedrooms ?? 2) * 450_000;
      const spread = Math.round(mid * 0.08);
      const round = (n: number) => Math.round(n / 50_000) * 50_000;
      return {
        lowZar: round(mid - spread),
        highZar: round(mid + spread),
        comparablesCount: 8 + (seed % 7),
        source: 'LOOM Property Insights',
      };
    },
  };
}

/** LOOM when configured, otherwise the silent noop (production-safe). */
export function createValuationAdapter(
  log?: (message: string, error?: unknown) => void,
): ValuationAdapter {
  const apiUrl = process.env.LOOM_API_URL;
  const apiKey = process.env.LOOM_API_KEY;
  if (apiUrl && apiKey) {
    return createLoomValuationAdapter({ apiUrl, apiKey, log });
  }
  return createNoopValuationAdapter();
}
