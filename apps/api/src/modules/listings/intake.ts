import type { DealTier } from '@sell-direct/shared';
// Imported from the leaf module (not '../messaging') so the pure state
// machine never pulls adapter runtime code into its dependency graph.
import type { ReplyOptions } from '../messaging/interactive';

/**
 * Guided WhatsApp listing-intake conversation, as a pure state machine.
 *
 * Deliberately free of any database, WhatsApp or I/O concern so the whole
 * conversation can be driven and asserted in unit tests. The orchestrator
 * (service.ts) wires this to a conversation store and the listings repository.
 *
 * The machine is data-first: the next question is always the first field
 * still missing, never a fixed sequence. Callers may pass `extracted` fields
 * (from the LLM extractor or the agent) alongside the raw reply, so a message
 * like "4 bedroom home in Mowbray" fills title, bedrooms AND suburb in one
 * turn — the user is never asked for something they already said.
 */
export type IntakeStep =
  | 'awaiting_title'
  | 'awaiting_suburb'
  | 'awaiting_address'
  | 'awaiting_price'
  | 'awaiting_bedrooms'
  | 'awaiting_bathrooms'
  | 'awaiting_exclusivity'
  | 'awaiting_confirm'
  /** "Change something" at the summary — pick which field to redo. */
  | 'awaiting_edit_choice'
  | 'completed';

export interface ListingDraft {
  title: string;
  suburb: string;
  /**
   * Street address — OPTIONAL and PRIVATE (never shown to buyers; used for
   * price guidance and portal syndication). `undefined` = not asked yet,
   * `null` = the seller skipped it, string = given.
   */
  address?: string | null;
  priceZar: number;
  bedrooms: number;
  bathrooms: number;
  exclusivityTermDays: number;
  tier: DealTier;
}

/** The user-supplied fields, in the order we ask for them. */
export const FIELD_ORDER = [
  'title',
  'suburb',
  'priceZar',
  'bedrooms',
  'bathrooms',
  'exclusivityTermDays',
] as const;
export type IntakeField = (typeof FIELD_ORDER)[number];

/**
 * Fields an extractor (LLM or agent) may supply from a freeform message —
 * the required intake fields plus the optional street address.
 */
export type ExtractableField = IntakeField | 'address';
export type ExtractedListingFields = Partial<Pick<ListingDraft, IntakeField>> & {
  address?: string;
};

export interface IntakeState {
  step: IntakeStep;
  data: Partial<ListingDraft>;
  /**
   * Cached market-price estimate for this conversation (looked up once when
   * the price question is reached). `undefined` = not looked up yet;
   * `null` = looked up, no data (never show guidance). Managed by the
   * orchestrator (service.ts) — the pure machine ignores it.
   */
  estimate?: {
    lowZar: number;
    highZar: number;
    comparablesCount?: number;
    source: string;
  } | null;
}

export interface IntakeResult {
  state: IntakeState;
  reply: string;
  /** Present only when the conversation just produced a complete listing. */
  completed?: ListingDraft;
  /**
   * Tappable options for this reply, so the seller answers with one tap.
   * Every option id is also a valid typed answer — see `optionsFor`.
   */
  options?: ReplyOptions;
  /** Set when the seller cancelled — the orchestrator clears the draft. */
  cancelled?: true;
}

const FIELD_STEP: Record<
  IntakeField,
  Exclude<IntakeStep, 'awaiting_confirm' | 'awaiting_edit_choice' | 'completed'>
> = {
  title: 'awaiting_title',
  suburb: 'awaiting_suburb',
  priceZar: 'awaiting_price',
  bedrooms: 'awaiting_bedrooms',
  bathrooms: 'awaiting_bathrooms',
  exclusivityTermDays: 'awaiting_exclusivity',
};

const STEP_FIELD: Partial<Record<IntakeStep, IntakeField>> = {
  awaiting_title: 'title',
  awaiting_suburb: 'suburb',
  awaiting_price: 'priceZar',
  awaiting_bedrooms: 'bedrooms',
  awaiting_bathrooms: 'bathrooms',
  awaiting_exclusivity: 'exclusivityTermDays',
};

