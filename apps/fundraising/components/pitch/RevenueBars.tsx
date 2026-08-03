import { REVENUE_RAMP } from '@/content/pitch';

const MAX = Math.max(...REVENUE_RAMP.map((d) => d.revenue));

/**
 * Base-case total revenue by year (R'm), from the data-room model.
 * Pure CSS bars — no chart library. Single series, so identity comes
 * from the title; each bar carries a direct value label (the Y1 bar is
 * visually tiny on a linear scale, so labels are load-bearing).
 */
export function RevenueBars() {
  return (
    <figure className="mt-10">
      <div
        role="img"
        aria-label={`Base-case total revenue by year, in millions of rand: ${REVENUE_RAMP.map(
          (d) => `${d.year} R${d.revenue} million`,
        ).join(', ')}. EBITDA-positive from Year 3.`}
        className="flex h-64 items-end gap-2 sm:gap-4"
      >
        {REVENUE_RAMP.map((d) => {
          const ebitdaPositive = 'ebitdaPositive' in d && d.ebitdaPositive;
          return (
            <div
              key={d.year}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end text-center"
            >
              <p className="mb-1 text-sm font-semibold text-slate-200">
                R{d.revenue.toFixed(1)}m
              </p>
              {ebitdaPositive ? (
                <p className="mb-1 hidden text-[11px] font-medium text-emerald-300 sm:block">
                  EBITDA-positive
                </p>
              ) : null}
              <div
                className="w-full rounded-t bg-emerald-500 transition-colors group-hover:bg-emerald-400"
                style={{
                  height: `${Math.max((d.revenue / MAX) * 100, 2)}%`,
                }}
                title={`${d.year}: R${d.revenue}m revenue, ${d.deals.toLocaleString('en-ZA')} registered deals`}
              />
              <p className="mt-2 border-t border-slate-800 pt-2 text-sm text-slate-400">
                {d.year}
                <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                  {d.deals.toLocaleString('en-ZA')} deals
                </span>
              </p>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-sm text-slate-400">
        Base-case total revenue, R&apos;m (registered deals below each year).
        EBITDA-positive from Year 3.
      </figcaption>
    </figure>
  );
}
