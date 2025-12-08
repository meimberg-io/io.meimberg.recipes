import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure static pages are properly generated and cached
  experimental: {
    // Optimize static generation
    optimizePackageImports: ['@notionhq/client'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.notion.so',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.us-east-1.amazonaws.com',
      },
    ],
  },
}

export default nextConfig

