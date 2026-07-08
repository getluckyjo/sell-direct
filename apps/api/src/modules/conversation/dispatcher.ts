import type { InboundMessage } from '../messaging';
import type { Notifier } from '../notifications';
import {
  handleListingIntakeMessage,
  type ListingIntakeDeps,
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
  cover:
    '👍 Great — our concierge will WhatsApp you competitive homeowners-insurance ' +
    'quotes shortly. No obligation; your bank just needs cover in place before ' +
    'registration.',
  move:
    '👍 Great — our concierge will WhatsApp you trusted quotes for movers, fibre ' +
    'and anything else you need for the big day. No obligation.',
};
const UPSELL_RE = /^\s*(certs|cover|move)\b/i;

export interface DispatcherDeps {
  intake: ListingIntakeDeps;
  enquiry: EnquiryDeps;
  prequalStore: PrequalStore;
  notifier: Notifier;
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
    const text = (message.text ?? '').trim();

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
      await deps.notifier.send(phone, result.reply);
      return;
    }

    // 3. Seller listing intake (active draft / trigger / help fallback).
    const result = await handleListingIntakeMessage(deps.intake, {
      phone,
      text,
    });

    // 4. No scripted flow claimed the message → AI concierge, when enabled.
    //    Consent, deep links and active intake drafts never reach the agent.
    if (result.fallback && deps.agent) {
      try {
        const outcome = await deps.agent.handle({ phone, text });
        if (outcome.sent) return; // live mode replied already
      } catch (error) {
        log('agent turn failed', error); // fall through to the canned reply
      }
    }

    await deps.notifier.send(phone, result.reply);
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