const PROMPTS: Record<Exclude<IntakeStep, 'completed'>, string> = {
  awaiting_title:
    'Let\'s list your property — 0% commission. What\'s a short headline? (e.g. "2-bed apartment in Sea Point")',
  awaiting_suburb: 'Which suburb is it in?',
  awaiting_address:
    "What's the street address? 🔒 Kept private — buyers never see it; we " +
    'use it for accurate price guidance and portal syndication. Reply SKIP ' +
    'to leave it out.',
  awaiting_price:
    "What's the asking price in Rand? (digits only, e.g. 2100000)",
  awaiting_bedrooms: 'How many bedrooms?',
  awaiting_bathrooms: 'How many bathrooms?',
  awaiting_exclusivity:
    'How long should the exclusive listing term run? 90 days is the South ' +
    'African norm.',
  awaiting_confirm:
    'Tap Publish now to go live, or Change something to edit. (You can also ' +
    'just type a correction, e.g. "price 4500000".)',
  awaiting_edit_choice: 'What would you like to change?',
};

const REASKS: Partial<Record<IntakeStep, string>> = {
  awaiting_title: 'Please give a short headline (at least 3 characters).',
  awaiting_suburb: 'Please tell me the suburb.',
  awaiting_address:
    'Please send the street address (e.g. 12 Milner Road), or reply SKIP.',
  awaiting_price: 'Please send the price as digits in Rand, e.g. 2100000.',
  awaiting_bedrooms: 'How many bedrooms? Please reply with a number.',
  awaiting_bathrooms: 'How many bathrooms? Please reply with a number.',
  awaiting_exclusivity: 'Please choose 60, 90 or 120 days.',
  awaiting_edit_choice: 'Please pick one of the fields from the list.',
};

/** Mirrors the dispatcher's consent regex — a confirm must be unmistakable. */
const YES_RE = /^\s*(yes|y|yeah|yep|ok|okay|sure|👍)\b/i;
/** Confirm-step controls (also typeable). */
const EDIT_RE = /^\s*edit\s*$/i;
const CANCEL_RE = /^\s*cancel\b/i;
const BACK_RE = /^\s*back\s*$/i;
/** `EDIT:<field>` rows from the change-something list. */
const EDIT_FIELD_RE = /^\s*edit:([a-z]+)\s*$/i;
/** Mirrors description.ts: the optional address step is SKIP-able. */
const SKIP_RE = /^\s*(skip|no|nope|later)\b/i;

/**
 * The optional street address: minimum something like "12 Milner Rd". Not
 * part of validateField — address is not an IntakeField (never required).
 */
export function validateAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= 5 && text.length <= 200 ? text : null;
}

