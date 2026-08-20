import { describe, expect, it, vi } from 'vitest';
import { STOP_RE, createInMemoryOptOutStore, withOptOutGuard } from './opt-out';
import type { Notifier } from './index';

function fakeNotifier(): Notifier & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn(async () => {}) };
}

describe('opt-out guard', () => {
  it('suppresses every send to a number that opted out', async () => {
    const inner = fakeNotifier();
    const store = createInMemoryOptOutStore();
    const guarded = withOptOutGuard(inner, store);

    await store.optOut('+27820001111');
    await guarded.send('+27820001111', 'Your bond was approved 🎉');

    expect(inner.send).not.toHaveBeenCalled();
  });

  it('still sends to everyone else', async () => {
    const inner = fakeNotifier();
    const guarded = withOptOutGuard(inner, createInMemoryOptOutStore());

    await guarded.send('+27820002222', 'Your bond was approved 🎉');

    expect(inner.send).toHaveBeenCalledOnce();
  });

  it('resumes sending once the opt-out is cleared', async () => {
    const inner = fakeNotifier();
    const store = createInMemoryOptOutStore();
    const guarded = withOptOutGuard(inner, store);

    await store.optOut('+27820001111');
    await store.optIn('+27820001111');
    await guarded.send('+27820001111', 'Welcome back');

    expect(inner.send).toHaveBeenCalledOnce();
  });
});

describe('STOP matching', () => {
  it.each([
    'STOP',
    'stop',
    ' Stop please',
    'unsubscribe',
    'opt out',
    'OPT-OUT',
  ])('treats %j as an opt-out', (text) => {
    expect(STOP_RE.test(text)).toBe(true);
  });

  it.each([
    'cancel', // intake uses this to drop a draft
    'stopped by the agent today',
    'list',
    'valuation',
  ])('does not treat %j as an opt-out', (text) => {
    expect(STOP_RE.test(text)).toBe(false);
  });
});
