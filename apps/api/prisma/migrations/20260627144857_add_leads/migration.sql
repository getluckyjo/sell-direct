-- CreateEnum
CREATE TYPE "LeadKind" AS ENUM ('waitlist', 'investor');

-- CreateEnum
CREATE TYPE "LeadRole" AS ENUM ('seller', 'buyer', 'investor', 'other');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "kind" "LeadKind" NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "LeadRole",
    "message" TEXT,
    "source" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_kind_createdAt_idx" ON "leads"("kind", "createdAt");
