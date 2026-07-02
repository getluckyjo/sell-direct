import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DEAL_STAGES, type DealStage } from '@sell-direct/shared';
import { InvalidTransitionError } from './state-machine';
import type { TransitionInput } from './service';
import type { DealRepository } from './repository';
import { buildStageNotifications } from './stage-notifications';
import type { Notifier } from '../notifications';
import type { TemplateConfig } from '../notifications/templates';

export interface DealRouteDeps {
  deals: DealRepository;
  /** Applies the state-machine transition atomically (see deals/service.ts). */
  transition: (
    input: TransitionInput,
  ) => Promise<{ id: string; status: string }>;
  notifier: Notifier;
  templates: TemplateConfig;
  /** When set, the endpoint requires a matching `x-internal-token` header. */
  internalToken?: string;
  log?: (message: string, error?: unknown) => void;
}

interface TransitionBody {
  to: DealStage;
  note?: string;
  bank?: string;
  amountZar?: string;
  actorType?: 'agent' | 'system';
}

const BODY_SCHEMA = {
  type: 'object',
  required: ['to'],
  additionalProperties: false,
  properties: {
    to: { type: 'string', enum: [...DEAL_STAGES] },
    note: { type: 'string', maxLength: 500 },
    bank: { type: 'string', maxLength: 100 },
    amountZar: { type: 'string', maxLength: 40 },
    actorType: { type: 'string', enum: ['agent', 'system'] },
  },
} as const;

/**
 * Internal write endpoint: advance a deal through the SA transfer journey.
 *
 *   POST /api/deals/:id/transition   { to, note?, bank?, amountZar? }
 *
 * Applies the state machine (audit event included), then notifies the buyer
 * and seller on WhatsApp using the approved template for the stage (falling
 * back to plain session text until template SIDs are configured). Notification
 * failures never roll back the transition — the status change is the record;
 * delivery is best-effort and logged.
 */
export function registerDealRoutes(
  app: FastifyInstance,
  deps: DealRouteDeps,
): void {
  const log = deps.log ?? (() => {});

  async function guard(request: FastifyRequest, reply: FastifyReply) {
    if (!deps.internalToken) return;
    if (request.headers['x-internal-token'] !== deps.internalToken) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  }

  app.post(
    '/api/deals/:id/transition',
    { preHandler: guard, schema: { body: BODY_SCHEMA } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as TransitionBody;

      const context = await deps.deals.getNotificationContext(id);
      if (!context) return reply.code(404).send({ error: 'not_found' });

      let deal;
      try {
        deal = await deps.transition({
          dealId: id,
          to: body.to,
          actorType: body.actorType ?? 'agent',
          note: body.note,
        });
      } catch (error) {
        if (error instanceof InvalidTransitionError) {
          return reply.code(409).send({ error: 'invalid_transition' });
        }
        throw error;
      }

      const notifications = buildStageNotifications(body.to, {
        ...context,
        note: body.note,
        bank: body.bank,
        amountZar: body.amountZar,
      });

      let notified = 0;
      for (const n of notifications) {
        try {
          const templateId = n.templateKey
            ? deps.templates[n.templateKey]
            : undefined;
          await deps.notifier.send(n.to, n.text, {
            templateId,
            variables: templateId ? n.variables : undefined,
          });
          notified += 1;
        } catch (error) {
          log('stage notification failed', error);
        }
      }

      return { deal: { id: deal.id, status: deal.status }, notified };
    },
  );
}
