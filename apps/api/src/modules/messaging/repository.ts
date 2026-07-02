import { Prisma, type PrismaClient } from '@prisma/client';
import type { InboundMessage, OutboundMessage } from './types';

export interface MessageRepository {
  /**
   * Persist an inbound message; idempotent on `waMessageId` (providers may
   * redeliver). Returns `true` if newly stored, `false` if it was a duplicate —
   * callers use this to avoid processing/replying to the same message twice.
   */
  recordInbound(message: InboundMessage): Promise<boolean>;
  /** Persist an outbound message we sent. */
  recordOutbound(
    message: OutboundMessage & { from: string; waMessageId?: string },
  ): Promise<void>;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function createPrismaMessageRepository(
  prisma: PrismaClient,
): MessageRepository {
  return {
    async recordInbound(message) {
      try {
        await prisma.message.create({
          data: {
            direction: 'inbound',
            waMessageId: message.waMessageId,
            fromPhone: message.from,
            toPhone: message.to,
            type: message.type,
            body: message.text ?? null,
            // The raw message node carries no secrets (no tokens/credentials).
            raw: (message.raw ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          },
        });
        return true;
      } catch (error) {
        if (isUniqueViolation(error)) return false; // already stored — ignore redelivery
        throw error;
      }
    },

    async recordOutbound(message) {
      await prisma.message.create({
        data: {
          direction: 'outbound',
          waMessageId: message.waMessageId ?? null,
          fromPhone: message.from,
          toPhone: message.to,
          type: 'text',
          body: message.text,
        },
      });
    },
  };
}
