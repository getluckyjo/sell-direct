import type { Stat } from '@/content/pitch';

export function StatGrid({
  stats,
  columns = 3,
}: {
  stats: readonly Stat[];
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`mt-8 grid gap-4 sm:grid-cols-2 ${
        columns === 3 ? 'lg:grid-cols-3' : ''
      }`}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-800 bg-navy p-5"
        >
          <p className="text-sm font-medium text-slate-400">{s.label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">
            {s.value}
          </p>
          {s.sub ? (
            <p className="mt-1 text-sm text-slate-400">{s.sub}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
