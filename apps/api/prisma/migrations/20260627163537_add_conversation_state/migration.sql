-- CreateTable
CREATE TABLE "conversation_states" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "flow" TEXT NOT NULL DEFAULT 'listing_intake',
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_states_phone_key" ON "conversation_states"("phone");
