import type { PrismaClient } from '@prisma/client';
import type { ListingDraft } from './intake';

export interface ListingRepository {
  /** Upsert the seller (by phone) and create an active listing from a draft. */
  createFromDraft(phone: string, draft: ListingDraft): Promise<{ id: string }>;
  /** Recent listings for the internal dashboard. */
  list(): Promise<unknown[]>;
}

export function createPrismaListingRepository(
  prisma: PrismaClient,
): ListingRepository {
  return {
    async createFromDraft(phone, draft) {
      const seller = await prisma.seller.upsert({
        where: { phone },
        update: {},
        create: { phone },
        select: { id: true },
      });
      return prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: draft.title,
          suburb: draft.suburb,
          city: 'Cape Town',
          priceZar: draft.priceZar,
          bedrooms: draft.bedrooms,
          bathrooms: draft.bathrooms,
          exclusivityTermDays: draft.exclusivityTermDays,
          tier: draft.tier,
          status: 'active',
        },
        select: { id: true },
      });
    },
    async list() {
      return prisma.listing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          suburb: true,
          city: true,
          priceZar: true,
          bedrooms: true,
          bathrooms: true,
          status: true,
          tier: true,
          createdAt: true,
          seller: { select: { phone: true, name: true } },
          _count: { select: { deals: true } },
        },
      });
    },
  };
}