export function parseWholeNumber(input: string): number | null {
  const digits = input.replace(/[\s,rR]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return Number.parseInt(digits, 10);
}

/**
 * The single source of truth for field validation — used by the state
 * machine, the extractor and the agent's write tools. Returns the normalised
 * value, or null when invalid.
 */
export function validateField<K extends IntakeField>(
  field: K,
  value: unknown,
): ListingDraft[K] | null {
  switch (field) {
    case 'title': {
      if (typeof value !== 'string') return null;
      const text = value.trim();
      return (text.length >= 3 ? text : null) as ListingDraft[K] | null;
    }
    case 'suburb': {
      if (typeof value !== 'string') return null;
      const text = value.trim();
      return (text.length >= 2 ? text : null) as ListingDraft[K] | null;
    }
    case 'priceZar': {
      const n = typeof value === 'number' ? value : NaN;
      return (Number.isInteger(n) && n >= 100000 ? n : null) as
        | ListingDraft[K]
        | null;
    }
    case 'bedrooms':
    case 'bathrooms': {
      const n = typeof value === 'number' ? value : NaN;
      return (Number.isInteger(n) && n >= 0 && n <= 20 ? n : null) as
        | ListingDraft[K]
        | null;
    }
    case 'exclusivityTermDays': {
      return (value === 60 || value === 90 || value === 120 ? value : null) as
        | ListingDraft[K]
        | null;
    }
  }
}

export function missingFields(data: Partial<ListingDraft>): IntakeField[] {
  return FIELD_ORDER.filter((field) => data[field] === undefined);
}

/** The next question is always the first missing field — never a fixed walk. */
export function nextStep(data: Partial<ListingDraft>): IntakeStep {
  const missing = missingFields(data);
  // The optional address is asked exactly once, just before the price — or
  // before the confirm summary when everything else arrived in one message.
  // `undefined` = not asked yet; `null` = skipped; string = given.
  if (
    data.address === undefined &&
    (missing.length === 0 || missing[0] === 'priceZar')
  ) {
    return 'awaiting_address';
  }
  return missing.length === 0 ? 'awaiting_confirm' : FIELD_STEP[missing[0]];
}

/**
 * Merge extracted fields into the draft. Invalid values are dropped; filled
 * fields are only replaced when `overwrite` is set (confirm-step edits).
 * Returns which fields were actually applied.
 */
export function applyExtracted(
  data: Partial<ListingDraft>,
  extracted: ExtractedListingFields,
  opts: { overwrite?: boolean } = {},
): { data: Partial<ListingDraft>; applied: ExtractableField[] } {
  const next = { ...data };
  const applied: ExtractableField[] = [];
  for (const field of FIELD_ORDER) {
    const value = extracted[field];
    if (value === undefined) continue;
    if (!opts.overwrite && next[field] !== undefined) continue;
    const valid = validateField(field, value);
    if (valid === null) continue;
    if (opts.overwrite && next[field] === valid) continue;
    (next as Record<string, unknown>)[field] = valid;
    applied.push(field);
  }
  // The optional address: fill when unanswered (or skipped — a stated
  // address beats an earlier SKIP), overwrite only at the confirm step.
  const address = validateAddress(extracted.address);
  if (
    address !== null &&
    next.address !== address &&
    (opts.overwrite || next.address === undefined || next.address === null)
  ) {
    next.address = address;
    applied.push('address');
  }
  return { data: next, applied };
}

export function formatPriceZar(price: number): string {
  return `R${price.toLocaleString('en-ZA')}`;
}

export function describeField(
  field: ExtractableField,
  data: Partial<ListingDraft>,
): string {
  switch (field) {
    case 'title':
      return `"${data.title}"`;
    case 'suburb':
      return data.suburb ?? '';
    case 'address':
      return data.address ?? '';
    case 'priceZar':
      return formatPriceZar(data.priceZar ?? 0);
    case 'bedrooms':
      return `${data.bedrooms} bedroom${data.bedrooms === 1 ? '' : 's'}`;
    case 'bathrooms':
      return `${data.bathrooms} bathroom${data.bathrooms === 1 ? '' : 's'}`;
    case 'exclusivityTermDays':
      return `${data.exclusivityTermDays}-day term`;
  }
}

/**
 * The fields the confirm-step "Change something" list offers, in display
 * order. A whitelist, so an `EDIT:<field>` id can never reach an arbitrary
 * key on the draft.
 */
const EDITABLE_FIELDS: { id: ExtractableField; label: string }[] = [
  { id: 'priceZar', label: 'Asking price' },
  { id: 'bedrooms', label: 'Bedrooms' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'suburb', label: 'Suburb' },
  { id: 'address', label: 'Street address' },
  { id: 'title', label: 'Headline' },
  { id: 'exclusivityTermDays', label: 'Exclusive term' },
];

/** Resolve an `EDIT:<field>` id against the whitelist. */
function editableField(key: string): ExtractableField | undefined {
  const lower = key.toLowerCase();
  return EDITABLE_FIELDS.find((f) => f.id.toLowerCase() === lower)?.id;
}

/** A whole-number picker as a list: 1…6 plus a "7 or more" escape hatch. */
function countOptions(
  label: string,
  opts: { studio?: boolean; noun: string },
): ReplyOptions {
  const rows = [
    ...(opts.studio ? [{ id: '0', title: 'Studio' }] : []),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: String(i + 1),
      title: `${i + 1} ${opts.noun}${i === 0 ? '' : 's'}`,
    })),
    {
      id: '7',
      title: '7 or more',
      description: 'Pick this, then type the exact number',
    },
  ];
  return { kind: 'list', button: 'Choose', sections: [{ title: label, rows }] };
}

