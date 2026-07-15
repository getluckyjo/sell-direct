import { TEAM_SECTION } from '@/content/pitch';

/**
 * Ownership at inception as a labeled horizontal bar per holder.
 * Single-hue (magnitude of stake), so no legend needed — each row is
 * directly labeled.
 */
export function CapTable() {
  const max = Math.max(...TEAM_SECTION.capTable.map((r) => r.stake));
  return (
    <div className="mt-8 grid gap-3">
      {TEAM_SECTION.capTable.map((row) => (
        <div key={row.holder} className="grid items-center gap-2 sm:grid-cols-[minmax(0,22rem)_1fr]">
          <p className="text-sm text-slate-300">{row.holder}</p>
          <div className="flex items-center gap-3">
            <div className="h-4 flex-1 rounded bg-slate-900">
              <div
                className="h-4 rounded bg-emerald-500/80"
                style={{ width: `${(row.stake / max) * 100}%` }}
              />
            </div>
            <p className="w-12 text-right text-sm font-semibold text-slate-100">
              {row.stake}%
            </p>
          </div>
        </div>
      ))}
      <p className="mt-3 max-w-3xl text-sm text-slate-400">{TEAM_SECTION.note}</p>
    </div>
  );
}
