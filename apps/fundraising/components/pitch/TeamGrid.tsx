import Image from 'next/image';
import { TEAM_SECTION } from '@/content/pitch';

/**
 * People cards for the team section: photo (or branded initials until a
 * headshot lands in public/team/), name, role, short bio. The ownership
 * numbers deliberately live in the data room, not here.
 */
export function TeamGrid() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2">
      {TEAM_SECTION.people.map((p) => (
        <div
          key={p.name}
          className="flex gap-5 rounded-2xl border border-slate-800 bg-navy p-6"
        >
          {'photo' in p && typeof p.photo === 'string' ? (
            <Image
              src={p.photo}
              alt={p.name}
              width={64}
              height={64}
              className="h-16 w-16 flex-none rounded-full border-2 border-brand-500 object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-16 w-16 flex-none items-center justify-center rounded-full border-2 border-brand-500 bg-navy-950 text-xl font-bold text-brand-300"
            >
              {p.initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-white">{p.name}</h3>
            <p className="text-sm font-medium text-brand-300">{p.role}</p>
            <p className="mt-2 text-sm text-slate-300">{p.bio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
