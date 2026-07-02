import { describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { registerDealRoutes, type DealRouteDeps } from './routes';
import { InvalidTransitionError } from './state-machine';
import type { DealRepository } from './repository';

function fakeDeals(context: unknown = null): DealRepository {
  return {
    createOrGetEnquiryDeal: vi.fn(),
    list: vi.fn(async () => []),
    getWithTimeline: vi.fn(async () => null),
    getNotificationContext: vi.fn(async () => context) as never,
  };
}

const CONTEXT = {
  property: '23 Vredehoek Ave',
  buyerPhone: '+27820001111',
  sellerPhone: '+27830002222',
};

function build(overrides: Partial<DealRouteDeps> = {}) {
  const app = Fastify();
  const deps: DealRouteDeps = {
    deals: fakeDeals(CONTEXT),
    transition: vi.fn(async (input) => ({
      id: input.dealId,
      status: input.to,
    })),
    notifier: { send: vi.fn(async () => {}) },
    templates: { bond_approved: 'HXbond', transfer_status: 'HXtransfer' },
    internalToken: 'secret',
    ...overrides,
  };
  registerDealRoutes(app, deps);
  return { app, deps };
}

const post = (app: ReturnType<typeof Fastify>, body: unknown, token?: string) =>
  app.inject({
    method: 'POST',
    url: '/api/deals/d1/transition',
    headers: token ? { 'x-internal-token': token } : {},
    payload: body as Record<string, unknown>,
  });

describe('POST /api/deals/:id/transition', () => {
  it('transitions the deal and notifies the parties', async () => {
    const { app, deps } = build();
    const res = await post(app, { to: 'lodgement' }, 'secret');

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      deal: { id: 'd1', status: 'lodgement' },
      notified: 2,
    });
    expect(deps.transition).toHaveBeenCalledWith({
      dealId: 'd1',
      to: 'lodgement',
      actorType: 'agent',
      note: undefined,
    });
    // template SID passed through for a stage with a configured template
    const sendMock = deps.notifier.send as ReturnType<typeof vi.fn>;
    expect(sendMock.mock.calls[0][2].templateId).toBe('HXtransfer');
    await app.close();
  });

  it('falls back to session text when no template SID is configured', async () => {
    const { app, deps } = build({ templates: {} });
    const res = await post(app, { to: 'lodgement' }, 'secret');

    expect(res.statusCode).toBe(200);
    const sendMock = deps.notifier.send as ReturnType<typeof vi.fn>;
    expect(sendMock.mock.calls[0][2].templateId).toBeUndefined();
    await app.close();
  });

  it('passes bank details through to the bond_approved template', async () => {
    const { app, deps } = build();
    await post(
      app,
      { to: 'bond_granted', bank: 'Standard Bank', amountZar: 'R5 400 000' },
      'secret',
    );
    const sendMock = deps.notifier.send as ReturnType<typeof vi.fn>;
    const buyerCall = sendMock.mock.calls.find(
      (c) => c[0] === CONTEXT.buyerPhone,
    );
    expect(buyerCall?.[2].templateId).toBe('HXbond');
    expect(buyerCall?.[2].variables?.['2']).toBe('Standard Bank');
    await app.close();
  });

  it('returns 409 on an invalid transition', async () => {
    const { app } = build({
      transition: vi.fn(async () => {
        throw new InvalidTransitionError('enquiry', 'registered');
      }),
    });
    const res = await post(app, { to: 'registered' }, 'secret');
    expect(res.statusCode).toBe(409);
    await app.close();
  });

  it('returns 404 for an unknown deal', async () => {
    const { app, deps } = build({ deals: fakeDeals(null) });
    const res = await post(app, { to: 'offer_otp' }, 'secret');
    expect(res.statusCode).toBe(404);
    expect(deps.transition).not.toHaveBeenCalled();
    await app.close();
  });

  it('requires the internal token', async () => {
    const { app, deps } = build();
    const res = await post(app, { to: 'offer_otp' });
    expect(res.statusCode).toBe(401);
    expect(deps.transition).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects an unknown stage with 400', async () => {
    const { app } = build();
    const res = await post(app, { to: 'teleported' }, 'secret');
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('still succeeds when a notification send fails (transition is the record)', async () => {
    const { app } = build({
      notifier: {
        send: vi.fn(async () => {
          throw new Error('twilio down');
        }),
      },
    });
    const res = await post(app, { to: 'lodgement' }, 'secret');
    expect(res.statusCode).toBe(200);
    expect(res.json().notified).toBe(0);
    await app.close();
  });
});
