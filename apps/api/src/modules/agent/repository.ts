import type { PrismaClient } from '@prisma/client';
import type { AgentMessage, AgentRepository } from './types';
import type { AgentDataSource, AgentDeal, AgentListing } from './tools';

/** How many recent messages of history the model sees per turn. */
const HISTORY_LIMIT = 40;

export function createPrismaAgentRepository(
  prisma: PrismaClient,
): AgentRepository {
  return {
    async conversation(phone, limit = HISTORY_LIMIT) {
      const rows = await prisma.message.findMany({
        where: { OR: [{ fromPhone: phone }, { toPhone: phone }] },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { direction: true, body: true },
      });
      const messages: AgentMessage[] = rows
        .reverse()
        .filter((row) => (row.body ?? '').trim() !== '')
        .map((row) => ({
          role: row.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
          content: row.body as string,
        }));
      // The Messages API requires the thread to start with a user turn.
      while (messages.length > 0 && messages[0].role !== 'user') {
        messages.shift();
      }
      return messages;
    },

    async saveDraft(draft) {
      return prisma.agentDraft.create({
        data: draft,
        select: { id: true },
      });
    },

    async listDrafts(status) {
      return prisma.agentDraft.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    },

    async getDraft(id) {
      return prisma.agentDraft.findUnique({ where: { id } });
    },

    async markReviewed(id, status) {
      await prisma.agentDraft.update({
        where: { id },
        data: { status, reviewedAt: new Date() },
      });
    },
  };
}

export function createPrismaAgentDataSource(
  prisma: PrismaClient,
): AgentDataSource {
  return {
    async searchListings(query): Promise<AgentListing[]> {
      const terms = query.trim().split(/\s+/).filter(Boolean).slice(0, 5);
      const listings = await prisma.listing.findMany({
        where: {
          status: 'active',
          OR: terms.flatMap((term) => [
            { title: { contains: term, mode: 'insensitive' as const } },
            { suburb: { contains: term, mode: 'insensitive' as const } },
          ]),
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          suburb: true,
          priceZar: true,
          bedrooms: true,
          bathrooms: true,
          status: true,
        },
      });
      return listings.map((l) => ({
        ...l,
        priceZar: Number(l.priceZar),
      }));
    },

    async dealsForPhone(phone): Promise<AgentDeal[]> {
      const deals = await prisma.deal.findMany({
        where: {
          OR: [
            { buyer: { phone } },
            { listing: { seller: { phone } } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          buyer: { select: { phone: true } },
          listing: {
            select: { title: true, suburb: true },
          },
        },
      });
      return deals.map((d) => ({
        id: d.id,
        role: d.buyer.phone === phone ? ('buyer' as const) : ('seller' as const),
        property: `${d.listing.title}${d.listing.suburb ? ` (${d.listing.suburb})` : ''}`,
        status: d.status,
        updatedAt: d.updatedAt,
      }));
    },
  };
}
