import { afterEach, describe, expect, it } from 'vitest';
import {
  createDemoValuationAdapter,
  createNoopValuationAdapter,
  createValuationAdapter,
} from './factory';
import { createLoomValuationAdapter, mapResponse } from './loom';
import { renderEstimateLine } from './types';

afterEach(() => {
  delete process.env.LOOM_API_URL;
  delete process.env.LOOM_API_KEY;
});

describe('valuation adapters', () => {
  it('factory: noop unless BOTH LOOM env vars are set (production safety)', async () => {
    expect(await createValuationAdapter().estimate({ suburb: 'Mowbray' })).toBeNull();
    process.env.LOOM_API_URL = 'https://api.loom.example';
    expect(await createValuationAdapter().estimate({ suburb: 'Mowbray' })).toBeNull();
    process.env.LOOM_API_KEY = 'k';
    // Fully configured → the LOOM adapter (whose fetch will fail here and
    // degrade to null — never a fabricated range).
    const adapter = createValuationAdapter();
    expect(await adapter.estimate({ suburb: 'Mowbray' })).toBeNull();
  });

  it('noop always returns null', async () => {
    expect(
      await createNoopValuationAdapter().estimate({ suburb: 'Sea Point' }),
    ).toBeNull();
  });

  it('demo mock is deterministic, plausible and attributed', async () => {
    const demo = createDemoValuationAdapter();
    const a = await demo.estimate({ suburb: 'Mowbray', bedrooms: 4 });
    const b = await demo.estimate({ suburb: 'Mowbray', bedrooms: 4 });
    expect(a).toEqual(b);
    expect(a!.lowZar).toBeGreaterThan(500_000);
    expect(a!.highZar).toBeGreaterThan(a!.lowZar);
    expect(a!.source).toBe('LOOM Property Insights');
    // Different inputs move the range.
    const c = await demo.estimate({ suburb: 'Constantia', bedrooms: 5 });
    expect(c!.lowZar).not.toBe(a!.lowZar);
  });

  it('LOOM adapter maps a good response and nulls everything else', async () => {
    expect(
      mapResponse({ low_zar: 2_400_000, high_zar: 2_700_000, comparables_count: 9 }),
    ).toEqual({
      lowZar: 2_400_000,
      highZar: 2_700_000,
      comparablesCount: 9,
      source: 'LOOM Property Insights',
    });
    expect(mapResponse({ low_zar: -5, high_zar: 10 })).toBeNull();
    expect(mapResponse({ low_zar: 100, high_zar: 50 })).toBeNull();
    expect(mapResponse('nope')).toBeNull();
    expect(mapResponse(null)).toBeNull();
  });

  it('LOOM adapter: non-OK and network failures degrade to null', async () => {
    const failing = createLoomValuationAdapter({
      apiUrl: 'https://api.loom.example',
      apiKey: 'k',
      fetchImpl: async () => new Response('{}', { status: 503 }),
    });
    expect(await failing.estimate({ suburb: 'Mowbray' })).toBeNull();

    const throwing = createLoomValuationAdapter({
      apiUrl: 'https://api.loom.example',
      apiKey: 'k',
      fetchImpl: async () => {
        throw new Error('down');
      },
    });
    expect(await throwing.estimate({ suburb: 'Mowbray' })).toBeNull();

    const ok = createLoomValuationAdapter({
      apiUrl: 'https://api.loom.example',
      apiKey: 'k',
      fetchImpl: async () =>
        new Response(JSON.stringify({ low_zar: 2_000_000, high_zar: 2_300_000 }), {
          status: 200,
        }),
    });
    expect(await ok.estimate({ suburb: 'Mowbray', address: '12 Milner Rd' })).toMatchObject({
      lowZar: 2_000_000,
      highZar: 2_300_000,
    });
  });

  it('the guidance line keeps the compliance framing', () => {
    const line = renderEstimateLine({
      lowZar: 2_400_000,
      highZar: 2_700_000,
      source: 'LOOM Property Insights',
    });
    expect(line).toContain('via LOOM Property Insights');
    expect(line).toContain('The asking price is yours');
    expect(line).toContain('CONSULT');
    expect(line).not.toMatch(/valuation/i);
  });
});
