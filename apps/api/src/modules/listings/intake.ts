import type { DealTier } from '@sell-direct/shared';

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
}

const FIELD_STEP: Record<IntakeField, Exclude<IntakeStep, 'awaiting_confirm' | 'completed'>> = {
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
    'Exclusive listing term in days — reply 60, 90 or 120 (90 is recommended).',
  awaiting_confirm:
    'Reply YES to go live, or tell me what to change (e.g. "price 4500000").',
};

const REASKS: Partial<Record<IntakeStep, string>> = {
  awaiting_title: 'Please give a short headline (at least 3 characters).',
  awaiting_suburb: 'Please tell me the suburb.',
  awaiting_address:
    'Please send the street address (e.g. 12 Milner Road), or reply SKIP.',
  awaiting_price: 'Please send the price as digits in Rand, e.g. 2100000.',
  awaiting_bedrooms: 'How many bedrooms? Please reply with a number.',
  awaiting_bathrooms: 'How many bathrooms? Please reply with a number.',
  awaiting_exclusivity: 'Please reply 60, 90 or 120.',
};

/** Mirrors the dispatcher's consent regex — a confirm must be unmistakable. */
const YES_RE = /^\s*(yes|y|yeah|yep|ok|okay|sure|👍)\b/i;
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

function describeField(
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
  if (state.step === 'awaiting_confirm') {
    const summary = renderSummary(state.data as ListingDraft);
    return {
      state,
      reply: `${ack}${summary}\n\n${PROMPTS.awaiting_confirm}`,
    };
  }
  return {
    state,
    reply: `${ack}${PROMPTS[state.step as Exclude<IntakeStep, 'completed'>]}`,
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
    return { state, reply: PROMPTS.awaiting_title };
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

  if (state.step === 'awaiting_confirm') {
    if (YES_RE.test(text)) {
      const completed = data as ListingDraft;
      return { state: { step: 'completed', data }, reply: pendingReply(completed), completed };
    }
    // An edit: extracted fields may overwrite ("price 4500000").
    const edit = applyExtracted(data, found, { overwrite: true });
    if (edit.applied.length > 0) {
      const nextState: IntakeState = { step: nextStep(edit.data), data: edit.data };
      const ack = `Updated — ${edit.applied.map((f) => describeField(f, edit.data)).join(', ')}.\n`;
      if (nextState.step === 'awaiting_confirm') {
        return {
          state: nextState,
          reply: `${ack}${renderSummary(edit.data as ListingDraft)}\n\n${PROMPTS.awaiting_confirm}`,
        };
      }
      return { state: nextState, reply: `${ack}${PROMPTS[nextState.step as Exclude<IntakeStep, 'completed'>]}` };
    }
    return {
      state,
      reply: `${renderSummary(data as ListingDraft)}\n\n${PROMPTS.awaiting_confirm}`,
    };
  }

  // The optional address step: SKIP-able, never blocks the flow.
  if (state.step === 'awaiting_address') {
    if (SKIP_RE.test(text)) {
      data.address = null;
    } else {
      const address = validateAddress(found.address) ?? validateAddress(text);
      if (address === null) {
        const merge = applyExtracted(data, found);
        return {
          state: { ...state, data: merge.data },
          reply: REASKS.awaiting_address!,
        };
      }
      data.address = address;
    }
    const merge = applyExtracted(data, found);
    return promptFor(
      { step: nextStep(merge.data), data: merge.data },
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
    return { state: { ...state, data }, reply: REASKS[state.step]! };
  }

  // 3. Ask for the first field still missing — or confirm.
  return promptFor({ step: nextStep(data), data }, applied);
}
