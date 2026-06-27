/**
 * Auth provider seam.
 *
 * Managed auth is **Supabase**, but it stays behind this interface so the
 * dashboard auth gate (PR 6) never calls a vendor SDK directly and the provider
 * can be swapped. The concrete `SupabaseAuthProvider` is implemented in PR 6.
 */
export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthProvider {
  /** Validate an access token and return the authenticated user. */
  verifyAccessToken(token: string): Promise<AuthUser>;
  /** Fetch a user by id, or null if not found. */
  getUser(userId: string): Promise<AuthUser | null>;
}
