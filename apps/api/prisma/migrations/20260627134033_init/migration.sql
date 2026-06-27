-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('enquiry', 'offer_otp', 'bond_application', 'bond_granted', 'documents_fica', 'clearance', 'lodgement', 'registered', 'cancelled');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'active', 'under_offer', 'sold', 'withdrawn');

-- CreateEnum
CREATE TYPE "DealTier" AS ENUM ('free', 'flex');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('seller', 'buyer', 'agent', 'system');

-- CreateTable
CREATE TABLE "sellers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "bondPrequalified" BOOLEAN NOT NULL DEFAULT false,
    "approvedAmountZar" DECIMAL(12,2),
    "financialConsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceZar" DECIMAL(12,2) NOT NULL,
    "suburb" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Cape Town',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "tier" "DealTier" NOT NULL DEFAULT 'free',
    "exclusivityTermDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'enquiry',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_events" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromStatus" "DealStatus",
    "toStatus" "DealStatus" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "waMessageId" TEXT,
    "fromPhone" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "dealId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sellers_phone_key" ON "sellers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_phone_key" ON "buyers"("phone");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "deals_status_idx" ON "deals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deals_listingId_buyerId_key" ON "deals"("listingId", "buyerId");

-- CreateIndex
CREATE INDEX "deal_events_dealId_createdAt_idx" ON "deal_events"("dealId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "messages_waMessageId_key" ON "messages"("waMessageId");

-- CreateIndex
CREATE INDEX "messages_fromPhone_createdAt_idx" ON "messages"("fromPhone", "createdAt");

-- CreateIndex
CREATE INDEX "messages_dealId_createdAt_idx" ON "messages"("dealId", "createdAt");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_events" ADD CONSTRAINT "deal_events_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
