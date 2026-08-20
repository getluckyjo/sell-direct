-- AlterTable
-- WhatsApp opt-in is a separate consent from the POPIA processing consent
-- (Meta requires the channel to be named explicitly), and the exact wording
-- shown is stored as proof alongside its form version.
ALTER TABLE "leads" ADD COLUMN     "whatsappConsentAt" TIMESTAMP(3),
ADD COLUMN     "consentWording" TEXT,
ADD COLUMN     "consentFormVersion" TEXT;
