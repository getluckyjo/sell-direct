import { describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import {
  createAnthropicIntakeExtractor,
  createNoopExtractor,
  toExtractedFields,
} from './extractor';
import { FIELD_ORDER } from './intake';

function fakeClient(parse: (...args: unknown[]) => Promise<unknown>): Anthropic {
  return { beta: { messages: { parse } } } as unknown as Anthropic;
}

describe('toExtractedFields', () => {
  it('maps wire keys, drops nulls and validates values', () => {
    const out = toExtractedFields(
      {
        title: null,
        suburb: 'Mowbray',
        price_zar: 5_000_000,
        bedrooms: 4,
        bathrooms: null,
        exclusivity_term_days: 61, // invalid → dropped
      },
      FIELD_ORDER,
    );
    expect(out).toEqual({ suburb: 'Mowbray', priceZar: 5_000_000, bedrooms: 4 });
  });

  it('drops fields outside the allowed list', () => {
    const out = toExtractedFields(
      { suburb: 'Mowbray', bedrooms: 4, title: null, price_zar: null, bathrooms: null, exclusivity_term_days: null },
      ['bedrooms'],
    );
    expect(out).toEqual({ bedrooms: 4 });
  });

  it('is null-safe on garbage output', () => {
    expect(toExtractedFields(null, FIELD_ORDER)).toEqual({});
    expect(toExtractedFields('nonsense', FIELD_ORDER)).toEqual({});
    expect(toExtractedFields({ bedrooms: 'four' }, FIELD_ORDER)).toEqual({});
  });
});

describe('extractors', () => {
  it('noop extractor always returns {}', async () => {
    const out = await createNoopExtractor().extract('4 bed in Mowbray', FIELD_ORDER);
    expect(out).toEqual({});
  });

  it('anthropic extractor returns validated fields from parsed output', async () => {
    const parse = vi.fn().mockResolvedValue({
      parsed_output: {
        title: null,
        suburb: 'Mowbray',
        price_zar: null,
        bedrooms: 4,
        bathrooms: null,
        exclusivity_term_days: null,
      },
    });
    const extractor = createAnthropicIntakeExtractor({ client: fakeClient(parse) });

    const out = await extractor.extract('4 bedroom home in mowbray', FIELD_ORDER);

    expect(out).toEqual({ suburb: 'Mowbray', bedrooms: 4 });
    const params = parse.mock.calls[0][0] as {
      messages: Array<{ content: string }>;
      output_config: { effort: string };
    };
    expect(params.messages[0].content).toContain('4 bedroom home in mowbray');
    expect(params.output_config.effort).toBe('low');
  });

  it('returns {} when the API call fails — flow never stalls', async () => {
    const log = vi.fn();
    const extractor = createAnthropicIntakeExtractor({
      client: fakeClient(vi.fn().mockRejectedValue(new Error('overloaded'))),
      log,
    });
    const out = await extractor.extract('anything', FIELD_ORDER);
    expect(out).toEqual({});
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('extraction failed'),
      expect.any(Error),
    );
  });

  it('skips the API entirely for empty input or empty field list', async () => {
    const parse = vi.fn();
    const extractor = createAnthropicIntakeExtractor({ client: fakeClient(parse) });
    expect(await extractor.extract('   ', FIELD_ORDER)).toEqual({});
    expect(await extractor.extract('hello', [])).toEqual({});
    expect(parse).not.toHaveBeenCalled();
  });
});
