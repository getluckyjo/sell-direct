import type { PrismaClient } from '@prisma/client';
import type { DealStage } from '@sell-direct/shared';
import { assertTransition } from './state-machine';

export interface TransitionInput {
  dealId: string;
  to: DealStage;
  actorType: 'seller' | 'buyer' | 'agent' | 'system';
  /** Id of the acting seller/buyer/user; omit for system transitions. */
  actorId?: string;
  note?: string;
}

/**
 * Apply a deal transition atomically:
 *   1. validate it against the state machine,
 *   2. update the deal's status,
 *   3. append an immutable `deal_events` row.
 *
 * Steps 2 and 3 run in a single transaction so the status and its audit trail
 * can never drift apart. Throws {@link InvalidTransitionError} for an
 * unauthorised transition.
 */
export async function transitionDeal(
  prisma: PrismaClient,
  input: TransitionInput,
) {
  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUniqueOrThrow({
      where: { id: input.dealId },
    });

    const from = deal.status as DealStage;
    assertTransition(from, input.to);

    const updated = await tx.deal.update({
      where: { id: deal.id },
      data: { status: input.to },
    });

    await tx.dealEvent.create({
      data: {
        dealId: deal.id,
        fromStatus: from,
        toStatus: input.to,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        note: input.note ?? null,
      },
    });

    return updated;
  });
}
