/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the workspace package so the app can import shared TS source.
  transpilePackages: ['@sell-direct/shared'],
};

export default nextConfig;
