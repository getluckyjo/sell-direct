import type { PrismaClient } from '@prisma/client';

/**
 * Post-publish onboarding state: after the intake YES, the next text message
 * from the seller is treated as the (optional) listing description. Photo
 * attach deliberately does NOT depend on this row — photos key off the
 * seller's awaiting_photos listing, so descriptions and photos can arrive in
 * any order.
 */
export interface OnboardingState {
  listingId: string;
}

export interface OnboardingStore {
  get(phone: string): Promise<OnboardingState | null>;
  set(phone: string, state: OnboardingState): Promise<void>;
  clear(phone: string): Promise<void>;
}

const FLOW = 'listing_onboarding';

/**
 * Reuses the conversation_states table (unique per phone, flow-scoped read —
 * same pattern as the intake and prequal stores). If the seller starts a new
 * intake, that store's upsert replaces this row: the description step is
 * simply abandoned, which is fine.
 */
export function createPrismaOnboardingStore(
  prisma: PrismaClient,
): OnboardingStore {
  return {
    async get(phone) {
      const row = await prisma.conversationState.findUnique({
        where: { phone },
      });
      if (!row || row.flow !== FLOW) return null;
      const data = row.data as { listingId?: string };
      return data.listingId ? { listingId: data.listingId } : null;
    },
    async set(phone, state) {
      await prisma.conversationState.upsert({
        where: { phone },
        update: {
          flow: FLOW,
          step: 'awaiting_description',
          data: { ...state },
        },
        create: {
          phone,
          flow: FLOW,
          step: 'awaiting_description',
          data: { ...state },
        },
      });
    },
    async clear(phone) {
      await prisma.conversationState.deleteMany({
        where: { phone, flow: FLOW },
      });
    },
  };
}

export function createInMemoryOnboardingStore(): OnboardingStore {
  const states = new Map<string, OnboardingState>();
  return {
    async get(phone) {
      return states.get(phone) ?? null;
    },
    async set(phone, state) {
      states.set(phone, state);
    },
    async clear(phone) {
      states.delete(phone);
    },
  };
}
