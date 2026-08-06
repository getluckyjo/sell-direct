import { buildServer } from './app';
import { prisma } from './db/client';
import {
  createPrismaDeadlineRepository,
  startDeadlineScheduler,
} from './modules/deadlines';
import { createPrismaDealRepository } from './modules/deals';
import {
  createMessagingAdapter,
  senderNumber,
  createPrismaMessageRepository,
} from './modules/messaging';
import { createNotifier } from './modules/notifications';
import { loadTemplateConfigFromEnv } from './modules/notifications';
import {
  createPrismaConversationStore,
  startReengagementScheduler,
} from './modules/listings';

// Runtime entry point: build the app and start listening.
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const app = buildServer();

// Deadline countdown engine — runtime only (buildServer stays timer-free so
// tests never leak intervals). Hourly tick; reminders are tier-idempotent.
startDeadlineScheduler({
  repository: createPrismaDeadlineRepository(prisma),
  notifier: createNotifier(
    createMessagingAdapter(),
    createPrismaMessageRepository(prisma),
    senderNumber(),
  ),
  lookup: (dealId) =>
    createPrismaDealRepository(prisma).getNotificationContext(dealId),
  transferTemplateId: loadTemplateConfigFromEnv().transfer_status,
  log: (msg, err) => app.log.error({ err }, msg),
});

// Re-engagement: one nudge for a seller who started a listing and went
// quiet. Runtime only, same as the deadline engine above.
const reengagementNotifier = createNotifier(
  createMessagingAdapter(),
  createPrismaMessageRepository(prisma),
  senderNumber(),
);
startReengagementScheduler({
  store: createPrismaConversationStore(prisma),
  send: (phone, text) => reengagementNotifier.send(phone, text),
  sendTemplate: (phone, templateId) =>
    reengagementNotifier.send(phone, '', { templateId }),
  reengagementTemplateId: loadTemplateConfigFromEnv().reengagement,
  log: (msg, err) => app.log.error({ err }, msg),
});

app
  .listen({ port, host })
  .then((address) => {
    app.log.info(`API listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
