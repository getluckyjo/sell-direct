import type { PrismaClient } from '@prisma/client';
import type { LeadInput } from './types';

export interface LeadRepository {
  create(input: LeadInput): Promise<{ id: string }>;
}

export function createPrismaLeadRepository(
  prisma: PrismaClient,
): LeadRepository {
  return {
    async create(input) {
      return prisma.lead.create({
        data: {
          kind: input.kind,
          email: input.email,
          name: input.name ?? null,
          phone: input.phone ?? null,
          role: input.role ?? null,
          message: input.message ?? null,
          source: input.source ?? null,
          // Consent is validated true at the route; stamp when we store.
          consentAt: new Date(),
        },
        select: { id: true },
      });
    },
  };
}
