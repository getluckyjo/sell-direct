import type { FastifyInstance } from 'fastify';
import { readLocalObject } from './local';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Serves local-storage objects (dev/demo only — registered only when the
 * local provider is active). Unauthenticated by design: this holds public
 * marketing photos, the same trust level as the public Supabase bucket.
 */
export function registerStorageRoutes(
  app: FastifyInstance,
  deps: { baseDir: string },
): void {
  app.get('/api/storage/:bucket/*', async (request, reply) => {
    const { bucket } = request.params as { bucket: string };
    const rest = (request.params as Record<string, string>)['*'] ?? '';
    const bytes = await readLocalObject(deps.baseDir, bucket, rest);
    if (!bytes) return reply.code(404).send({ error: 'not_found' });
    const ext = rest.split('.').pop()?.toLowerCase() ?? '';
    return reply
      .type(MIME_BY_EXT[ext] ?? 'application/octet-stream')
      .send(bytes);
  });
}
