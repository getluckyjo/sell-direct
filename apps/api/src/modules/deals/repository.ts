import type { PrismaClient } from '@prisma/client';

export interface DealRepository {
  /** Create (or return the existing) enquiry deal for a listing + buyer. */
  createOrGetEnquiryDeal(
    listingId: string,
    buyerId: string,
  ): Promise<{ id: string; status: string }>;
  /** Recent deals for the internal dashboard. */
  list(): Promise<unknown[]>;
  /** A single deal with its full status timeline (deal_events). */
  getWithTimeline(id: string): Promise<unknown | null>;
}

export function createPrismaDealRepository(
  prisma: PrismaClient,
): DealRepository {
  return {
    async createOrGetEnquiryDeal(listingId, buyerId) {
      return prisma.deal.upsert({
        where: { listingId_buyerId: { listingId, buyerId } },
        update: {},
        create: { listingId, buyerId, status: 'enquiry' },
        select: { id: true, status: true },
      });
    },
    async list() {
      return prisma.deal.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          listing: { select: { title: true, suburb: true, priceZar: true } },
          buyer: {
            select: { phone: true, name: true, bondPrequalified: true },
          },
        },
      });
    },
    async getWithTimeline(id) {
      return prisma.deal.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          listing: {
            select: { title: true, suburb: true, priceZar: true, status: true },
          },
          buyer: {
            select: { phone: true, name: true, bondPrequalified: true },
          },
          events: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              actorType: true,
              note: true,
              createdAt: true,
            },
          },
        },
      });
    },
  };
}