/**
 * Price buttons around the market estimate: the low, mid and high of the
 * band, rounded to the nearest R50 000 and deduped (a narrow band can
 * collapse to one). Ids are pure digits, so they parse exactly like a typed
 * price — the seller can always type their own instead.
 */
function priceOptions(
  estimate: NonNullable<IntakeState['estimate']>,
): ReplyOptions | undefined {
  const round = (n: number) =>
    Math.max(100000, Math.round(n / 50000) * 50000);
  const values = [
    ...new Set([
      round(estimate.lowZar),
      round((estimate.lowZar + estimate.highZar) / 2),
      round(estimate.highZar),
    ]),
  ].slice(0, 3);
  if (values.length === 0) return undefined;
  return {
    kind: 'buttons',
    options: values.map((v) => ({ id: String(v), title: formatPriceZar(v) })),
    footer: 'Or type any amount',
  };
}

/**
 * The tappable options for a step — the single source of truth for what the
 * seller can tap, and pure so the whole table is unit-testable.
 *
 * INVARIANT: every id here must be an answer `advanceIntake` already accepts
 * as text at that step. That is what lets a tap and a typed reply share one
 * code path (and lets providers without buttons degrade to keywords).
 */
export function optionsFor(
  step: IntakeStep,
  state: IntakeState,
): ReplyOptions | undefined {
  switch (step) {
    case 'awaiting_address':
      return {
        kind: 'buttons',
        options: [{ id: 'SKIP', title: 'Skip — not now' }],
      };
    case 'awaiting_price':
      return state.estimate ? priceOptions(state.estimate) : undefined;
    case 'awaiting_bedrooms':
      return countOptions('Bedrooms', { studio: true, noun: 'bedroom' });
    case 'awaiting_bathrooms':
      return countOptions('Bathrooms', { noun: 'bathroom' });
    case 'awaiting_exclusivity':
      return {
        kind: 'buttons',
        options: [
          { id: '60', title: '60 days' },
          { id: '90', title: '90 days ★' },
          { id: '120', title: '120 days' },
        ],
        footer: '★ recommended',
      };
    case 'awaiting_confirm':
      return {
        kind: 'buttons',
        options: [
          { id: 'YES', title: '✅ Publish now' },
          { id: 'EDIT', title: 'Change something' },
          { id: 'CANCEL', title: 'Cancel listing' },
        ],
      };
    case 'awaiting_edit_choice':
      return {
        kind: 'list',
        button: 'Pick a field',
        sections: [
          {
            title: 'Change',
            rows: [
              ...EDITABLE_FIELDS.map((f) => ({
                id: `EDIT:${f.id}`,
                title: f.label,
                ...(state.data[f.id] !== undefined && state.data[f.id] !== null
                  ? { description: describeField(f.id, state.data) }
                  : {}),
              })),
              { id: 'BACK', title: '← Never mind' },
            ],
          },
        ],
      };
    default:
      // Title and suburb are free text (until PRs 3 and 4 give them pickers).
      return undefined;
  }
}

/** Templated acknowledgement of extracted fields — deterministic, shadow-safe. */
function ackLine(applied: ExtractableField[], data: Partial<ListingDraft>): string {
  if (applied.length === 0) return '';
  return `Got it — ${applied.map((f) => describeField(f, data)).join(', ')}.\n`;
}

