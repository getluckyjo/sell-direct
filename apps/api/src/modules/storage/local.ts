import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import type { StorageProvider } from './index';

/**
 * Filesystem storage for local dev and the demo — everything works without a
 * Supabase project. Objects are written under `baseDir` and served by the
 * GET /api/storage route (routes.ts), so the dashboard and demo (different
 * origins) can load photo URLs.
 */
export interface LocalStorageConfig {
  /** Directory objects are written to (created on demand). */
  baseDir: string;
  /** Absolute base URL of this API, used to build servable object URLs. */
  publicBase: string;
}

/** Reject anything that could escape the storage directory. */
export function safeStoragePath(bucket: string, path: string): string {
  const joined = normalize(join(bucket, path));
  if (joined.startsWith('..') || joined.includes('../')) {
    throw new Error(`unsafe storage path: ${bucket}/${path}`);
  }
  return joined;
}

export function createLocalStorageProvider(
  config: LocalStorageConfig,
): StorageProvider {
  return {
    async putObject({ bucket, path, body }) {
      const rel = safeStoragePath(bucket, path);
      const file = join(config.baseDir, rel);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, body);
      return { path };
    },

    async getObjectUrl({ bucket, path }) {
      safeStoragePath(bucket, path);
      return `${config.publicBase.replace(/\/$/, '')}/api/storage/${bucket}/${path}`;
    },

    async getUploadUrl() {
      throw new Error('signed uploads are not supported by local storage');
    },
  };
}

/** Read an object back for serving; returns null when missing/unsafe. */
export async function readLocalObject(
  baseDir: string,
  bucket: string,
  path: string,
): Promise<Buffer | null> {
  try {
    const rel = safeStoragePath(bucket, path);
    return await readFile(join(baseDir, rel));
  } catch {
    return null;
  }
}
