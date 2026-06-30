import Fastify, { type FastifyRequest } from 'fastify';
import { APP_NAME } from '@sell-direct/shared';
import { prisma } from './db/client';
import {
  WhatsAppCloudAdapter,
  loadWhatsAppConfigFromEnv,
  createPrismaMessageRepository,
  registerWhatsappWebhook,
  type MessagingRouteDeps,
} from './modules/messaging';
import {
  createPrismaLeadRepository,
  registerLeadRoutes,
  type LeadRepository,
} from './modules/leads';
import {
  createPrismaListingRepository,
  type ListingRepository,
} from './modules/listings';
import {
  createPrismaDealRepository,
  type DealRepository,
} from './modules/deals';
import { registerDashboardRoutes } from './modules/dashboard';

export type ServerDeps = MessagingRouteDeps & {
  leadRepository: LeadRepository;
  listingRepository: ListingRepository;
  dealRepository: DealRepository;
  internalToken?: string;
};

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

  // Retain the raw request body so the WhatsApp webhook can verify Meta's
  // HMAC signature (computed over the exact bytes received).
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (request, body, done) => {
      (request as FastifyRequest & { rawBody?: string }).rawBody =
        body as string;
      try {
        done(null, body === '' ? {} : JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.get('/health', async () => {
    return { status: 'ok', service: APP_NAME };
  });

  const adapter =
    deps?.adapter ?? new WhatsAppCloudAdapter(loadWhatsAppConfigFromEnv());
  const repository = deps?.repository ?? createPrismaMessageRepository(prisma);
  registerWhatsappWebhook(app, { adapter, repository });

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
