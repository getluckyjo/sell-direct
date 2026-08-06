import { type Prisma, type PrismaClient } from '@prisma/client';
import type { IntakeState, IntakeStep, ListingDraft } from './intake';

/** A conversation that stopped part-way through, with when it went quiet. */
export interface StaleConversation {
  phone: string;
  state: IntakeState;
  lastActivity: Date;
}

/** Persists per-phone conversation state for guided flows. */
export interface ConversationStore {
  get(phone: string): Promise<IntakeState | null>;
  set(phone: string, state: IntakeState): Promise<void>;
  clear(phone: string): Promise<void>;
  /**
   * Drafts with no activity since `idleBefore` — sellers who started and went
   * quiet. Excludes any already nudged, so a seller is prompted once and not
   * pestered.
   */
  findStale(idleBefore: Date, limit?: number): Promise<StaleConversation[]>;
  /** Record that a re-engagement nudge went out, so it never repeats. */
  markNudged(phone: string, at: Date): Promise<void>;
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
      // The cached price estimate and the picker's transient state ride
      // inside the JSON under reserved keys (the row has no separate
      // columns); strip them back out of the draft.
      const { _estimate, _pending, _owner, _nudgedAt, ...draft } = (row.data ??
        {}) as Record<string, unknown>;
      void _nudgedAt; // read via findStale, not part of the conversation state
      return {
        step: row.step as IntakeStep,
        data: draft as Partial<ListingDraft>,
        ...(_estimate !== undefined
          ? { estimate: _estimate as IntakeState['estimate'] }
          : {}),
        ...(_pending !== undefined
          ? { pending: _pending as IntakeState['pending'] }
          : {}),
        // Rows written before ownership was tracked have no marker; the
        // dispatcher treats a missing owner as scripted.
        ...(_owner !== undefined
          ? { owner: _owner as IntakeState['owner'] }
          : {}),
      };
    },
    async set(phone, state) {
      const data = {
        ...state.data,
        ...(state.estimate !== undefined ? { _estimate: state.estimate } : {}),
        ...(state.pending !== undefined ? { _pending: state.pending } : {}),
        ...(state.owner !== undefined ? { _owner: state.owner } : {}),
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
    async findStale(idleBefore, limit = 100) {
      const rows = await prisma.conversationState.findMany({
        where: { flow: 'listing_intake', updatedAt: { lt: idleBefore } },
        orderBy: { updatedAt: 'asc' },
        take: limit,
      });
      const stale: StaleConversation[] = [];
      for (const row of rows) {
        const data = (row.data ?? {}) as Record<string, unknown>;
        if (data._nudgedAt !== undefined) continue; // already prompted once
        const state = await this.get(row.phone);
        if (state) {
          stale.push({ phone: row.phone, state, lastActivity: row.updatedAt });
        }
      }
      return stale;
    },
    async markNudged(phone, at) {
      const row = await prisma.conversationState.findUnique({
        where: { phone },
      });
      if (!row) return;
      const data = {
        ...((row.data ?? {}) as Record<string, unknown>),
        _nudgedAt: at.toISOString(),
      } as Prisma.InputJsonValue;
      // Touching `data` only — `updatedAt` moving is harmless, since the
      // nudge marker is what excludes this row from the next sweep.
      await prisma.conversationState.update({
        where: { phone },
        data: { data },
      });
    },
  };
}

/** In-memory store for tests and single-process dev. */
export function createInMemoryConversationStore(): ConversationStore {
  const map = new Map<string, IntakeState>();
  const touched = new Map<string, Date>();
  const nudged = new Set<string>();
  return {
    async get(phone) {
      return map.get(phone) ?? null;
    },
    async set(phone, state, at?: Date) {
      map.set(phone, state);
      touched.set(phone, at ?? new Date());
    },
    async clear(phone) {
      map.delete(phone);
      touched.delete(phone);
      nudged.delete(phone);
    },
    async findStale(idleBefore, limit = 100) {
      const out: StaleConversation[] = [];
      for (const [phone, state] of map) {
        if (nudged.has(phone)) continue;
        const lastActivity = touched.get(phone) ?? new Date(0);
        if (lastActivity < idleBefore) out.push({ phone, state, lastActivity });
      }
      return out
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, limit);
    },
    async markNudged(phone) {
      nudged.add(phone);
    },
  };
}
