/**
 * Cape Town suburbs, grouped into regions for the two-tap suburb picker.
 *
 * WhatsApp list menus cap at 10 rows, and Cape Town has far more suburbs than
 * that — so the seller taps a region, then a suburb. Eight suburbs per region
 * leaves exactly two rows for "Other" and "back", which is why the cap is 8
 * and not 9 (`normaliseOptions` truncates silently, so the arithmetic has to
 * be right here).
 *
 * Intake-flow data, not a cross-app contract: `apps/web` only ever displays
 * `listing.suburb`. Promote this to `packages/shared` the day the web app
 * grows a suburb filter.
 *
 * Not exhaustive by design — the picker always offers "Other — type it", and
 * a typed suburb has always been, and remains, valid.
 */

export interface SuburbRegion {
  /** Row-id fragment: lowercase ASCII, no spaces (it travels in `REGION:<id>`). */
  id: string;
  /** Row title — must fit WhatsApp's 24-char list-row limit. */
  title: string;
  /** Row description — must fit 72 chars. */
  hint: string;
  /** At most 8; the row id is the suburb name itself. */
  suburbs: string[];
}

/** The maximum suburbs per region — see the row-budget note above. */
export const MAX_SUBURBS_PER_REGION = 8;

export const CAPE_TOWN_REGIONS: readonly SuburbRegion[] = [
  {
    id: 'atlantic',
    title: 'Atlantic Seaboard',
    hint: 'Sea Point, Camps Bay, Hout Bay',
    suburbs: [
      'Sea Point',
      'Green Point',
      'Bantry Bay',
      'Clifton',
      'Camps Bay',
      'Fresnaye',
      'Llandudno',
      'Hout Bay',
    ],
  },
  {
    id: 'citybowl',
    title: 'City Bowl',
    hint: 'CBD, Gardens, Woodstock',
    suburbs: [
      'Cape Town CBD',
      'Gardens',
      'Oranjezicht',
      'Tamboerskloof',
      'Vredehoek',
      'Bo-Kaap',
      'De Waterkant',
      'Woodstock',
    ],
  },
  {
    id: 'southern',
    title: 'Southern Suburbs',
    hint: 'Observatory through to Tokai',
    suburbs: [
      'Observatory',
      'Mowbray',
      'Rondebosch',
      'Newlands',
      'Claremont',
      'Kenilworth',
      'Wynberg',
      'Constantia',
    ],
  },
  {
    id: 'northern',
    title: 'Northern Suburbs',
    hint: 'Durbanville, Bellville, Tygervalley',
    suburbs: [
      'Durbanville',
      'Bellville',
      'Brackenfell',
      'Kraaifontein',
      'Kuils River',
      'Parow',
      'Goodwood',
      'Plattekloof',
    ],
  },
  {
    id: 'falsebay',
    title: 'False Bay & South',
    hint: 'Muizenberg down to Simon’s Town',
    suburbs: [
      'Muizenberg',
      'Kalk Bay',
      'Fish Hoek',
      'Noordhoek',
      'Kommetjie',
      'Simon’s Town',
      'Lakeside',
      'Sun Valley',
    ],
  },
  {
    id: 'westcoast',
    title: 'West Coast',
    hint: 'Blouberg, Table View, Milnerton',
    suburbs: [
      'Table View',
      'Bloubergstrand',
      'Milnerton',
      'Century City',
      'Parklands',
      'Sunningdale',
      'Big Bay',
      'Melkbosstrand',
    ],
  },
] as const;

export function findRegion(id: string): SuburbRegion | undefined {
  const key = id.trim().toLowerCase();
  return CAPE_TOWN_REGIONS.find((r) => r.id === key);
}
