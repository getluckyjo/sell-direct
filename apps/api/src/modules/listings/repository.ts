import type { PrismaClient } from '@prisma/client';
import type { ListingDraft } from './intake';

/** The listing an inbound seller photo should attach to. */
export interface PhotoTarget {
  id: string;
  title: string;
  status: 'awaiting_photos' | 'active';
  photoCount: number;
}

/** Everything a portal feed needs — assembled when a listing flips active. */
export interface SyndicationListing {
  id: string;
  title: string;
  description: string | null;
  suburb: string | null;
  city: string;
  priceZar: number;
  bedrooms: number | null;
  bathrooms: number | null;
  photoUrls: string[];
}

export interface ListingRepository {
  /** Upsert the seller (by phone) and create a listing from a draft. */
  createFromDraft(phone: string, draft: ListingDraft): Promise<{ id: string }>;
  /** Recent listings for the internal dashboard. */
  list(): Promise<unknown[]>;
  /**
   * The listing an inbound photo from this seller attaches to — newest
   * awaiting_photos first, else newest active owned by the phone.
   */
  findPhotoTarget(phone: string): Promise<PhotoTarget | null>;
  addPhoto(input: {
    listingId: string;
    storagePath: string;
    url: string | null;
    mimeType: string;
    sortOrder: number;
  }): Promise<{ id: string }>;
  /**
   * awaiting_photos → active. Returns false when it was already active —
   * race-safe when a photo burst lands concurrently (one activation winner).
   */
  activate(listingId: string): Promise<boolean>;
  setDescription(listingId: string, description: string): Promise<void>;
  getForSyndication(listingId: string): Promise<SyndicationListing | null>;
}

export function createPrismaListingRepository(
  prisma: PrismaClient,
): ListingRepository {
  async function findByStatus(
    phone: string,
    status: 'awaiting_photos' | 'active',
  ): Promise<PhotoTarget | null> {
    const listing = await prisma.listing.findFirst({
      where: { status, seller: { phone } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        _count: { select: { photos: true } },
      },
    });
    if (!listing) return null;
    return {
      id: listing.id,
      title: listing.title,
      status,
      photoCount: listing._count.photos,
    };
  }

  return {
    async createFromDraft(phone, draft) {
      const seller = await prisma.seller.upsert({
        where: { phone },
        update: {},
        create: { phone },
        select: { id: true },
      });
      return prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: draft.title,
          suburb: draft.suburb,
          city: 'Cape Town',
          // Private (POPIA): never exposed on buyer-facing surfaces.
          address: draft.address ?? null,
          priceZar: draft.priceZar,
          bedrooms: draft.bedrooms,
          bathrooms: draft.bathrooms,
          exclusivityTermDays: draft.exclusivityTermDays,
          tier: draft.tier,
          // Hidden from buyers until the first photo arrives (portals
          // effectively require photos) — photos.ts flips it to active.
          status: 'awaiting_photos',
        },
        select: { id: true },
      });
    },

    async list() {
      return prisma.listing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          suburb: true,
          city: true,
          // Internal dashboard only — never a buyer-facing endpoint.
          address: true,
          priceZar: true,
          bedrooms: true,
          bathrooms: true,
          status: true,
          tier: true,
          description: true,
          createdAt: true,
          seller: { select: { phone: true, name: true } },
          photos: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          _count: { select: { deals: true, photos: true } },
        },
      });
    },

    async findPhotoTarget(phone) {
      return (
        (await findByStatus(phone, 'awaiting_photos')) ??
        (await findByStatus(phone, 'active'))
      );
    },

    async addPhoto(input) {
      return prisma.listingPhoto.create({
        data: input,
        select: { id: true },
      });
    },

    async activate(listingId) {
      const result = await prisma.listing.updateMany({
        where: { id: listingId, status: 'awaiting_photos' },
        data: { status: 'active' },
      });
      return result.count > 0;
    },

    async setDescription(listingId, description) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { description },
      });
    },

    async getForSyndication(listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          description: true,
          suburb: true,
          city: true,
          priceZar: true,
          bedrooms: true,
          bathrooms: true,
          photos: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      if (!listing) return null;
      return {
        ...listing,
        priceZar: Number(listing.priceZar),
        photoUrls: listing.photos
          .map((p) => p.url)
          .filter((u): u is string => u !== null),
      };
    },
  };
}
