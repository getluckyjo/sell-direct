import { describe, expect, it } from 'vitest';
import {
  buildMetaInteractive,
  flattenOptions,
  normaliseOptions,
  renderKeywordFallback,
  TWILIO_BODY_LIMIT,
  WA_LIMITS,
  type ReplyButtons,
  type ReplyList,
} from './interactive';

const buttons = (options: ReplyButtons['options']): ReplyButtons => ({
  kind: 'buttons',
  options,
});

describe('normaliseOptions', () => {
  it('clamps button titles to 20 characters and keeps ids intact', () => {
    const long = 'x'.repeat(40);
    const result = normaliseOptions(
      buttons([{ id: 'YES', title: long }]),
    ) as ReplyButtons;
    expect(result.options[0].title).toHaveLength(WA_LIMITS.buttonTitle);
    expect(result.options[0].id).toBe('YES');
  });

  it('drops the fourth button', () => {
    const result = normaliseOptions(
      buttons([
        { id: '60', title: '60 days' },
        { id: '90', title: '90 days' },
        { id: '120', title: '120 days' },
        { id: '180', title: '180 days' },
      ]),
    ) as ReplyButtons;
    expect(result.options.map((o) => o.id)).toEqual(['60', '90', '120']);
  });

  it('caps a list at 10 rows across sections, in order', () => {
    const rows = (prefix: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `${prefix}${i}`,
        title: `${prefix} ${i}`,
      }));
    const result = normaliseOptions({
      kind: 'list',
      sections: [
        { title: 'A', rows: rows('a', 7) },
        { title: 'B', rows: rows('b', 7) },
      ],
    }) as ReplyList;
    const flat = flattenOptions(result);
    expect(flat).toHaveLength(WA_LIMITS.rowsTotal);
    expect(flat.map((r) => r.id)).toEqual([
      'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'b0', 'b1', 'b2',
    ]);
  });

  it('clamps row titles to 24 and descriptions to 72', () => {
    const result = normaliseOptions({
      kind: 'list',
      sections: [
        {
          rows: [
            { id: 'r', title: 'y'.repeat(50), description: 'z'.repeat(200) },
          ],
        },
      ],
    }) as ReplyList;
    expect(result.sections[0].rows[0].title).toHaveLength(WA_LIMITS.rowTitle);
    expect(result.sections[0].rows[0].description).toHaveLength(
      WA_LIMITS.rowDescription,
    );
  });

  it('supplies a default section title and list button', () => {
    const result = normaliseOptions({
      kind: 'list',
      sections: [{ rows: [{ id: '1', title: 'One' }] }],
    }) as ReplyList;
    expect(result.button).toBe('Choose');
    expect(result.sections[0].title).toBe('Options');
  });

  it('returns null when nothing usable survives', () => {
    expect(normaliseOptions(buttons([]))).toBeNull();
    expect(normaliseOptions(buttons([{ id: '  ', title: '  ' }]))).toBeNull();
    expect(normaliseOptions({ kind: 'list', sections: [{ rows: [] }] })).toBeNull();
  });
});

describe('buildMetaInteractive', () => {
  it('builds a reply-button payload', () => {
    const payload = buildMetaInteractive('How long?', {
      kind: 'buttons',
      options: [
        { id: '60', title: '60 days' },
        { id: '90', title: '90 days' },
      ],
      footer: '0% commission',
    })!;
    expect(payload.type).toBe('button');
    expect(payload.body).toEqual({ text: 'How long?' });
    expect(payload.footer).toEqual({ text: '0% commission' });
    expect(payload.action).toEqual({
      buttons: [
        { type: 'reply', reply: { id: '60', title: '60 days' } },
        { type: 'reply', reply: { id: '90', title: '90 days' } },
      ],
    });
  });

  it('builds a list payload with sections', () => {
    const payload = buildMetaInteractive('How many bedrooms?', {
      kind: 'list',
      button: 'Choose',
      sections: [
        {
          title: 'Bedrooms',
          rows: [
            { id: '0', title: 'Studio' },
            { id: '1', title: '1 bedroom', description: 'One bedroom' },
          ],
        },
      ],
    })!;
    expect(payload.type).toBe('list');
    expect(payload.action).toEqual({
      button: 'Choose',
      sections: [
        {
          title: 'Bedrooms',
          rows: [
            { id: '0', title: 'Studio' },
            { id: '1', title: '1 bedroom', description: 'One bedroom' },
          ],
        },
      ],
    });
  });

  it('omits header and footer keys entirely when unset', () => {
    const payload = buildMetaInteractive('Body', buttons([{ id: 'YES', title: 'Yes' }]))!;
    expect('header' in payload).toBe(false);
    expect('footer' in payload).toBe(false);
  });

  it('clamps the body to 1024 characters', () => {
    const payload = buildMetaInteractive(
      'b'.repeat(2000),
      buttons([{ id: 'YES', title: 'Yes' }]),
    )!;
    expect((payload.body as { text: string }).text).toHaveLength(WA_LIMITS.body);
  });

  it('returns null when the options are unusable', () => {
    expect(buildMetaInteractive('Body', buttons([]))).toBeNull();
  });
});

describe('renderKeywordFallback', () => {
  it('lists every option id so the flow stays answerable as text', () => {
    const text = renderKeywordFallback('Exclusive term?', {
      kind: 'buttons',
      options: [
        { id: '60', title: '60 days' },
        { id: '90', title: '90 days' },
        { id: '120', title: '120 days' },
      ],
    });
    expect(text).toContain('Exclusive term?');
    expect(text).toContain('• 60 — 60 days');
    expect(text).toContain('• 90 — 90 days');
    expect(text).toContain('• 120 — 120 days');
  });

  it('does not repeat the id when it equals the title', () => {
    const text = renderKeywordFallback('Confirm?', buttons([{ id: 'YES', title: 'yes' }]));
    expect(text).toContain('• YES');
    expect(text).not.toContain('• YES — ');
  });

  it('keeps the keyword block and trims the body when over the limit', () => {
    const text = renderKeywordFallback(
      'b'.repeat(TWILIO_BODY_LIMIT + 500),
      buttons([{ id: 'YES', title: 'Publish now' }]),
    );
    expect(text.length).toBeLessThanOrEqual(TWILIO_BODY_LIMIT);
    expect(text).toContain('• YES — Publish now');
  });

  it('falls back to the plain body when there are no usable options', () => {
    expect(renderKeywordFallback('Just text', buttons([]))).toBe('Just text');
  });
});
