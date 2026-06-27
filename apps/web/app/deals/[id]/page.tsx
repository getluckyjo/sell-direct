import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { dmy, zar } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import type { DealDetail } from '@/lib/types';

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let deal: DealDetail;
  try {
    deal = (await apiGet<{ deal: DealDetail }>(`/api/deals/${id}`)).deal;
  } catch {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/deals"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Deals
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{deal.listing.title}</h1>
          <StatusBadge status={deal.status} />
        </div>
        <p className="text-slate-600">
          {zar(deal.listing.priceZar)}
          {deal.listing.suburb ? ` · ${deal.listing.suburb}` : ''} · Buyer:{' '}
          {deal.buyer.name ?? deal.buyer.phone}
          {deal.buyer.bondPrequalified ? ' (pre-qualified)' : ''}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Status timeline</h2>
        {deal.events.length === 0 ? (
          <p className="text-sm text-slate-500">
            Created at <span className="font-medium">enquiry</span>. Status
            changes will appear here as the transfer progresses.
          </p>
        ) : (
          <ol className="relative ml-3 border-l border-slate-200">
            {deal.events.map((e) => (
              <li key={e.id} className="mb-5 ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-emerald-500" />
                <div className="text-sm font-medium">
                  {e.fromStatus ? `${e.fromStatus.replace(/_/g, ' ')} → ` : ''}
                  {e.toStatus.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-slate-500">
                  {e.actorType} · {dmy(e.createdAt)}
                  {e.note ? ` · ${e.note}` : ''}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
