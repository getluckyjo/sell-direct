import type { InboundMessage } from '../messaging';
import type { Notifier } from '../notifications';
import {
  handleDescriptionMessage,
  handleInboundPhoto,
  handleListingIntakeMessage,
  START_RE,
  type DescriptionDeps,
  type ListingIntakeDeps,
  type PhotoIntakeDeps,
} from '../listings';
import {
  handleBuyerEnquiry,
  requestPreQualification,
  type EnquiryDeps,
} from '../enquiry';
import type { PrequalStore } from './prequal-store';
import type { AgentHandler } from '../agent';

/**
 * A buyer arrives via a deep link that pre-fills a message like
 * `ENQUIRE <listingId>` (wa.me/<number>?text=...). Capture the listing id.
 */
const ENQUIRE_RE = /^enquire\b[\s:_-]*([A-Za-z0-9_-]+)?/i;
/** Affirmative consent reply. */
const YES_RE = /^\s*(yes|y|yeah|yep|ok|okay|sure|👍)\b/i;
/**
 * Ecosystem/upsell keywords offered in stage messages (docs/BOTTLENECKS.md,
 * Ancillary Revenue): CERTS = compliance inspections, COVER = homeowners
 * insurance, MOVE = movers/fibre/home services. The inbound is already
 * persisted, so the concierge picks the request up from the message log.
 */
const UPSELL_REPLIES: Record<string, string> = {
  certs:
    '👍 Great — we’ll line up trusted, accredited inspectors for your compliance ' +
    'certificates and WhatsApp you the quotes shortly. Booking early is the single ' +
    'best way to avoid transfer delays.',
  consult:
    '👍 Great — our team will WhatsApp you shortly for a free, no-obligation ' +
    'pricing chat about your home. The asking price is always yours; we bring ' +
    'the recent-sales data.',
  cover:
    '👍 Great — our concierge will WhatsApp you competitive homeowners-insurance ' +
    'quotes shortly. No obligation; your bank just needs cover in place before ' +
    'registration.',
  move:
    '👍 Great — our concierge will WhatsApp you trusted quotes for movers, fibre ' +
    'and anything else you need for the big day. No obligation.',
  nothing:
    '👌 No problem — everything above stays one message away whenever you ' +
    'need it.',
};
const UPSELL_RE = /^\s*(certs|cover|move|consult|nothing)\b/i;

/**
 * "How it works", offered on the welcome menu. Deterministic so the menu
 * works with the AI concierge switched off.
 */
const HOW_RE = /^\s*how\s*$/i;
const HOW_REPLY =
  'Here’s how Sold Direct works:\n\n' +
  '1️⃣ You list your property here on WhatsApp — a few taps, no forms.\n' +
  '2️⃣ We syndicate it and route buyer enquiries straight to you.\n' +
  '3️⃣ Buyers get bond pre-qualification in the chat, so you know who’s real.\n' +
  '4️⃣ Our registered property practitioners and WhatsApp concierge handle ' +
  'the offer, FICA and transfer admin with you.\n\n' +
  'It costs you 0% commission when you sell through our partners — on a ' +
  'R2.1m home, what a full-service sale (5–7% + VAT) would have cost is ' +
  'roughly R120 000–R170 000. Prefer a full-service agent? That’s a great ' +
  'choice too — we’re built for sellers who want to do it themselves.\n\n' +
  'Reply "list" whenever you’re ready.';

export interface DispatcherDeps {
  intake: ListingIntakeDeps;
  enquiry: EnquiryDeps;
  prequalStore: PrequalStore;
  notifier: Notifier;
  /**
   * Optional inbound-photo handling: downloads, stores and attaches seller
   * photos to their pending/active listing. Deterministic code in ALL modes
   * — the model never touches bytes.
   */
  photoIntake?: PhotoIntakeDeps;
  /** Optional post-publish description step (scripted, verbatim, SKIP-able). */
  description?: DescriptionDeps;
  /**
   * Optional AI concierge. When present, messages no scripted flow claims
   * (the intake help fallback) go to the agent instead of the canned help
   * reply. In shadow mode the agent only drafts — the canned reply is still
   * sent so the user is never left hanging.
   */
  agent?: AgentHandler;
  /** Optional logger for send/flow failures (never throws into the webhook). */
  log?: (message: string, error?: unknown) => void;
}

export interface Dispatcher {
  handle(message: InboundMessage): Promise<void>;
}

/**
 * Routes an inbound WhatsApp message to the right flow and sends the reply.
 *
 * Order (each returns before the next):
 *   1. Buyer awaiting pre-qual consent → YES/NO drives the ooba hand-off.
 *   2. `ENQUIRE <listingId>` deep link → create buyer + enquiry deal, invite consent.
 *   3. Otherwise → listing intake (handles an active seller draft, the
 *      list/sell trigger, and the help fallback internally).
 *
 * The reply is sent as a free-text **session** message (the user just messaged
 * us, so we are inside the 24-hour window — no template required).
 */
