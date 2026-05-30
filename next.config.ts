import type { NextConfig } from "next";
import BundleAnalyzerPlugin from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  // App Router is stable in Next.js 13+ and enabled by default
  experimental: {
    optimizePackageImports: ['react', 'react-dom', '@supabase/supabase-js', '@supabase/ssr']
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Generate optimized images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
};

const withBundleAnalyzer = BundleAnalyzerPlugin({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);