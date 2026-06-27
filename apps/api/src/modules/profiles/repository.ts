import type { PrismaClient } from '@prisma/client';

export interface ProfileRepository {
  upsertBuyerByPhone(phone: string, name?: string): Promise<{ id: string }>;
  /** Record explicit financial consent + pre-qualification on a buyer. */
  recordBuyerFinancialConsent(
    buyerId: string,
    approvedAmountZar?: number,
  ): Promise<void>;
}

export function createPrismaProfileRepository(
  prisma: PrismaClient,
): ProfileRepository {
  return {
    async upsertBuyerByPhone(phone, name) {
      return prisma.buyer.upsert({
        where: { phone },
        update: name ? { name } : {},
        create: { phone, name: name ?? null },
        select: { id: true },
      });
    },
    async recordBuyerFinancialConsent(buyerId, approvedAmountZar) {
      await prisma.buyer.update({
        where: { id: buyerId },
        data: {
          financialConsentAt: new Date(),
          bondPrequalified: true,
          approvedAmountZar: approvedAmountZar ?? null,
        },
      });
    },
  };
}
