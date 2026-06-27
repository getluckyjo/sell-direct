import { describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../app';
import type { LeadRepository } from './repository';

function fakeLeadRepository(): LeadRepository & {
  create: ReturnType<typeof vi.fn>;
} {
  return { create: vi.fn().mockResolvedValue({ id: 'lead_1' }) };
}

async function post(repository: LeadRepository, payload: unknown) {
  const app = buildServer({ leadRepository: repository });
  const res = await app.inject({
    method: 'POST',
    url: '/api/leads',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(payload),
  });
  await app.close();
  return res;
}

describe('POST /api/leads', () => {
  it('accepts a valid waitlist signup', async () => {
    const repository = fakeLeadRepository();
    const res = await post(repository, {
      kind: 'waitlist',
      email: 'thabo@example.co.za',
      role: 'seller',
      source: 'marketing:hero',
      consent: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: 'lead_1' });
    expect(repository.create).toHaveBeenCalledOnce();
    expect(repository.create.mock.calls[0][0]).toMatchObject({
      kind: 'waitlist',
      email: 'thabo@example.co.za',
      role: 'seller',
    });
  });

  it('rejects a missing consent (400) and stores nothing', async () => {
    const repository = fakeLeadRepository();
    const res = await post(repository, {
      kind: 'waitlist',
      email: 'thabo@example.co.za',
    });
    expect(res.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects consent=false (400)', async () => {
    const repository = fakeLeadRepository();
    const res = await post(repository, {
      kind: 'waitlist',
      email: 'thabo@example.co.za',
      consent: false,
    });
    expect(res.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed email (400)', async () => {
    const repository = fakeLeadRepository();
    const res = await post(repository, {
      kind: 'waitlist',
      email: 'not-an-email',
      consent: true,
    });
    expect(res.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown kind (400)', async () => {
    const repository = fakeLeadRepository();
    const res = await post(repository, {
      kind: 'spam',
      email: 'thabo@example.co.za',
      consent: true,
    });
    expect(res.statusCode).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
