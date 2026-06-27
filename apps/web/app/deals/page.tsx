import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { dmy, zar } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import type { DealRow } from '@/lib/types';

export default async function DealsPage() {
  let deals: DealRow[] = [];
  let error = false;
  try {
    deals = (await apiGet<{ deals: DealRow[] }>('/api/deals')).deals;
  } catch {
    error = true;
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Deals</h1>
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not reach the API.
        </p>
      ) : deals.length === 0 ? (
        <p className="text-slate-600">No deals yet.</p>
      ) : (
        <ul className="grid gap-3">
          {deals.map((d) => (
            <li key={d.id}>
              <Link
                href={`/deals/${d.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-300"
              >
                <div>
                  <div className="font-medium">{d.listing.title}</div>
                  <div className="text-sm text-slate-500">
                    {zar(d.listing.priceZar)} · {d.buyer.name ?? d.buyer.phone}
                    {d.buyer.bondPrequalified ? ' · pre-qualified' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-slate-400">
                    {dmy(d.updatedAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
