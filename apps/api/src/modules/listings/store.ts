import { type Prisma, type PrismaClient } from '@prisma/client';
import type { IntakeState, IntakeStep, ListingDraft } from './intake';

/** Persists per-phone conversation state for guided flows. */
export interface ConversationStore {
  get(phone: string): Promise<IntakeState | null>;
  set(phone: string, state: IntakeState): Promise<void>;
  clear(phone: string): Promise<void>;
}

export function createPrismaConversationStore(
  prisma: PrismaClient,
): ConversationStore {
  return {
    async get(phone) {
      const row = await prisma.conversationState.findUnique({
        where: { phone },
      });
      // Only surface listing-intake conversations — a phone's single
      // conversation row may instead belong to another flow (e.g. buyer
      // pre-qualification), which this store must not misread as a draft.
      if (!row || row.flow !== 'listing_intake') return null;
      // The cached price estimate rides inside the JSON under a reserved key
      // (the row has no separate column); strip it back out of the draft.
      const { _estimate, ...draft } = (row.data ?? {}) as Record<
        string,
        unknown
      >;
      return {
        step: row.step as IntakeStep,
        data: draft as Partial<ListingDraft>,
        ...(_estimate !== undefined
          ? { estimate: _estimate as IntakeState['estimate'] }
          : {}),
      };
    },
    async set(phone, state) {
      const data = {
        ...state.data,
        ...(state.estimate !== undefined ? { _estimate: state.estimate } : {}),
      } as Prisma.InputJsonValue;
      await prisma.conversationState.upsert({
        where: { phone },
        create: { phone, flow: 'listing_intake', step: state.step, data },
        update: { step: state.step, data },
      });
    },
    async clear(phone) {
      await prisma.conversationState.deleteMany({ where: { phone } });
    },
  };
}

/** In-memory store for tests and single-process dev. */
export function createInMemoryConversationStore(): ConversationStore {
  const map = new Map<string, IntakeState>();
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
