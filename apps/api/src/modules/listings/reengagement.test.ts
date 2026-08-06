import { describe, expect, it, vi } from 'vitest';
import {
  composeNudge,
  nudgeStaleDrafts,
  type ReengagementDeps,
} from './reengagement';
import { createInMemoryConversationStore } from './store';
import type { IntakeState } from './intake';

const NOW = new Date('2026-08-06T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

function draft(step: IntakeState['step'], suburb?: string): IntakeState {
  return {
    step,
    data: {
      propertyType: 'house',
      tier: 'free',
      ...(suburb ? { suburb } : {}),
    },
    owner: 'scripted',
  };
}

/** The in-memory store takes an explicit timestamp so idleness is testable. */
async function storeWith(
  entries: { phone: string; state: IntakeState; at: Date }[],
) {
  const store = createInMemoryConversationStore();
  for (const e of entries) {
    await (
      store.set as (p: string, s: IntakeState, at?: Date) => Promise<void>
    )(e.phone, e.state, e.at);
  }
  return store;
}

function deps(
  store: Awaited<ReturnType<typeof storeWith>>,
  over: Partial<ReengagementDeps> = {},
) {
  return {
    store,
    send: vi.fn(async () => {}),
    now: () => NOW,
    ...over,
  } as ReengagementDeps & { send: ReturnType<typeof vi.fn> };
}

describe('re-engaging abandoned drafts', () => {
  it('nudges a draft that has been quiet past the idle window', async () => {
    const store = await storeWith([
      {
        phone: '+27821110000',
        state: draft('awaiting_price', 'Mowbray'),
        at: hoursAgo(8),
      },
    ]);
    const d = deps(store);

    const run = await nudgeStaleDrafts(d);

    expect(run.nudged).toBe(1);
    expect(d.send).toHaveBeenCalledOnce();
    const [phone, text] = d.send.mock.calls[0];
    expect(phone).toBe('+27821110000');
    expect(text).toContain('Mowbray');
    expect(text).toMatch(/asking price/i);
  });

  it('leaves a draft alone while it is still active', async () => {
    const store = await storeWith([
      {
        phone: '+27821110001',
        state: draft('awaiting_price'),
        at: hoursAgo(1),
      },
    ]);
    const d = deps(store);

    const run = await nudgeStaleDrafts(d);

    expect(run.nudged).toBe(0);
    expect(d.send).not.toHaveBeenCalled();
  });

  it('nudges once and never again', async () => {
    const store = await storeWith([
      {
        phone: '+27821110002',
        state: draft('awaiting_bedrooms'),
        at: hoursAgo(30),
      },
    ]);
    const d = deps(store, {
      sendTemplate: vi.fn(async () => {}),
      reengagementTemplateId: 'tpl_reengage',
    });

    expect((await nudgeStaleDrafts(d)).nudged).toBe(1);
    // A seller gets one prompt, not a drip campaign.
    expect((await nudgeStaleDrafts(d)).nudged).toBe(0);
  });

  it('uses an approved template once the 24-hour session window has closed', async () => {
    const store = await storeWith([
      {
        phone: '+27821110003',
        state: draft('awaiting_price'),
        at: hoursAgo(30),
      },
    ]);
    const sendTemplate = vi.fn(async () => {});
    const d = deps(store, {
      sendTemplate,
      reengagementTemplateId: 'tpl_reengage',
    });

    const run = await nudgeStaleDrafts(d);

    expect(run.nudged).toBe(1);
    expect(sendTemplate).toHaveBeenCalledWith('+27821110003', 'tpl_reengage');
    expect(d.send).not.toHaveBeenCalled(); // free text would be rejected
  });

  it('skips out-of-window drafts when no template is configured', async () => {
    const store = await storeWith([
      {
        phone: '+27821110004',
        state: draft('awaiting_price'),
        at: hoursAgo(30),
      },
    ]);
    const d = deps(store);

    const run = await nudgeStaleDrafts(d);

    // Better to send nothing than something WhatsApp will refuse.
    expect(run.nudged).toBe(0);
    expect(run.skippedOutOfWindow).toBe(1);
    expect(d.send).not.toHaveBeenCalled();
  });

  it('never messages a demo thread', async () => {
    const store = await storeWith([
      {
        phone: '+27001234567',
        state: draft('awaiting_price'),
        at: hoursAgo(9),
      },
    ]);
    const d = deps(store);

    const run = await nudgeStaleDrafts(d);

    expect(run.nudged).toBe(0);
    expect(d.send).not.toHaveBeenCalled();
  });

  it('keeps sweeping when one send fails', async () => {
    const store = await storeWith([
      {
        phone: '+27821110005',
        state: draft('awaiting_price'),
        at: hoursAgo(9),
      },
      {
        phone: '+27821110006',
        state: draft('awaiting_bedrooms'),
        at: hoursAgo(9),
      },
    ]);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('gateway down'))
      .mockResolvedValueOnce(undefined);
    const d = deps(store, { send });

    const run = await nudgeStaleDrafts(d);

    expect(run.failed).toBe(1);
    expect(run.nudged).toBe(1);
  });

  it('names the step the seller stopped at', () => {
    expect(composeNudge(draft('awaiting_suburb_pick'))).toMatch(
      /which suburb/i,
    );
    expect(composeNudge(draft('awaiting_confirm'))).toMatch(/confirming/i);
    // And always offers a way out, so a nudge is never a trap.
    expect(composeNudge(draft('awaiting_price'))).toMatch(/CANCEL/);
  });
});
