/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Lint is run as a separate CI gate; do not fail the production build on it.
    ignoreDuringBuilds: true,
  },
  env: {
    APP_VERSION: process.env.npm_package_version ?? '1.0.0',
  },
};

export default nextConfig;
