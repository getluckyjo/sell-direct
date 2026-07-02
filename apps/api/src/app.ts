import Fastify, { type FastifyRequest } from 'fastify';
import { APP_NAME } from '@sell-direct/shared';
import { prisma } from './db/client';
import {
  createMessagingAdapter,
  senderNumber,
  createPrismaMessageRepository,
  registerWhatsappWebhook,
  type MessagingRouteDeps,
} from './modules/messaging';
import { createNotifier } from './modules/notifications';
import {
  createDispatcher,
  createPrismaPrequalStore,
} from './modules/conversation';
import {
  createPrismaLeadRepository,
  registerLeadRoutes,
  type LeadRepository,
} from './modules/leads';
import {
  createPrismaConversationStore,
  createPrismaListingRepository,
  type ListingRepository,
} from './modules/listings';
import {
  createPrismaDealRepository,
  type DealRepository,
} from './modules/deals';
import { createPrismaProfileRepository } from './modules/profiles';
import { ObaReferralStub } from './modules/finance';
import { registerDashboardRoutes } from './modules/dashboard';

export type ServerDeps = MessagingRouteDeps & {
  leadRepository: LeadRepository;
  listingRepository: ListingRepository;
  dealRepository: DealRepository;
  internalToken?: string;
};

/** Capture the raw body (for signature verification) and parse it. */
function captureRawBody(request: FastifyRequest, body: string): void {
  (request as FastifyRequest & { rawBody?: string }).rawBody = body;
}

/**
 * Build the Sold Direct API (no network side effects — see server.ts for the
 * runtime entry point that listens).
 *
 * POPIA note: the logger must never record PII (full ID numbers, bank details,
 * payslip contents). Keep request/response body logging off and redact
 * sensitive fields explicitly as modules are added.
 *
 * `deps` lets tests inject fakes (messaging, leads, listings, deals) so
 * endpoints can be exercised without a live BSP or database.
 */
export function buildServer(deps?: Partial<ServerDeps>) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  // Retain the raw request body so the WhatsApp webhook can verify the
  // provider's signature (computed over the exact bytes received).
  // Meta sends JSON; Twilio sends application/x-www-form-urlencoded.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (request, body, done) => {
      captureRawBody(request, body as string);
      try {
        done(null, body === '' ? {} : JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );
  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (request, body, done) => {
      captureRawBody(request, body as string);
      const params = Object.fromEntries(new URLSearchParams(body as string));
      done(null, params);
    },
  );

  app.get('/health', async () => {
    return { status: 'ok', service: APP_NAME };
  });

  const adapter = deps?.adapter ?? createMessagingAdapter();
  const repository = deps?.repository ?? createPrismaMessageRepository(prisma);

  // Wire the conversation dispatcher unless a test injected its own (or opted
  // out by passing an explicit `dispatcher`). Flows reply via the notifier.
  const dispatcher =
    deps?.dispatcher ??
    createDispatcher({
      intake: {
        store: createPrismaConversationStore(prisma),
        createListing: (phone, draft) =>
          createPrismaListingRepository(prisma).createFromDraft(phone, draft),
      },
      enquiry: {
        profiles: createPrismaProfileRepository(prisma),
        deals: createPrismaDealRepository(prisma),
        finance: new ObaReferralStub((msg) => app.log.info(msg)),
      },
      prequalStore: createPrismaPrequalStore(prisma),
      notifier: createNotifier(adapter, repository, senderNumber()),
      log: (msg, err) => app.log.error({ err }, msg),
    });

  registerWhatsappWebhook(app, { adapter, repository, dispatcher });

  const leadRepository =
    deps?.leadRepository ?? createPrismaLeadRepository(prisma);
  registerLeadRoutes(app, { repository: leadRepository });

  const listings =
    deps?.listingRepository ?? createPrismaListingRepository(prisma);
  const deals = deps?.dealRepository ?? createPrismaDealRepository(prisma);
  registerDashboardRoutes(app, {
    listings,
    deals,
    internalToken: deps?.internalToken ?? process.env.INTERNAL_API_TOKEN,
  });

  return app;
}
