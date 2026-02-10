import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  // Optimize static assets
  staticPageGenerationTimeout: 90,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/supabase-js'],
    // Better code splitting
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [
      // Locale-prefixed redirects (avoid double-redirect through middleware)
      {
        source: '/:locale/contact-us',
        destination: '/:locale/contact',
        permanent: true,
      },
      {
        source: '/:locale/join-us',
        destination: '/:locale/for-vendors',
        permanent: true,
      },
      {
        source: '/:locale/vendor',
        destination: '/:locale/for-vendors',
        permanent: true,
      },
      // Non-locale redirects (for direct access without locale)
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/join-us',
        destination: '/for-vendors',
        permanent: true,
      },
      {
        source: '/vendor',
        destination: '/for-vendors',
        permanent: true,
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(withNextIntl(nextConfig));
