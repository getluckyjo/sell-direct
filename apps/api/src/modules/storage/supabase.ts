import type { StorageProvider } from './index';

/**
 * Supabase Storage over plain fetch (no SDK dependency).
 *
 * The listing-photos bucket must be created as a PUBLIC bucket in the
 * Supabase dashboard (see docs/SUPABASE.md) — photos are public marketing
 * content and portal feeds need stable, non-expiring URLs. Signed variants
 * remain available for future private buckets (FICA documents).
 */
export interface SupabaseStorageConfig {
  url: string;
  serviceRoleKey: string;
}

export function loadSupabaseStorageConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseStorageConfig {
  return {
    url: (env.SUPABASE_URL ?? '').replace(/\/$/, ''),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };
}

interface SignResponse {
  signedURL?: string;
  url?: string;
}

export function createSupabaseStorageProvider(
  config: SupabaseStorageConfig,
): StorageProvider {
  const auth = { Authorization: `Bearer ${config.serviceRoleKey}` };

  return {
    async putObject({ bucket, path, contentType, body }) {
      const res = await fetch(
        `${config.url}/storage/v1/object/${bucket}/${path}`,
        {
          method: 'POST',
          headers: {
            ...auth,
            'Content-Type': contentType,
            'x-upsert': 'true',
          },
          body: new Uint8Array(body),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(
          `Supabase storage upload failed: ${res.status} ${detail.slice(0, 200)}`,
        );
      }
      return { path };
    },

    async getObjectUrl({ bucket, path, expiresInSeconds }) {
      if (!expiresInSeconds) {
        // Public bucket: the URL is deterministic — no network call.
        return `${config.url}/storage/v1/object/public/${bucket}/${path}`;
      }
      const res = await fetch(
        `${config.url}/storage/v1/object/sign/${bucket}/${path}`,
        {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: expiresInSeconds }),
        },
      );
      if (!res.ok) {
        throw new Error(`Supabase storage sign failed: ${res.status}`);
      }
      const data = (await res.json().catch(() => ({}))) as SignResponse;
      const signed = data.signedURL ?? data.url;
      if (!signed) throw new Error('Supabase storage sign failed: no url');
      return signed.startsWith('http')
        ? signed
        : `${config.url}/storage/v1${signed}`;
    },

    async getUploadUrl({ bucket, path }) {
      const res = await fetch(
        `${config.url}/storage/v1/object/upload/sign/${bucket}/${path}`,
        {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        throw new Error(`Supabase storage upload-sign failed: ${res.status}`);
      }
      const data = (await res.json().catch(() => ({}))) as SignResponse;
      const signed = data.signedURL ?? data.url;
      if (!signed) {
        throw new Error('Supabase storage upload-sign failed: no url');
      }
      return {
        url: signed.startsWith('http')
          ? signed
          : `${config.url}/storage/v1${signed}`,
        path,
      };
    },
  };
}
