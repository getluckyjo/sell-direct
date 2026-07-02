import type { FastifyInstance, FastifyRequest } from 'fastify';
import type {
  ChallengeQuery,
  InboundMessage,
  MessagingAdapter,
  WebhookVerifyContext,
} from './types';
import type { MessageRepository } from './repository';

/** Request augmented with the captured raw body (set by the body parser). */
type RawBodyRequest = FastifyRequest & { rawBody?: string };

/** Routes an inbound message to the conversation flows (optional — see app.ts). */
export interface InboundDispatcher {
  handle(message: InboundMessage): Promise<void>;
}

export interface MessagingRouteDeps {
  adapter: MessagingAdapter;
  repository: MessageRepository;
  /** When present, newly-received messages are dispatched to the flows. */
  dispatcher?: InboundDispatcher;
}

/** Reconstruct the full public URL the provider called (proxy-aware). */
function publicUrl(request: FastifyRequest): string {
  const headers = request.headers;
  const proto =
    (Array.isArray(headers['x-forwarded-proto'])
      ? headers['x-forwarded-proto'][0]
      : headers['x-forwarded-proto']) ?? request.protocol;
  const host =
    (Array.isArray(headers['x-forwarded-host'])
      ? headers['x-forwarded-host'][0]
      : headers['x-forwarded-host']) ?? request.headers.host;
  return `${proto}://${host}${request.url}`;
}

/**
 * Register the WhatsApp webhook endpoints:
 *   GET  /api/webhooks/whatsapp  — Meta verification handshake (Twilio: 403, unused)
 *   POST /api/webhooks/whatsapp  — inbound (signature-verified, persisted, dispatched)
 */
export function registerWhatsappWebhook(
  app: FastifyInstance,
  deps: MessagingRouteDeps,
): void {
  const { adapter, repository, dispatcher } = deps;

  app.get('/api/webhooks/whatsapp', async (request, reply) => {
    const challenge = adapter.verifyChallenge(request.query as ChallengeQuery);
    if (challenge !== null) {
      return reply.code(200).type('text/plain').send(challenge);
    }
    return reply.code(403).send({ error: 'verification_failed' });
  });

  app.post('/api/webhooks/whatsapp', async (request: RawBodyRequest, reply) => {
    const ctx: WebhookVerifyContext = {
      rawBody: request.rawBody ?? '',
      body: request.body,
      headers: request.headers,
      url: publicUrl(request),
    };

    if (!adapter.verifySignature(ctx)) {
      return reply.code(401).send({ error: 'invalid_signature' });
    }

    const messages = adapter.parseInbound(request.body);
    for (const message of messages) {
      const isNew = await repository.recordInbound(message);
      // Dispatch (and reply) only for genuinely new messages — providers
      // redeliver on a slow ack, and we must not answer twice.
      if (isNew && dispatcher) {
        await dispatcher.handle(message);
      }
    }

    // Acknowledge quickly so the provider does not retry.
    return reply.code(200).send({ received: messages.length });
  });
}
