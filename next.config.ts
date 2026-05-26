import type { NextConfig } from "next";
import BundleAnalyzerPlugin from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  // App Router is stable in Next.js 13+ and enabled by default
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr']
  }
};

const withBundleAnalyzer = BundleAnalyzerPlugin({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);