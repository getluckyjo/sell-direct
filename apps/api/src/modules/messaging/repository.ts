import { Prisma, type PrismaClient } from '@prisma/client';
import type { InboundMessage, OutboundMessage } from './types';

export interface MessageRepository {
  /** Persist an inbound message; idempotent on `waMessageId` (Meta may redeliver). */
  recordInbound(message: InboundMessage): Promise<void>;
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
      } catch (error) {
        if (isUniqueViolation(error)) return; // already stored — ignore redelivery
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
