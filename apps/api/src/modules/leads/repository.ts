import type { PrismaClient } from '@prisma/client';
import { consentWording } from '@sell-direct/shared';
import type { LeadInput } from './types';

export interface LeadRepository {
  create(input: LeadInput): Promise<{ id: string }>;
}

export function createPrismaLeadRepository(
  prisma: PrismaClient,
): LeadRepository {
  return {
    async create(input) {
      return prisma.lead.create({
        data: {
          kind: input.kind,
          email: input.email,
          name: input.name ?? null,
          phone: input.phone ?? null,
          role: input.role ?? null,
          message: input.message ?? null,
          source: input.source ?? null,
          // Consent is validated true at the route; stamp when we store.
          consentAt: new Date(),
          // WhatsApp is a separate opt-in — stamped only when actually given,
          // so null here always means "never business-initiate on WhatsApp".
          whatsappConsentAt: input.whatsappConsent ? new Date() : null,
          consentFormVersion: input.consentFormVersion ?? null,
          // Proof, not assertion: the exact wording shown for the consents
          // this person actually gave, resolved from the version server-side.
          consentWording: renderProof(input),
        },
        select: { id: true },
      });
    },
  };
}

/**
 * The exact consent copy this lead agreed to, resolved from the form version.
 * Null when the version is unknown or absent (pre-versioning records) — the
 * route rejects unknown versions, so in practice that is only legacy callers.
 */
function renderProof(input: LeadInput): string | null {
  const wording = input.consentFormVersion
    ? consentWording(input.consentFormVersion)
    : null;
  if (!wording) return null;
  return [wording.processing, input.whatsappConsent ? wording.whatsapp : null]
    .filter(Boolean)
    .join('\n\n');
}
