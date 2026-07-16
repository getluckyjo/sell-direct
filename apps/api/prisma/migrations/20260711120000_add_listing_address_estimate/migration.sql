-- Street address (private seller PII — never shown to buyers) and the cached
-- market-price estimate from the ValuationAdapter (e.g. LOOM).
ALTER TABLE "listings" ADD COLUMN "address" TEXT;
ALTER TABLE "listings" ADD COLUMN "estimateLowZar" INTEGER;
ALTER TABLE "listings" ADD COLUMN "estimateHighZar" INTEGER;
ALTER TABLE "listings" ADD COLUMN "estimatedAt" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "estimateSource" TEXT;
