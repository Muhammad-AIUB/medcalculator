const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',        // Static HTML export for Capacitor offline APK
  trailingSlash: true,     // Required for static export routing
  reactStrictMode: true,
  images: {
    unoptimized: true,     // Required for static export (no Next.js image server)
  },
  // Strip console.* (keep errors) from the production bundle shipped in the APK.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  experimental: { optimizePackageImports: ['lucide-react'] },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
