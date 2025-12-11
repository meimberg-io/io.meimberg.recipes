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
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
    // Cache optimized images for 1 year to prevent re-fetching expired S3 pre-signed URLs
    // S3 pre-signed URLs from Notion expire after 1 hour, but we cache the optimized image
    // so Next.js won't try to re-fetch from the expired URL
    minimumCacheTTL: 31536000, // 1 year in seconds
  },
}

export default nextConfig

