/**
 * Provider-agnostic tappable reply options (WhatsApp reply buttons and
 * single-select list menus), plus the per-provider renderings.
 *
 * Design rule, load-bearing across the whole app: **every option `id` is a
 * keyword the existing text parsers already accept** ("90", "YES", "SKIP",
 * "2100000", "CERTS"). The dispatcher routes on `replyId ?? text`, so a tap
 * and the equivalent typed reply take exactly the same code path — and a
 * provider with no native buttons can degrade to a list of those keywords
 * without losing any behaviour.
 *
 * Kept out of `types.ts` so pure flow code (listings/intake.ts) can import
 * these types without pulling in adapter runtime code.
 */

/** One tappable choice. */
export interface ReplyOption {
  /** Returned verbatim as `InboundMessage.replyId`. MUST be a parser keyword. */
  id: string;
  /** Visible label. Clamped to 20 chars (button) / 24 (list row). */
  title: string;
  /** List rows only — clamped to 72 chars. Ignored for buttons. */
  description?: string;
}

/** Up to three reply buttons, rendered inline under the message. */
export interface ReplyButtons {
  kind: 'buttons';
  /** Max 3 — extras are dropped. */
  options: ReplyOption[];
  header?: string;
  footer?: string;
}

/** A single-select menu ("dropdown"), opened by a button. */
export interface ReplyList {
  kind: 'list';
  /** The menu-opening button label. Defaults to "Choose". */
  button?: string;
  /** Sections; at most 10 rows in total across all sections. */
  sections: { title?: string; rows: ReplyOption[] }[];
  header?: string;
  footer?: string;
}

export type ReplyOptions = ReplyButtons | ReplyList;

/**
 * WhatsApp Cloud API hard limits. Meta rejects the whole message with a 400
 * when any of these is exceeded, so we clamp rather than risk a failed reply.
 */
export const WA_LIMITS = {
  body: 1024,
  header: 60,
  footer: 60,
  buttons: 3,
  buttonTitle: 20,
  buttonId: 256,
  rowsTotal: 10,
  sections: 10,
  sectionTitle: 24,
  rowTitle: 24,
  rowDescription: 72,
  rowId: 200,
  listButton: 20,
} as const;

/** Twilio's max message body. The keyword fallback must fit inside it. */
export const TWILIO_BODY_LIMIT = 1600;

const DEFAULT_LIST_BUTTON = 'Choose';
const DEFAULT_SECTION_TITLE = 'Options';

/**
 * Trim, then hard-slice. Deliberately no ellipsis: a truncated id would break
 * routing, and a clipped title reads better than one ending in "…".
 */
export function clamp(value: string, max: number): string {
  const text = value.trim();
  return text.length <= max ? text : text.slice(0, max).trim();
}

function cleanOption(
  option: ReplyOption,
  limits: { title: number; id: number; description?: number },
): ReplyOption | null {
  const id = clamp(option.id, limits.id);
  const title = clamp(option.title, limits.title);
  if (id === '' || title === '') return null;
  const description =
    limits.description !== undefined && option.description !== undefined
      ? clamp(option.description, limits.description)
      : undefined;
  return description ? { id, title, description } : { id, title };
}

function cleanChrome(options: ReplyOptions): {
  header?: string;
  footer?: string;
} {
  const header = options.header ? clamp(options.header, WA_LIMITS.header) : '';
  const footer = options.footer ? clamp(options.footer, WA_LIMITS.footer) : '';
  return {
    ...(header ? { header } : {}),
    ...(footer ? { footer } : {}),
  };
}

/**
 * Enforce every WhatsApp limit by dropping/clamping — never by throwing. A
 * malformed menu must degrade, not break a user's reply. Returns null when
 * nothing usable survives, so callers fall back to plain text.
 */
