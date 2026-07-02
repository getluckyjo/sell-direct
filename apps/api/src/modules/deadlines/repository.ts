import type { PrismaClient } from '@prisma/client';

export interface DeadlineRecord {
  id: string;
  dealId: string;
  kind: string;
  label: string;
  dueAt: Date;
  remindedAt: number[];
}

export interface DeadlineRepository {
  /** Create a deadline unless an unresolved one of this kind already exists. */
  createIfAbsent(input: {
    dealId: string;
    kind: string;
    label: string;
    dueAt: Date;
  }): Promise<void>;
  /** Unresolved deadlines due before `before` (i.e. within a reminder window). */
  listUnresolvedDueBefore(before: Date): Promise<DeadlineRecord[]>;
  /** Record that the `tier`-day reminder was sent (idempotency). */
  markReminded(id: string, tier: number): Promise<void>;
  /** Resolve all unresolved deadlines of the given kinds on a deal. */
  resolve(dealId: string, kinds: string[]): Promise<void>;
}

export function createPrismaDeadlineRepository(
  prisma: PrismaClient,
): DeadlineRepository {
  return {
    async createIfAbsent(input) {
      const existing = await prisma.deadline.findFirst({
        where: { dealId: input.dealId, kind: input.kind, resolvedAt: null },
        select: { id: true },
      });
      if (existing) return;
      await prisma.deadline.create({ data: input });
    },
    async listUnresolvedDueBefore(before) {
      return prisma.deadline.findMany({
        where: { resolvedAt: null, dueAt: { lte: before } },
        select: {
          id: true,
          dealId: true,
          kind: true,
          label: true,
          dueAt: true,
          remindedAt: true,
        },
      });
    },
    async markReminded(id, tier) {
      const row = await prisma.deadline.findUnique({
        where: { id },
        select: { remindedAt: true },
      });
      if (!row || row.remindedAt.includes(tier)) return;
      await prisma.deadline.update({
        where: { id },
        data: { remindedAt: [...row.remindedAt, tier] },
      });
    },
    async resolve(dealId, kinds) {
      await prisma.deadline.updateMany({
        where: { dealId, kind: { in: kinds }, resolvedAt: null },
        data: { resolvedAt: new Date() },
      });
    },
  };
}
