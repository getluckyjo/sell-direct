import type { PrismaClient } from '@prisma/client';
import type { Notifier, SendOptions } from './index';

/**
 * Opt-out: "reply STOP at any time" is promised in our consent wording and
 * required by WhatsApp Business policy, so it has to be real.
 *
 * Deliberately narrow matching. CANCEL is excluded — listing intake already
 * uses it to cancel a draft, and a seller abandoning a form has not asked us
 * to stop messaging them.
 */
export const STOP_RE = /^\s*(stop|unsubscribe|opt\s*-?\s*out)\b/i;

export const STOP_REPLY =
  '👍 Done — we won’t message you again.\n\n' +
  'Nothing else is needed from you. If you ever want to pick things up, just ' +
  'message us here and we’ll carry on from where we left off.';

export interface OptOutStore {
  isOptedOut(phone: string): Promise<boolean>;
  optOut(phone: string, waMessageId?: string): Promise<void>;
  /** Clear the opt-out — they messaged us again, so contact is re-initiated. */
  optIn(phone: string): Promise<void>;
}

export function createPrismaOptOutStore(prisma: PrismaClient): OptOutStore {
  return {
    async isOptedOut(phone) {
      const row = await prisma.whatsAppOptOut.findUnique({ where: { phone } });
      return row !== null;
    },
    async optOut(phone, waMessageId) {
      await prisma.whatsAppOptOut.upsert({
        where: { phone },
        create: { phone, waMessageId: waMessageId ?? null },
        update: {},
      });
    },
    async optIn(phone) {
      await prisma.whatsAppOptOut
        .delete({ where: { phone } })
        // Already absent — the common case, and not an error.
        .catch(() => undefined);
    },
  };
}

export function createInMemoryOptOutStore(): OptOutStore {
  const out = new Set<string>();
  return {
    async isOptedOut(phone) {
      return out.has(phone);
    },
    async optOut(phone) {
      out.add(phone);
    },
    async optIn(phone) {
      out.delete(phone);
    },
  };
}

/**
 * Wraps a notifier so nothing is ever sent to a number that opted out.
 *
 * The guard sits at the notifier rather than in each flow on purpose: a stage
 * update, a re-engagement nudge and a conversational reply all go through
 * `send`, and one of them forgetting the check is exactly how a business
 * ends up messaging someone who said STOP.
 *
 * The STOP acknowledgement itself is sent *before* the opt-out is recorded
 * (see the dispatcher), so it is never swallowed by this guard.
 */
export function withOptOutGuard(
  notifier: Notifier,
  store: OptOutStore,
  log?: (message: string) => void,
): Notifier {
  return {
    async send(to: string, text: string, opts?: SendOptions) {
      if (await store.isOptedOut(to)) {
        log?.(`suppressed send to opted-out number ${to.slice(-4)}`);
        return;
      }
      await notifier.send(to, text, opts);
    },
  };
}
