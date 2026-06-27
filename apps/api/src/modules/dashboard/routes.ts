import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ListingRepository } from '../listings';
import type { DealRepository } from '../deals';

export interface DashboardRouteDeps {
  listings: ListingRepository;
  deals: DealRepository;
  /** When set, read endpoints require a matching `x-internal-token` header. */
  internalToken?: string;
}

/**
 * Internal read endpoints for the dashboard. These return PII (phone numbers),
 * so in production they must be guarded by an internal token — the dashboard
 * calls them server-to-server and never exposes them to the browser.
 */
export function registerDashboardRoutes(
  app: FastifyInstance,
  deps: DashboardRouteDeps,
): void {
  async function guard(request: FastifyRequest, reply: FastifyReply) {
    if (!deps.internalToken) return;
    if (request.headers['x-internal-token'] !== deps.internalToken) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  }

  app.get('/api/listings', { preHandler: guard }, async () => ({
    listings: await deps.listings.list(),
  }));

  app.get('/api/deals', { preHandler: guard }, async () => ({
    deals: await deps.deals.list(),
  }));

  app.get('/api/deals/:id', { preHandler: guard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deal = await deps.deals.getWithTimeline(id);
    if (!deal) return reply.code(404).send({ error: 'not_found' });
    return { deal };
  });
}
