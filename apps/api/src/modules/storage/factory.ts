import {
  createSupabaseStorageProvider,
  loadSupabaseStorageConfigFromEnv,
} from './supabase';
import { createLocalStorageProvider } from './local';
import type { StorageProvider } from './index';

export type StorageKind = 'supabase' | 'local';

export function selectedStorage(
  env: NodeJS.ProcessEnv = process.env,
): StorageKind {
  return env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? 'supabase'
    : 'local';
}

export function storageBucket(env: NodeJS.ProcessEnv = process.env): string {
  return env.SUPABASE_STORAGE_BUCKET || 'listing-photos';
}

export function storageLocalDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.STORAGE_LOCAL_DIR || '.data/storage';
}

export function createStorageProvider(
  env: NodeJS.ProcessEnv = process.env,
): StorageProvider {
  if (selectedStorage(env) === 'supabase') {
    return createSupabaseStorageProvider(loadSupabaseStorageConfigFromEnv(env));
  }
  const port = env.PORT ?? '4000';
  return createLocalStorageProvider({
    baseDir: storageLocalDir(env),
    publicBase: env.API_PUBLIC_URL || `http://localhost:${port}`,
  });
}
