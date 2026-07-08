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
import {
  createNotifier,
  loadTemplateConfigFromEnv,
  type Notifier,
} from './modules/notifications';
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
  createAnthropicIntakeExtractor,
  createNoopExtractor,
  createPrismaConversationStore,
  createPrismaListingRepository,
  type ListingDraft,
  type ListingRepository,
} from './modules/listings';
import {
  createPrismaDealRepository,
  registerDealRoutes,
  recordDealEvent,
  transitionDeal,
  type DealRepository,
} from './modules/deals';
import { createPrismaDeadlineRepository } from './modules/deadlines';
import { createPrismaProfileRepository } from './modules/profiles';
import { ObaReferralStub } from './modules/finance';
import { registerDashboardRoutes } from './modules/dashboard';
import {
  createAgentHandler,
  createAnthropicAgentModel,
  createPrismaAgentDataSource,
  createPrismaAgentRepository,
  registerAgentRoutes,
  type AgentHandler,
  type AgentMode,
} from './modules/agent';
import {
  createDemoNotifier,
  createPrismaDemoRepository,
  registerDemoRoutes,
} from './modules/demo';
import {
  createStorageProvider,
  registerStorageRoutes,
  selectedStorage,
  storageBucket,
  storageLocalDir,
  type StorageProvider,
} from './modules/storage';
import { Property24SyndicationStub } from './modules/syndication';
import {
  createPrismaOnboardingStore,
  type DescriptionDeps,
  type PhotoIntakeDeps,
} from './modules/listings';

