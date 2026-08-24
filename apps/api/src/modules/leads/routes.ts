import type { FastifyInstance } from 'fastify';
import { consentWording } from '@sell-direct/shared';
import type { LeadInput } from './types';
import type { LeadRepository } from './repository';

export interface LeadRouteDeps {
  repository: LeadRepository;
}

// JSON Schema validated by Fastify (Ajv) before the handler runs.
const leadBodySchema = {
  type: 'object',
  required: ['kind', 'email', 'consent'],
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['waitlist', 'investor'] },
    // Basic server-side email shape; the form does friendlier validation.
    email: {
      type: 'string',
      pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
      maxLength: 320,
    },
    name: { type: 'string', maxLength: 200 },
    phone: { type: 'string', maxLength: 32 },
    role: { type: 'string', enum: ['seller', 'buyer', 'investor', 'other'] },
    message: { type: 'string', maxLength: 2000 },
    source: { type: 'string', maxLength: 120 },
    // Consent must be explicitly true (POPIA).
    consent: { type: 'boolean', const: true },
    // Separate WhatsApp channel opt-in — optional, and explicitly NOT
    // required: Meta needs the channel named on its own, and a consent that
    // is a condition of the primary action is not freely given.
    whatsappConsent: { type: 'boolean' },
    // The version of the consent copy the form displayed. The wording is
    // resolved from it server-side — never sent by the client.
    consentFormVersion: { type: 'string', maxLength: 40 },
  },
} as const;

/**
 * Public lead capture for the marketing waitlist and investor interest.
 * POPIA: email/phone are only stored alongside explicit consent (enforced by
 * the schema); bodies are never logged.
 */
export function registerLeadRoutes(
  app: FastifyInstance,
  deps: LeadRouteDeps,
): void {
  app.post(
    '/api/leads',
    { schema: { body: leadBodySchema } },
    async (request, reply) => {
      const input = request.body as LeadInput;
      // A version we can't resolve would store consent proof we cannot show,
      // so fail loudly rather than silently recording an empty record. This
      // fires when a form deploy drifts ahead of the API's shared copy.
      if (input.consentFormVersion && !consentWording(input.consentFormVersion))
        return reply.code(400).send({ error: 'unknown_consent_version' });
      const lead = await deps.repository.create(input);
      return reply.code(201).send({ id: lead.id });
    },
  );
}
