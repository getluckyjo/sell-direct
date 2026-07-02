import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DEAL_STAGES, type DealStage } from '@sell-direct/shared';
import { InvalidTransitionError } from './state-machine';
import type { DealEventInput, TransitionInput } from './service';
import type { DealRepository } from './repository';
import { buildStageNotifications } from './stage-notifications';
import type { Notifier } from '../notifications';
import type { TemplateConfig } from '../notifications/templates';
import { applyStageDeadlines } from '../deadlines';
import type { DeadlineRepository } from '../deadlines';

export interface DealRouteDeps {
  deals: DealRepository;
  /** Applies the state-machine transition atomically (see deals/service.ts). */
  transition: (
    input: TransitionInput,
  ) => Promise<{ id: string; status: string }>;
  /** Appends a within-stage audit event (no status change). */
  recordEvent: (
    input: DealEventInput,
  ) => Promise<{ id: string; status: string }>;
  notifier: Notifier;
  templates: TemplateConfig;
  /** When present, stage deadlines are created/resolved on each transition. */
  deadlines?: DeadlineRepository;
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

      // Countdown engine: create this stage's deadlines, resolve completed ones.
      if (deps.deadlines) {
        try {
          await applyStageDeadlines(deps.deadlines, id, body.to);
        } catch (error) {
          log('stage deadlines failed', error);
        }
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

  /**
   * Bond declined by a bank — NOT a stage change (the deal stays in
   * `bond_application`); we record the event and immediately reassure both
   * parties with the multi-bank resubmission message. Verified basis: 45.5% of
   * applications declined by one bank are approved by another
   * (docs/BOTTLENECKS.md §1.1) — a decline must never read as the end.
   */
  app.post(
    '/api/deals/:id/bond-declined',
    {
      preHandler: guard,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            bank: { type: 'string', maxLength: 100 },
            note: { type: 'string', maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { bank?: string; note?: string };

      const context = await deps.deals.getNotificationContext(id);
      if (!context) return reply.code(404).send({ error: 'not_found' });

      const bank = body.bank ? `${body.bank} ` : '';
      await deps.recordEvent({
        dealId: id,
        actorType: 'system',
        note:
          body.note ??
          `bond declined by ${body.bank ?? 'a bank'} — resubmitted to remaining banks`,
      });

      const stage = `Bond update — ${bank}declined, resubmitting`;
      const detailBuyer =
        'Don’t worry: nearly half of applications declined by one bank are ' +
        'approved by another. We’ve already resubmitted to the remaining banks — ' +
        'no action needed from you.';
      const detailSeller =
        'The buyer’s application is already with the remaining banks — nearly ' +
        'half of first declines are approved elsewhere. We’ll update you the ' +
        'moment there’s a decision.';

      const templateId = deps.templates.transfer_status;
      const sendUpdate = async (to: string, detail: string) => {
        try {
          await deps.notifier.send(
            to,
            `📌 Transfer update for ${context.property}: ${stage}. ${detail}`,
            templateId
              ? {
                  templateId,
                  variables: { '1': context.property, '2': stage, '3': detail },
                }
              : undefined,
          );
          return 1;
        } catch (error) {
          log('bond-declined notification failed', error);
          return 0;
        }
      };

      let notified = await sendUpdate(context.buyerPhone, detailBuyer);
      if (context.sellerPhone) {
        notified += await sendUpdate(context.sellerPhone, detailSeller);
      }

      return { deal: { id }, notified };
    },
  );
}
