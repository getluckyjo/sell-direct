import { apiGet } from '@/lib/api';
import { dmy, zar } from '@/lib/format';
import type { ListingRow } from '@/lib/types';

export default async function ListingsPage() {
  let listings: ListingRow[] = [];
  let error = false;
  try {
    listings = (await apiGet<{ listings: ListingRow[] }>('/api/listings'))
      .listings;
  } catch {
    error = true;
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Listings</h1>
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not reach the API.
        </p>
      ) : listings.length === 0 ? (
        <p className="text-slate-600">No listings yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Listed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.title}</div>
                    <div className="text-slate-500">
                      {[l.suburb, l.city].filter(Boolean).join(', ')}
                      {l.bedrooms != null ? ` · ${l.bedrooms} bed` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">{zar(l.priceZar)}</td>
                  <td className="px-4 py-3">
                    {l.status} · {l.tier}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {l.seller.name ?? l.seller.phone}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {dmy(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
