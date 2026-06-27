import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { DealRow, ListingRow } from '@/lib/types';

export default async function Home() {
  let listings = 0;
  let deals = 0;
  let error = false;
  try {
    const [l, d] = await Promise.all([
      apiGet<{ listings: ListingRow[] }>('/api/listings'),
      apiGet<{ deals: DealRow[] }>('/api/deals'),
    ]);
    listings = l.listings.length;
    deals = d.deals.length;
  } catch {
    error = true;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-slate-600">Listings and deals across Sell Direct.</p>
      </div>
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not reach the API. Check the API is running and API_INTERNAL_URL
          / INTERNAL_API_TOKEN are set.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/listings"
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <p className="text-sm text-slate-500">Listings</p>
            <p className="mt-1 text-4xl font-extrabold">{listings}</p>
          </Link>
          <Link
            href="/deals"
            className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <p className="text-sm text-slate-500">Deals</p>
            <p className="mt-1 text-4xl font-extrabold">{deals}</p>
          </Link>
        </div>
      )}
    </div>
  );
}
