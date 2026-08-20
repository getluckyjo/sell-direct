-- CreateTable
-- A row is an opt-out: the number replied STOP and every outbound send to it
-- is refused until they message us again.
CREATE TABLE "whatsapp_opt_outs" (
    "phone" TEXT NOT NULL,
    "optedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waMessageId" TEXT,

    CONSTRAINT "whatsapp_opt_outs_pkey" PRIMARY KEY ("phone")
);
