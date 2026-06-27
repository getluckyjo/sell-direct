import type { PrismaClient } from '@prisma/client';
import type { ListingDraft } from './intake';

export interface ListingRepository {
  /** Upsert the seller (by phone) and create an active listing from a draft. */
  createFromDraft(phone: string, draft: ListingDraft): Promise<{ id: string }>;
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
  };
}
