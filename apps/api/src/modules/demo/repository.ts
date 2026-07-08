import type { PrismaClient } from '@prisma/client';
import type { Notifier } from '../notifications';
import type { MessageRepository } from '../messaging';
import type { DemoMessage, DemoRepository } from './types';

export function createPrismaDemoRepository(
  prisma: PrismaClient,
): DemoRepository {
  return {
    async conversation(phone): Promise<DemoMessage[]> {
      const rows = await prisma.message.findMany({
        where: { OR: [{ fromPhone: phone }, { toPhone: phone }] },
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: { direction: true, body: true, createdAt: true },
      });
      return rows
        .filter((r) => (r.body ?? '').trim() !== '')
        .map((r) => ({
          direction: r.direction,
          body: r.body as string,
          createdAt: r.createdAt,
        }));
    },
  };
}

let demoOutboundSeq = 0;

/**
 * A notifier that persists the outbound message but never touches a BSP —
 * the demo's replacement for the WhatsApp transport. Everything upstream
 * (dispatcher, flows, agent) is identical to production.
 */
export function createDemoNotifier(repository: MessageRepository): Notifier {
  return {
    async send(to, text) {
      demoOutboundSeq += 1;
      await repository.recordOutbound({
        to,
        text,
        from: 'demo',
        waMessageId: `wamid.demo.out.${Date.now()}.${demoOutboundSeq}`,
      });
    },
  };
}
