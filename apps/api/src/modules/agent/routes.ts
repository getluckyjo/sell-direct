import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Notifier } from '../notifications';
import type { AgentRepository } from './types';

export interface AgentRouteDeps {
  repository: AgentRepository;
  notifier: Notifier;
  /** When set, endpoints require a matching `x-internal-token` header. */
  internalToken?: string;
  log?: (message: string, error?: unknown) => void;
}

/**
 * The shadow-mode review queue. The dashboard lists pending drafts; a
 * concierge approves (optionally editing the text — the edit is what sends)
 * or dismisses. These endpoints return PII (phone numbers), so in production
 * they must be guarded by the internal token, same as the dashboard reads.
 */
export function registerAgentRoutes(
  app: FastifyInstance,
  deps: AgentRouteDeps,
): void {
  const log = deps.log ?? (() => {});

  async function guard(request: FastifyRequest, reply: FastifyReply) {
    if (!deps.internalToken) return;
    if (request.headers['x-internal-token'] !== deps.internalToken) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  }

  app.get('/api/agent/drafts', { preHandler: guard }, async (request) => {
    const { status } = request.query as { status?: string };
    const allowed = ['pending', 'approved', 'dismissed', 'sent'] as const;
    const filter = allowed.find((s) => s === status);
    return { drafts: await deps.repository.listDrafts(filter ?? 'pending') };
  });

  app.post(
    '/api/agent/drafts/:id/approve',
    { preHandler: guard },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as { text?: string };
      const draft = await deps.repository.getDraft(id);
      if (!draft) return reply.code(404).send({ error: 'not_found' });
      if (draft.status !== 'pending') {
        return reply.code(409).send({ error: 'already_reviewed' });
      }
      const text = body.text?.trim() || draft.draft;
      try {
        await deps.notifier.send(draft.phone, text);
      } catch (error) {
        log('agent draft send failed', error);
        return reply.code(502).send({ error: 'send_failed' });
      }
      await deps.repository.markReviewed(id, 'approved');
      return { sent: true };
    },
  );

  app.post(
    '/api/agent/drafts/:id/dismiss',
    { preHandler: guard },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const draft = await deps.repository.getDraft(id);
      if (!draft) return reply.code(404).send({ error: 'not_found' });
      if (draft.status !== 'pending') {
        return reply.code(409).send({ error: 'already_reviewed' });
      }
      await deps.repository.markReviewed(id, 'dismissed');
      return { dismissed: true };
    },
  );
}
