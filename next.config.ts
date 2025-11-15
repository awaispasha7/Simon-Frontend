import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize build performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    // Disable optimization for Supabase images to avoid timeout issues
    unoptimized: true,
  },
  
  // Compress output
  compress: true,
  
};

export default nextConfig;
