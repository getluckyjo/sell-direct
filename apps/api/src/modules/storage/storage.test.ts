import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createLocalStorageProvider,
  readLocalObject,
  safeStoragePath,
} from './local';
import { createSupabaseStorageProvider } from './supabase';
import { registerStorageRoutes } from './routes';
import { selectedStorage, storageBucket } from './factory';

describe('local storage provider', () => {
  it('round-trips an object and builds a servable URL', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'sd-storage-'));
    const storage = createLocalStorageProvider({
      baseDir,
      publicBase: 'http://localhost:4000',
    });

    await storage.putObject({
      bucket: 'listing-photos',
      path: 'listings/l1/1.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('jpeg-bytes'),
    });

    const url = await storage.getObjectUrl({
      bucket: 'listing-photos',
      path: 'listings/l1/1.jpg',
    });
    expect(url).toBe(
      'http://localhost:4000/api/storage/listing-photos/listings/l1/1.jpg',
    );

    const read = await readLocalObject(baseDir, 'listing-photos', 'listings/l1/1.jpg');
    expect(read?.toString()).toBe('jpeg-bytes');
  });

  it('rejects path traversal', async () => {
    expect(() => safeStoragePath('bucket', '../../etc/passwd')).toThrow(/unsafe/);
    expect(await readLocalObject('/tmp', 'bucket', '../etc/passwd')).toBeNull();
  });

  it('serves objects via the GET route and 404s on misses', async () => {
    const baseDir = await mkdtemp(join(tmpdir(), 'sd-storage-'));
    const storage = createLocalStorageProvider({
      baseDir,
      publicBase: 'http://localhost:4000',
    });
    await storage.putObject({
      bucket: 'listing-photos',
      path: 'a/photo.png',
      contentType: 'image/png',
      body: Buffer.from('png-bytes'),
    });

    const app = Fastify();
    registerStorageRoutes(app, { baseDir });

    const hit = await app.inject({
      method: 'GET',
      url: '/api/storage/listing-photos/a/photo.png',
    });
    expect(hit.statusCode).toBe(200);
    expect(hit.headers['content-type']).toContain('image/png');
    expect(hit.body).toBe('png-bytes');

    const miss = await app.inject({
      method: 'GET',
      url: '/api/storage/listing-photos/nope.jpg',
    });
    expect(miss.statusCode).toBe(404);
  });
});

describe('supabase storage provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const storage = createSupabaseStorageProvider({
    url: 'https://proj.supabase.example',
    serviceRoleKey: 'service-role',
  });

  it('putObject uploads with the service-role bearer and upsert', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await storage.putObject({
      bucket: 'listing-photos',
      path: 'listings/l1/1.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('x'),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://proj.supabase.example/storage/v1/object/listing-photos/listings/l1/1.jpg',
    );
    expect(init.headers.Authorization).toBe('Bearer service-role');
    expect(init.headers['x-upsert']).toBe('true');
    expect(init.headers['Content-Type']).toBe('image/jpeg');
  });

  it('public object URLs are deterministic (no network call)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const url = await storage.getObjectUrl({
      bucket: 'listing-photos',
      path: 'listings/l1/1.jpg',
    });
    expect(url).toBe(
      'https://proj.supabase.example/storage/v1/object/public/listing-photos/listings/l1/1.jpg',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('putObject surfaces failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('denied', { status: 403 })),
    );
    await expect(
      storage.putObject({
        bucket: 'b',
        path: 'p',
        contentType: 'image/jpeg',
        body: Buffer.from('x'),
      }),
    ).rejects.toThrow(/403/);
  });
});

describe('storage factory', () => {
  it('selects supabase only when both env keys are set', () => {
    expect(selectedStorage({} as NodeJS.ProcessEnv)).toBe('local');
    expect(
      selectedStorage({ SUPABASE_URL: 'x' } as NodeJS.ProcessEnv),
    ).toBe('local');
    expect(
      selectedStorage({
        SUPABASE_URL: 'x',
        SUPABASE_SERVICE_ROLE_KEY: 'y',
      } as NodeJS.ProcessEnv),
    ).toBe('supabase');
    expect(storageBucket({} as NodeJS.ProcessEnv)).toBe('listing-photos');
  });
});
