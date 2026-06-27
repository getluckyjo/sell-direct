const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
const TOKEN = process.env.INTERNAL_API_TOKEN;

/** Server-side fetch of an internal API endpoint (never called from the browser). */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: TOKEN ? { 'x-internal-token': TOKEN } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}
