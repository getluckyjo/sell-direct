import { Prisma, type PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createPrismaMessageRepository } from './repository';
import type { InboundMessage } from './types';

const inbound: InboundMessage = {
  waMessageId: 'wamid.DUP',
  from: '27820001111',
  to: '27210000000',
  type: 'text',
  text: 'hello',
  raw: { id: 'wamid.DUP' },
};

function fakePrisma(create: ReturnType<typeof vi.fn>): PrismaClient {
  return { message: { create } } as unknown as PrismaClient;
}

describe('prisma message repository', () => {
  it('persists an inbound message', async () => {
    const create = vi.fn().mockResolvedValue({});
    const repo = createPrismaMessageRepository(fakePrisma(create));

    await repo.recordInbound(inbound);

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].data).toMatchObject({
      direction: 'inbound',
      waMessageId: 'wamid.DUP',
      fromPhone: '27820001111',
      body: 'hello',
    });
  });

  it('swallows a duplicate (P2002) so redelivery is idempotent', async () => {
    const create = vi.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const repo = createPrismaMessageRepository(fakePrisma(create));

    await expect(repo.recordInbound(inbound)).resolves.toBeUndefined();
  });

  it('rethrows non-duplicate errors', async () => {
    const create = vi.fn().mockRejectedValue(new Error('db down'));
    const repo = createPrismaMessageRepository(fakePrisma(create));

    await expect(repo.recordInbound(inbound)).rejects.toThrow('db down');
  });
});
