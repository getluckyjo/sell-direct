import { SUMMARY_STRIP } from '@/content/pitch';

/**
 * The deal at a glance — the most important element on the page. An
 * investor who reads nothing else should still get the deal from it.
 */
export function SummaryStrip() {
  return (
    <div
      id="summary"
      className="mt-10 scroll-mt-24 rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 backdrop-blur sm:p-5"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {SUMMARY_STRIP.map((s) => (
          <div key={s.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {s.value}
            </p>
            {s.sub ? (
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
            ) : null}
          </div>
        ))}
      </div>
      <a
        href="#access"
        className="mt-5 inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Request the data room
      </a>
    </div>
  );
}
