-- CreateEnum
CREATE TYPE "AgentDraftStatus" AS ENUM ('pending', 'approved', 'dismissed', 'sent');

-- CreateTable
CREATE TABLE "agent_drafts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "inbound" TEXT NOT NULL,
    "draft" TEXT NOT NULL,
    "toolCalls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "status" "AgentDraftStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "agent_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_drafts_status_createdAt_idx" ON "agent_drafts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "agent_drafts_phone_createdAt_idx" ON "agent_drafts"("phone", "createdAt");
