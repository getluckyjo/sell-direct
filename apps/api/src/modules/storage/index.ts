/**
 * Storage provider seam.
 *
 * Managed storage is **Supabase Storage**, kept behind this interface
 * (supabase.ts), with a filesystem fallback for local dev and the demo
 * (local.ts) — pick via factory.ts. POPIA: hand out short-lived signed URLs
 * for anything sensitive (FICA documents later); the listing-photos bucket is
 * public marketing content by definition. Never expose the service-role key
 * to clients, and never store sensitive documents unencrypted.
 */
export interface SignedUploadTarget {
  /** URL the client uploads the file to. */
  url: string;
  /** Object path/key to reference after a successful upload. */
  path: string;
}

export interface StorageProvider {
  /** Create a signed URL the client can upload a single file to. */
  getUploadUrl(params: {
    bucket: string;
    path: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<SignedUploadTarget>;
  /** Get a (optionally signed, time-limited) URL to read an object. */
  getObjectUrl(params: {
    bucket: string;
    path: string;
    expiresInSeconds?: number;
  }): Promise<string>;
  /**
   * Server-side write. WhatsApp media arrives via webhook and is downloaded
   * from the BSP by the server, so the server holds the bytes — a signed
   * *upload* URL only fits browser clients. Both paths live on the interface:
   * putObject for webhook media, signed URLs for future client-side uploads.
   */
  putObject(params: {
    bucket: string;
    path: string;
    contentType: string;
    body: Buffer;
  }): Promise<{ path: string }>;
}

export * from './supabase';
export * from './local';
export * from './factory';
export * from './routes';
