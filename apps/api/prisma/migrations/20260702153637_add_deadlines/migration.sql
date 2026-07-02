-- CreateTable
CREATE TABLE "deadlines" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "remindedAt" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deadlines_dueAt_idx" ON "deadlines"("dueAt");

-- CreateIndex
CREATE INDEX "deadlines_dealId_kind_idx" ON "deadlines"("dealId", "kind");

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
