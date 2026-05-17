const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',        // Static HTML export for Capacitor offline APK
  trailingSlash: true,     // Required for static export routing
  images: {
    unoptimized: true,     // Required for static export (no Next.js image server)
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