export function normaliseOptions(options: ReplyOptions): ReplyOptions | null {
  const chrome = cleanChrome(options);

  if (options.kind === 'buttons') {
    const cleaned = options.options
      .map((o) =>
        cleanOption(o, {
          title: WA_LIMITS.buttonTitle,
          id: WA_LIMITS.buttonId,
        }),
      )
      .filter((o): o is ReplyOption => o !== null)
      .slice(0, WA_LIMITS.buttons);
    if (cleaned.length === 0) return null;
    return { kind: 'buttons', options: cleaned, ...chrome };
  }

  // Lists cap at 10 rows across all sections — fill in section order.
  let budget: number = WA_LIMITS.rowsTotal;
  const sections: ReplyList['sections'] = [];
  for (const section of options.sections.slice(0, WA_LIMITS.sections)) {
    if (budget <= 0) break;
    const rows = section.rows
      .map((r) =>
        cleanOption(r, {
          title: WA_LIMITS.rowTitle,
          id: WA_LIMITS.rowId,
          description: WA_LIMITS.rowDescription,
        }),
      )
      .filter((r): r is ReplyOption => r !== null)
      .slice(0, budget);
    if (rows.length === 0) continue;
    budget -= rows.length;
    sections.push({
      title: clamp(
        section.title ?? DEFAULT_SECTION_TITLE,
        WA_LIMITS.sectionTitle,
      ),
      rows,
    });
  }
  if (sections.length === 0) return null;
  return {
    kind: 'list',
    button: clamp(options.button ?? DEFAULT_LIST_BUTTON, WA_LIMITS.listButton),
    sections,
    ...chrome,
  };
}

/**
 * Build Meta's `interactive` object. Returns null when nothing usable
 * survives normalisation — the adapter then sends plain text.
 *
 * Absent header/footer keys are omitted entirely; Meta rejects empty strings.
 */
export function buildMetaInteractive(
  text: string,
  options: ReplyOptions,
): Record<string, unknown> | null {
  const normalised = normaliseOptions(options);
  if (!normalised) return null;

  const chrome = {
    ...(normalised.header
      ? { header: { type: 'text', text: normalised.header } }
      : {}),
    ...(normalised.footer ? { footer: { text: normalised.footer } } : {}),
  };
  const body = { text: clamp(text, WA_LIMITS.body) };

  if (normalised.kind === 'buttons') {
    return {
      type: 'button',
      ...chrome,
      body,
      action: {
        buttons: normalised.options.map((o) => ({
          type: 'reply',
          reply: { id: o.id, title: o.title },
        })),
      },
    };
  }

  return {
    type: 'list',
    ...chrome,
    body,
    action: {
      button: normalised.button ?? DEFAULT_LIST_BUTTON,
      sections: normalised.sections.map((s) => ({
        title: s.title,
        rows: s.rows.map((r) => ({
          id: r.id,
          title: r.title,
          ...(r.description ? { description: r.description } : {}),
        })),
      })),
    },
  };
}

/** Flatten a menu to its options, in display order. */
export function flattenOptions(options: ReplyOptions): ReplyOption[] {
  return options.kind === 'buttons'
    ? options.options
    : options.sections.flatMap((s) => s.rows);
}

/**
 * The degraded rendering for providers without native session interactivity
 * (Twilio's REST API). Because every id is a parser keyword, listing the ids
 * preserves the full flow — the user types "90" instead of tapping "90 days".
 */
export function renderKeywordFallback(
  text: string,
  options: ReplyOptions,
): string {
  const normalised = normaliseOptions(options);
  if (!normalised) return text;
  const lines = flattenOptions(normalised).map((o) =>
    o.id.toLowerCase() === o.title.toLowerCase()
      ? `• ${o.id}`
      : `• ${o.id} — ${o.title}`,
  );
  const block = `Reply with one of these:\n${lines.join('\n')}`;
  const combined = `${text}\n\n${block}`;
  // The options are what make the flow answerable — if the whole thing does
  // not fit, trim the body rather than dropping the keywords.
  if (combined.length <= TWILIO_BODY_LIMIT) return combined;
  const room = TWILIO_BODY_LIMIT - block.length - 2;
  return room > 0 ? `${text.slice(0, room).trim()}\n\n${block}` : block;
}
