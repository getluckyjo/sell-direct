import type { PrismaClient } from '@prisma/client';

export interface DealRepository {
  /** Create (or return the existing) enquiry deal for a listing + buyer. */
  createOrGetEnquiryDeal(
    listingId: string,
    buyerId: string,
  ): Promise<{ id: string; status: string }>;
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
  };
}
