import Fastify from 'fastify';
import { APP_NAME } from '@sell-direct/shared';

/**
 * Fastify bootstrap for the Sell Direct API.
 *
 * POPIA note: the logger must never record PII (full ID numbers, bank
 * details, payslip contents). Keep request/response body logging off and
 * redact sensitive fields explicitly as modules are added.
 */
export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: APP_NAME };
  });

  return app;
}

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const app = buildServer();

app
  .listen({ port, host })
  .then((address) => {
    app.log.info(`API listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