export function renderSummary(draft: ListingDraft): string {
  return (
    `Here's your listing:\n` +
    `🏠 "${draft.title}"\n` +
    `📍 ${draft.suburb}, Cape Town\n` +
    (draft.address ? `📫 ${draft.address} (kept private)\n` : '') +
    `💰 ${formatPriceZar(draft.priceZar)}\n` +
    `🛏 ${draft.bedrooms} bed · 🛁 ${draft.bathrooms} bath\n` +
    `📆 ${draft.exclusivityTermDays}-day exclusive term`
  );
}

// The listing pends until the first photo arrives (portals effectively
// require photos); the celebratory copy + Cape Town CERTS pitch moved to the
// activation message in photos.ts. Description is optional and SKIP-able.
function pendingReply(completed: ListingDraft): string {
  return (
    `Perfect — your listing "${completed.title}" in ${completed.suburb} at ` +
    `${formatPriceZar(completed.priceZar)} is confirmed!\n\n` +
    `📝 Optional: reply with a short description buyers will read (a sentence ` +
    `or two about what makes it special), or reply SKIP.\n` +
    `📸 Then send 5–10 photos whenever you're ready — your listing goes live ` +
    `the moment your first photo arrives.`
  );
}

/** Build the reply for wherever the draft stands now. */
function promptFor(
  state: IntakeState,
  applied: ExtractableField[],
): IntakeResult {
  const ack = ackLine(applied, state.data);
  const options = optionsFor(state.step, state);
  if (state.step === 'awaiting_confirm') {
    const summary = renderSummary(state.data as ListingDraft);
    return {
      state,
      reply: `${ack}${summary}\n\n${PROMPTS.awaiting_confirm}`,
      options,
    };
  }
  return {
    state,
    reply: `${ack}${PROMPTS[state.step as Exclude<IntakeStep, 'completed'>]}`,
    options,
  };
}

/** The summary + its Publish/Change/Cancel buttons. */
function confirmResult(state: IntakeState): IntakeResult {
  const next: IntakeState = { ...state, step: 'awaiting_confirm' };
  return {
    state: next,
    reply: `${renderSummary(next.data as ListingDraft)}\n\n${PROMPTS.awaiting_confirm}`,
    options: optionsFor('awaiting_confirm', next),
  };
}

/** Re-ask the current step, keeping its options on screen. */
function reask(state: IntakeState, message?: string): IntakeResult {
  return {
    state,
    reply: message ?? REASKS[state.step]!,
    options: optionsFor(state.step, state),
  };
}

/**
 * Begin a new intake conversation. `extracted` carries anything already
 * stated in the trigger message ("sell my 4 bed in Mowbray") so the first
 * question is never one the user just answered.
 */
export function startIntake(extracted?: ExtractedListingFields): IntakeResult {
  const { data, applied } = applyExtracted({ tier: 'free' }, extracted ?? {});
  const state: IntakeState = { step: nextStep(data), data };
  if (state.step === 'awaiting_title' && applied.length === 0) {
    return { state, reply: PROMPTS.awaiting_title, options: optionsFor(state.step, state) };
  }
  return promptFor(state, applied);
}

/**
 * Advance the conversation with the user's latest reply, plus any fields an
 * extractor found in it. Per turn: (1) deterministically parse the current
 * step's answer, (2) merge extracted fields into whatever is still missing,
 * (3) ask for the first field that remains missing — or confirm the summary.
 */