export function createDispatcher(deps: DispatcherDeps): Dispatcher {
  const log = deps.log ?? (() => {});

  async function route(message: InboundMessage): Promise<void> {
    const phone = message.from;
    // A tapped button/list row carries its id in `replyId` and its label in
    // `text`. Routing keys off the id: option ids are chosen to be keywords
    // the parsers below already accept, so a tap and the equivalent typed
    // reply follow exactly the same path.
    const text = (message.replyId ?? message.text ?? '').trim();

    // -1. Inbound media (a photo) — handled by code in every mode, above all
    //     other routing. An image has empty text so no keyword route could
    //     claim it anyway; a buyer mid-prequal who sends a photo gets a sane
    //     photo reply and can still answer the consent question next.
    if (message.media && deps.photoIntake) {
      const result = await handleInboundPhoto(deps.photoIntake, message);
      await deps.notifier.send(phone, result.reply);
      return;
    }

    // 0. "How it works" from the welcome menu — a fixed explainer, so the
    //    menu is answerable with the AI concierge off.
    if (HOW_RE.test(text)) {
      await deps.notifier.send(phone, HOW_REPLY, {
        interactive: {
          kind: 'buttons',
          options: [
            { id: 'list', title: 'List my property' },
            { id: 'CONSULT', title: 'Talk to us' },
          ],
        },
      });
      return;
    }

    // 0. Upsell keyword from a stage message (CERTS / COVER / MOVE):
    //    acknowledge and hand to the concierge — never the "reply list" fallback.
    const upsell = text.match(UPSELL_RE);
    if (upsell) {
      await deps.notifier.send(phone, UPSELL_REPLIES[upsell[1].toLowerCase()]);
      return;
    }

    // 1. Buyer mid pre-qualification: interpret their consent reply.
    const pending = await deps.prequalStore.get(phone);
    if (pending) {
      const consent = YES_RE.test(text);
      const result = await requestPreQualification(deps.enquiry, {
        buyerId: pending.buyerId,
        phone,
        consent,
        listingId: pending.listingId,
      });
      await deps.prequalStore.clear(phone);
      await deps.notifier.send(phone, result.reply);
      return;
    }

    // 2. Buyer enquiry deep link.
    const enquireMatch = text.match(ENQUIRE_RE);
    if (enquireMatch) {
      const listingId = enquireMatch[1];
      if (!listingId) {
        await deps.notifier.send(
          phone,
          'To enquire, tap “Enquire on WhatsApp” on the listing so we know which home you mean.',
        );
        return;
      }
      const result = await handleBuyerEnquiry(deps.enquiry, {
        phone,
        listingId,
      });
      await deps.prequalStore.set(phone, {
        buyerId: result.buyerId,
        listingId,
      });
      // The deterministic work (buyer + deal + pending consent) is done
      // above and never moves to the agent. When live, the agent may word
      // the pre-qual invite itself — aware of the listing and anything the
      // buyer already said. Consent stays the strict YES/NO in route 1.
      if (deps.agent?.mode === 'live') {
        try {
          const outcome = await deps.agent.handle({ phone, text });
          if (outcome.sent) return;
        } catch (error) {
          log('agent enquiry turn failed', error); // fall through to canned
        }
      }
      await deps.notifier.send(phone, result.reply);
      return;
    }

    // 2.5 Post-publish description step: while an onboarding row exists, free
    //     text is the seller's (optional) description — stored verbatim by
    //     code even in live mode (the live agent normally clears this state
    //     via its own tool first; this is the scripted safety net). Keyword
    //     triggers fall through so "list" still starts a fresh intake.
    if (deps.description) {
      const result = await handleDescriptionMessage(deps.description, {
        phone,
        text,
      });
      if (result.handled && result.reply) {
        await deps.notifier.send(phone, result.reply);
        return;
      }
    }

    // 3. Agent-led intake: when the AI concierge is LIVE it owns the listing
    //    conversation (asks only for missing fields, natural wording). The
    //    scripted flow below remains the fallback if the agent turn fails,
    //    so the user is never stranded. Consent stays deterministic above.
    if (
      deps.agent?.mode === 'live' &&
      (START_RE.test(text) || (await deps.intake.store.get(phone)) !== null)
    ) {
      try {
        const outcome = await deps.agent.handle({ phone, text });
        if (outcome.sent) return;
      } catch (error) {
        log('agent intake turn failed', error); // fall through to scripted
      }
    }

    // 4. Scripted listing intake (active draft / trigger / help fallback) —
    //    now data-first with extraction, so it never re-asks a question.
    const result = await handleListingIntakeMessage(deps.intake, {
      phone,
      text,
    });

    // 5. No scripted flow claimed the message → AI concierge, when enabled.
    //    (Shadow mode drafts here; the canned reply below still goes out.)
    if (result.fallback && deps.agent) {
      try {
        const outcome = await deps.agent.handle({ phone, text });
        if (outcome.sent) return; // live mode replied already
      } catch (error) {
        log('agent turn failed', error); // fall through to the canned reply
      }
    }

    await deps.notifier.send(phone, result.reply, {
      interactive: result.options,
    });
  }

  return {
    async handle(message) {
      try {
        await route(message);
      } catch (error) {
        // Never let a flow/send error break the webhook's fast ack.
        log('dispatch failed', error);
      }
    },
  };
}
