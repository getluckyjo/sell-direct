export interface ListingRow {
  id: string;
  title: string;
  suburb: string | null;
  city: string;
  priceZar: string;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  tier: string;
  createdAt: string;
  seller: { phone: string; name: string | null };
  _count: { deals: number };
}

export interface DealRow {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listing: { title: string; suburb: string | null; priceZar: string };
  buyer: { phone: string; name: string | null; bondPrequalified: boolean };
}

export interface DealEventRow {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  note: string | null;
  createdAt: string;
}

export interface DealDetail {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listing: {
    title: string;
    suburb: string | null;
    priceZar: string;
    status: string;
  };
  buyer: { phone: string; name: string | null; bondPrequalified: boolean };
  events: DealEventRow[];
}
