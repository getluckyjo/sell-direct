import type { FastifyInstance } from 'fastify';
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
      const lead = await deps.repository.create(request.body as LeadInput);
      return reply.code(201).send({ id: lead.id });
    },
  );
}