export type ServerDeps = MessagingRouteDeps & {
  leadRepository: LeadRepository;
  listingRepository: ListingRepository;
  dealRepository: DealRepository;
  /** Test seam: inject a fake agent (or leave AGENT_ENABLED unset to omit). */
  agent?: AgentHandler;
  /** Test seam: inject a fake storage provider. */
  storage?: StorageProvider;
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
  // One notifier serves both the conversational replies and stage updates.
  const notifier = createNotifier(adapter, repository, senderNumber());

  // Storage: Supabase when configured, local filesystem otherwise (dev/demo)
  // — local objects are served from GET /api/storage/... on this API.
  const storage = deps?.storage ?? createStorageProvider();
  if (!deps?.storage && selectedStorage() === 'local') {
    registerStorageRoutes(app, { baseDir: storageLocalDir() });
  }

  // Shared intake wiring: the scripted flow, the demo dispatcher and (when
  // live) the agent's write tools all act on the same conversation store and
  // listings repository — state stays hand-off-safe between them. The
  // extractor lets any reply fill several fields at once (no double
  // questions); it degrades to a noop without an API key or with
  // INTAKE_EXTRACTION=false.
  const conversationStore = createPrismaConversationStore(prisma);
  const listingRepository =
    deps?.listingRepository ?? createPrismaListingRepository(prisma);
  const createListing = (phone: string, draft: ListingDraft) =>
    listingRepository.createFromDraft(phone, draft);
  const onboardingStore = createPrismaOnboardingStore(prisma);
  const syndication = new Property24SyndicationStub((msg) =>
    app.log.info(msg),
  );
  const extractor =
    process.env.ANTHROPIC_API_KEY && process.env.INTAKE_EXTRACTION !== 'false'
      ? createAnthropicIntakeExtractor({
          model: process.env.INTAKE_EXTRACTOR_MODEL,
          log: (msg, err) => app.log.warn({ err }, msg),
        })
      : createNoopExtractor();
  const intakeDeps = {
    store: conversationStore,
    createListing,
    extractor,
    onboarding: onboardingStore,
  };
  const description: DescriptionDeps = {
    onboarding: onboardingStore,
    setDescription: (id, text) => listingRepository.setDescription(id, text),
  };
  const makePhotoIntake = (
    fetchMedia: PhotoIntakeDeps['fetchMedia'],
  ): PhotoIntakeDeps => ({
    listings: listingRepository,
    fetchMedia,
    storage,
    bucket: storageBucket(),
    minPhotos: Number(process.env.LISTING_MIN_PHOTOS ?? 1) || 1,
    intakeStore: conversationStore,
    syndication,
    log: (msg, err) => app.log.warn({ err }, msg),
  });

  // AI concierge (Claude): drafts replies for messages no scripted flow
  // claims. Off unless AGENT_ENABLED=true and an ANTHROPIC_API_KEY is set;
  // AGENT_MODE=shadow (default — draft only, concierge approves) or live.
  const agentRepository = createPrismaAgentRepository(prisma);
  const agentEnabled =
    process.env.AGENT_ENABLED === 'true' && !!process.env.ANTHROPIC_API_KEY;
  const agentMode: AgentMode =
    process.env.AGENT_MODE === 'live' ? 'live' : 'shadow';
  const makeAgent = (agentNotifier: Notifier): AgentHandler | undefined =>
    agentEnabled
      ? createAgentHandler({
          model: createAnthropicAgentModel({
            model: process.env.AGENT_MODEL,
            effort: process.env.AGENT_EFFORT as 'low' | 'medium' | 'high' | undefined,
          }),
          repository: agentRepository,
          data: createPrismaAgentDataSource(prisma),
          notifier: agentNotifier,
          mode: agentMode,
          // Live mode lets the agent run listing intake through the same
          // store + validation as the scripted flow (hand-off safe).
          intake: {
            store: conversationStore,
            createListing,
            onboarding: onboardingStore,
            listings: listingRepository,
          },
          log: (msg, err) => app.log.warn({ err }, msg),
        })
      : undefined;
  const agent = deps?.agent ?? makeAgent(notifier);

  // Wire the conversation dispatcher unless a test injected its own (or opted
  // out by passing an explicit `dispatcher`). Flows reply via the notifier.
  const dispatcher =
    deps?.dispatcher ??
    createDispatcher({
      intake: intakeDeps,
      enquiry: {
        profiles: createPrismaProfileRepository(prisma),
        deals: createPrismaDealRepository(prisma),
        finance: new ObaReferralStub((msg) => app.log.info(msg)),
      },
      prequalStore: createPrismaPrequalStore(prisma),
      notifier,
      photoIntake: makePhotoIntake((media) => adapter.fetchMedia(media)),
      description,
      agent,
      log: (msg, err) => app.log.error({ err }, msg),
    });

  registerWhatsappWebhook(app, { adapter, repository, dispatcher });

  const leadRepository =
    deps?.leadRepository ?? createPrismaLeadRepository(prisma);
  registerLeadRoutes(app, { repository: leadRepository });

  const listings = listingRepository;
  const deals = deps?.dealRepository ?? createPrismaDealRepository(prisma);
  const internalToken = deps?.internalToken ?? process.env.INTERNAL_API_TOKEN;
  registerDashboardRoutes(app, { listings, deals, internalToken });

  // Shadow-mode review queue: list pending AI drafts, approve (sends) or
  // dismiss. Registered even when the agent is off so the dashboard can
  // always read the audit trail.
  registerAgentRoutes(app, {
    repository: agentRepository,
    notifier,
    internalToken,
    log: (msg, err) => app.log.error({ err }, msg),
  });

  // WhatsApp demo simulator (GET /demo): the full production pipeline —
  // dispatcher, flows, agent, Postgres — behind a persist-only transport.
  // Demo threads are locked to the reserved +2700xxxxxxx range. Disable with
  // DEMO_ENABLED=false once real traffic is the priority.
  if (process.env.DEMO_ENABLED !== 'false') {
    const demoNotifier = createDemoNotifier(repository);
    const demoDispatcher = createDispatcher({
      intake: intakeDeps,
      enquiry: {
        profiles: createPrismaProfileRepository(prisma),
        deals: createPrismaDealRepository(prisma),
        finance: new ObaReferralStub((msg) => app.log.info(msg)),
      },
      prequalStore: createPrismaPrequalStore(prisma),
      notifier: demoNotifier,
      agent: deps?.agent ?? makeAgent(demoNotifier),
      log: (msg, err) => app.log.error({ err }, msg),
    });
    registerDemoRoutes(app, {
      dispatcher: demoDispatcher,
      messages: repository,
      demo: createPrismaDemoRepository(prisma),
      agentDrafts: agentRepository,
      notifier: demoNotifier,
      internalToken,
      log: (msg, err) => app.log.error({ err }, msg),
    });
  }

  // Transfer-journey tracker: advance a deal + notify the parties on WhatsApp,
  // with stage deadlines (countdown engine) and within-stage events (declines).
  registerDealRoutes(app, {
    deals,
    transition: (input) => transitionDeal(prisma, input),
    recordEvent: (input) => recordDealEvent(prisma, input),
    notifier,
    templates: loadTemplateConfigFromEnv(),
    deadlines: createPrismaDeadlineRepository(prisma),
    internalToken,
    log: (msg, err) => app.log.error({ err }, msg),
  });

  return app;
}