export function advanceIntake(
  state: IntakeState,
  input: string,
  extracted?: ExtractedListingFields,
): IntakeResult {
  const text = input.trim();
  let data = { ...state.data };
  const found = extracted ?? {};

  if (state.step === 'completed') {
    return {
      state,
      reply:
        'Your listing is already in. Reply "list" to add another property.',
    };
  }

  // "Change something": offer the field picker rather than making the seller
  // phrase a correction.
  if (state.step === 'awaiting_edit_choice') {
    if (BACK_RE.test(text)) return confirmResult(state);
    const match = EDIT_FIELD_RE.exec(text);
    const field = match ? editableField(match[1]) : undefined;
    if (!field) return reask(state);
    // Clearing the field is all it takes: the data-first `nextStep` routes
    // straight to that question, and back to the summary once it is answered.
    delete (data as Record<string, unknown>)[field];
    return promptFor({ ...state, step: nextStep(data), data }, []);
  }

  if (state.step === 'awaiting_confirm') {
    if (YES_RE.test(text)) {
      const completed = data as ListingDraft;
      return {
        state: { step: 'completed', data },
        reply: pendingReply(completed),
        completed,
      };
    }
    if (EDIT_RE.test(text)) {
      const next: IntakeState = { ...state, step: 'awaiting_edit_choice' };
      return {
        state: next,
        reply: PROMPTS.awaiting_edit_choice,
        options: optionsFor('awaiting_edit_choice', next),
      };
    }
    if (CANCEL_RE.test(text)) {
      return {
        state,
        reply:
          'No problem — that draft is discarded. Reply "list" whenever you\'re ready to start again.',
        cancelled: true,
      };
    }
    // An edit: extracted fields may overwrite ("price 4500000").
    const edit = applyExtracted(data, found, { overwrite: true });
    if (edit.applied.length > 0) {
      const nextState: IntakeState = {
        ...state,
        step: nextStep(edit.data),
        data: edit.data,
      };
      const ack = `Updated — ${edit.applied.map((f) => describeField(f, edit.data)).join(', ')}.\n`;
      const options = optionsFor(nextState.step, nextState);
      if (nextState.step === 'awaiting_confirm') {
        return {
          state: nextState,
          reply: `${ack}${renderSummary(edit.data as ListingDraft)}\n\n${PROMPTS.awaiting_confirm}`,
          options,
        };
      }
      return {
        state: nextState,
        reply: `${ack}${PROMPTS[nextState.step as Exclude<IntakeStep, 'completed'>]}`,
        options,
      };
    }
    return confirmResult({ ...state, data });
  }

  // The optional address step: SKIP-able, never blocks the flow.
  if (state.step === 'awaiting_address') {
    if (SKIP_RE.test(text)) {
      data.address = null;
    } else {
      const address = validateAddress(found.address) ?? validateAddress(text);
      if (address === null) {
        const merge = applyExtracted(data, found);
        return reask({ ...state, data: merge.data });
      }
      data.address = address;
    }
    const merge = applyExtracted(data, found);
    return promptFor(
      { ...state, step: nextStep(merge.data), data: merge.data },
      merge.applied.filter((f) => f !== 'address'),
    );
  }

  // 1. Deterministic parse of the current step's answer (unchanged rules).
  const currentField = STEP_FIELD[state.step]!;
  let currentFilled = false;
  switch (currentField) {
    case 'title': {
      const title = validateField('title', text);
      if (title !== null) {
        data.title = title; // the headline is always the user's verbatim text
        currentFilled = true;
      }
      break;
    }
    case 'suburb': {
      // Prefer the extracted value ("it's in Mowbray near the station" →
      // "Mowbray"); fall back to the raw reply.
      const fromExtract = validateField('suburb', found.suburb);
      const fromText = validateField('suburb', text);
      const suburb = fromExtract ?? fromText;
      if (suburb !== null) {
        data.suburb = suburb;
        currentFilled = true;
      }
      break;
    }
    default: {
      // Numeric fields: the deterministic parse of the reply wins; extraction
      // fills in when the user answered in words ("five million").
      const parsed = validateField(currentField, parseWholeNumber(text));
      const value = parsed ?? validateField(currentField, found[currentField]);
      if (value !== null) {
        (data as Record<string, unknown>)[currentField] = value;
        currentFilled = true;
      }
    }
  }

  // 2. Merge everything else the message contained into missing fields.
  const merge = applyExtracted(data, found);
  data = merge.data;
  const applied = merge.applied.filter((f) => f !== currentField);

  if (!currentFilled && data[currentField] === undefined) {
    return reask({ ...state, data });
  }

  // 3. Ask for the first field still missing — or confirm.
  return promptFor({ ...state, step: nextStep(data), data }, applied);
}
