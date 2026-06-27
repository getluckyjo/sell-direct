import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ChallengeQuery, MessagingAdapter } from './types';
import type { MessageRepository } from './repository';

/** Request augmented with the captured raw body (set by the JSON parser). */
type RawBodyRequest = FastifyRequest & { rawBody?: string };

export interface MessagingRouteDeps {
  adapter: MessagingAdapter;
  repository: MessageRepository;
}

/**
 * Register the WhatsApp webhook endpoints:
 *   GET  /api/webhooks/whatsapp  — Meta verification handshake
 *   POST /api/webhooks/whatsapp  — inbound messages (signature-verified, persisted)
 */
export function registerWhatsappWebhook(
  app: FastifyInstance,
  deps: MessagingRouteDeps,
): void {
  const { adapter, repository } = deps;

  app.get('/api/webhooks/whatsapp', async (request, reply) => {
    const challenge = adapter.verifyChallenge(request.query as ChallengeQuery);
    if (challenge !== null) {
      return reply.code(200).type('text/plain').send(challenge);
    }
    return reply.code(403).send({ error: 'verification_failed' });
  });

  app.post('/api/webhooks/whatsapp', async (request: RawBodyRequest, reply) => {
    const header = request.headers['x-hub-signature-256'];
    const signature = typeof header === 'string' ? header : undefined;

    if (!adapter.verifySignature(request.rawBody ?? '', signature)) {
      return reply.code(401).send({ error: 'invalid_signature' });
    }

    const messages = adapter.parseInbound(request.body);
    for (const message of messages) {
      await repository.recordInbound(message);
    }

    // Acknowledge quickly so Meta does not retry.
    return reply.code(200).send({ received: messages.length });
  });
}
