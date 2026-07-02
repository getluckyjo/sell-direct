import { type Prisma, type PrismaClient } from '@prisma/client';

const FLOW = 'buyer_prequal';

/** State held while a buyer is between enquiry and their consent reply. */
export interface PrequalState {
  buyerId: string;
  listingId: string;
}

/**
 * Persists the per-phone "awaiting bond pre-qualification consent" state.
 * Shares the `conversation_states` table (unique per phone) with listing
 * intake; the `flow` column keeps the two apart.
 */
export interface PrequalStore {
  get(phone: string): Promise<PrequalState | null>;
  set(phone: string, state: PrequalState): Promise<void>;
  clear(phone: string): Promise<void>;
}

export function createPrismaPrequalStore(prisma: PrismaClient): PrequalStore {
  return {
    async get(phone) {
      const row = await prisma.conversationState.findUnique({
        where: { phone },
      });
      if (!row || row.flow !== FLOW) return null;
      const data = row.data as { buyerId?: string; listingId?: string };
      if (!data.buyerId || !data.listingId) return null;
      return { buyerId: data.buyerId, listingId: data.listingId };
    },
    async set(phone, state) {
      const data = state as unknown as Prisma.InputJsonValue;
      await prisma.conversationState.upsert({
        where: { phone },
        create: { phone, flow: FLOW, step: 'awaiting_consent', data },
        update: { flow: FLOW, step: 'awaiting_consent', data },
      });
    },
    async clear(phone) {
      await prisma.conversationState.deleteMany({ where: { phone } });
    },
  };
}

/** In-memory store for tests and single-process dev. */
export function createInMemoryPrequalStore(): PrequalStore {
  const map = new Map<string, PrequalState>();
  return {
    async get(phone) {
      return map.get(phone) ?? null;
    },
    async set(phone, state) {
      map.set(phone, state);
    },
    async clear(phone) {
      map.delete(phone);
    },
  };
}
