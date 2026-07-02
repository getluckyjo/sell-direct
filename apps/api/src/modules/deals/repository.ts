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
  /** The contact details needed to notify a deal's parties of a stage change. */
  getNotificationContext(id: string): Promise<{
    property: string;
    buyerPhone: string;
    sellerPhone?: string;
  } | null>;
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
    async getNotificationContext(id) {
      const deal = await prisma.deal.findUnique({
        where: { id },
        select: {
          buyer: { select: { phone: true } },
          listing: {
            select: { title: true, seller: { select: { phone: true } } },
          },
        },
      });
      if (!deal) return null;
      return {
        property: deal.listing.title,
        buyerPhone: deal.buyer.phone,
        sellerPhone: deal.listing.seller.phone ?? undefined,
      };
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
