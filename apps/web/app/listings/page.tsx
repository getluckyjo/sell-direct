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
                    <div className="flex items-center gap-3">
                      {l.photos?.[0]?.url ? (
                        <img
                          src={l.photos[0].url}
                          alt=""
                          className="h-12 w-12 flex-none rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          🏠
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-slate-500">
                          {[l.propertyType, l.address, l.suburb, l.city]
                            .filter(Boolean)
                            .join(', ')}
                          {l.bedrooms != null ? ` · ${l.bedrooms} bed` : ''}
                          {` · ${l._count?.photos ?? 0} photo${(l._count?.photos ?? 0) === 1 ? '' : 's'}`}
                          {` · description ${l.description ? '✓' : '–'}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{zar(l.priceZar)}</td>
                  <td className="px-4 py-3">
                    {l.status === 'awaiting_photos' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        awaiting photos
                      </span>
                    ) : (
                      l.status
                    )}{' '}
                    · {l.tier}
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
