/** @type {import('next').NextConfig} */

// The WhatsApp demo simulator lives on the API (Railway). Proxy it through
// the public site so it's playable at www.solddirect.co.za/demo — the page
// and its /api/demo/* calls pass straight through; auth stays the API's
// internal-token guard. Skipped when API_INTERNAL_URL isn't configured.
const apiBase = process.env.API_INTERNAL_URL;

const nextConfig = {
  async rewrites() {
    if (!apiBase) return [];
    return [
      { source: '/demo', destination: `${apiBase}/demo` },
      { source: '/api/demo/:path*', destination: `${apiBase}/api/demo/:path*` },
    ];
  },
};

export default nextConfig;
