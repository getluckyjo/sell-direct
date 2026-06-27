/**
 * Storage provider seam.
 *
 * Managed storage is **Supabase Storage**, kept behind this interface. The
 * concrete adapter lands when uploads are introduced (listing photos, then
 * FICA documents). POPIA: hand out short-lived signed URLs; never expose the
 * service-role key to clients, and never store sensitive documents unencrypted.
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
}
