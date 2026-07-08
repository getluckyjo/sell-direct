-- AlterEnum (PG12+: safe in a transaction as long as the new value is not
-- used within this same migration — it isn't).
ALTER TYPE "ListingStatus" ADD VALUE 'awaiting_photos' AFTER 'draft';

-- CreateTable
CREATE TABLE "listing_photos" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "mimeType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_photos_listingId_sortOrder_idx" ON "listing_photos"("listingId", "sortOrder");

-- AddForeignKey
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "listings"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
