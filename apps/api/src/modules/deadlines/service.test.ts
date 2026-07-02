import { describe, expect, it, vi } from 'vitest';
import {
  applyStageDeadlines,
  dueTier,
  processDueReminders,
  REMINDER_TIERS,
} from './service';
import type { DeadlineRecord, DeadlineRepository } from './repository';

const NOW = new Date('2026-07-06T09:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

function fakeRepo(due: DeadlineRecord[] = []): DeadlineRepository & {
  createIfAbsent: ReturnType<typeof vi.fn>;
  markReminded: ReturnType<typeof vi.fn>;
  resolve: ReturnType<typeof vi.fn>;
} {
  return {
    createIfAbsent: vi.fn(async () => {}),
    listUnresolvedDueBefore: vi.fn(async () => due),
    markReminded: vi.fn(async () => {}),
    resolve: vi.fn(async () => {}),
  };
}

const deadline = (over: Partial<DeadlineRecord> = {}): DeadlineRecord => ({
  id: 'dl1',
  dealId: 'd1',
  kind: 'bond_condition',
  label: 'bond approval condition',
  dueAt: days(3),
  remindedAt: [],
  ...over,
});

describe('applyStageDeadlines', () => {
  it('creates the bond-condition deadline (21 days) on offer_otp', async () => {
    const repo = fakeRepo();
    await applyStageDeadlines(repo, 'd1', 'offer_otp', NOW);
    expect(repo.createIfAbsent).toHaveBeenCalledWith({
      dealId: 'd1',
      kind: 'bond_condition',
      label: 'bond approval condition',
      dueAt: days(21),
    });
  });

  it('resolves the bond condition when the bond is granted', async () => {
    const repo = fakeRepo();
    await applyStageDeadlines(repo, 'd1', 'bond_granted', NOW);
    expect(repo.resolve).toHaveBeenCalledWith('d1', ['bond_condition']);
    expect(repo.createIfAbsent).not.toHaveBeenCalled();
  });

  it('resolves everything outstanding on cancellation', async () => {
    const repo = fakeRepo();
    await applyStageDeadlines(repo, 'd1', 'cancelled', NOW);
    expect(repo.resolve).toHaveBeenCalledWith('d1', [
      'bond_condition',
      'fica_documents',
      'certificate_booking',
    ]);
  });
});

describe('dueTier', () => {
  it('fires the 7-day tier inside the window, once', () => {
    expect(dueTier(deadline({ dueAt: days(6) }), NOW)).toBe(7);
    // 6 days out with tier 7 already sent → next tier (3) not yet due.
    expect(
      dueTier(deadline({ dueAt: days(6), remindedAt: [7] }), NOW),
    ).toBeNull();
  });

  it('does not fire outside the largest window', () => {
    expect(dueTier(deadline({ dueAt: days(10) }), NOW)).toBeNull();
  });

  it('escalates through tiers as due approaches', () => {
    expect(dueTier(deadline({ dueAt: days(2), remindedAt: [7] }), NOW)).toBe(3);
    expect(dueTier(deadline({ dueAt: days(1), remindedAt: [7, 3] }), NOW)).toBe(
      1,
    );
    expect(
      dueTier(deadline({ dueAt: days(1), remindedAt: [7, 3, 1] }), NOW),
    ).toBeNull();
  });

  it('overdue with all tiers sent stays silent', () => {
    expect(
      dueTier(
        deadline({ dueAt: days(-1), remindedAt: [...REMINDER_TIERS] }),
        NOW,
      ),
    ).toBeNull();
  });
});

describe('processDueReminders', () => {
  const parties = {
    property: '23 Vredehoek Ave',
    buyerPhone: '+27820001111',
    sellerPhone: '+27830002222',
  };

  it('sends a countdown to both parties and marks the tier', async () => {
    const repo = fakeRepo([deadline({ dueAt: days(2) })]);
    const send = vi.fn(async () => {});
    const sent = await processDueReminders(
      {
        repository: repo,
        notifier: { send },
        lookup: async () => parties,
        transferTemplateId: 'HXtransfer',
      },
      NOW,
    );

    expect(sent).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    const [to, text, opts] = send.mock.calls[0] as unknown as [
      string,
      string,
      { templateId?: string; variables?: Record<string, string> },
    ];
    expect(to).toBe(parties.buyerPhone);
    expect(text).toContain('2 days left');
    expect(opts.templateId).toBe('HXtransfer');
    expect(opts.variables?.['2']).toContain('bond approval condition');
    expect(repo.markReminded).toHaveBeenCalledWith('dl1', 3);
  });

  it('is idempotent: an already-reminded tier sends nothing', async () => {
    const repo = fakeRepo([deadline({ dueAt: days(2), remindedAt: [7, 3] })]);
    const send = vi.fn(async () => {});
    const sent = await processDueReminders(
      { repository: repo, notifier: { send }, lookup: async () => parties },
      NOW,
    );
    expect(sent).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('a send failure never breaks the tick (logged, tier not marked)', async () => {
    const repo = fakeRepo([deadline({ dueAt: days(1), remindedAt: [7, 3] })]);
    const log = vi.fn();
    const sent = await processDueReminders(
      {
        repository: repo,
        notifier: {
          send: vi.fn(async () => {
            throw new Error('down');
          }),
        },
        lookup: async () => parties,
        log,
      },
      NOW,
    );
    expect(sent).toBe(0);
    expect(log).toHaveBeenCalled();
    expect(repo.markReminded).not.toHaveBeenCalled();
  });
});
