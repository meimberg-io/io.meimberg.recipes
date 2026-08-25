import type { MetadataRoute } from 'next'
import { baseUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // The cover images of every recipe are served through the proxy route;
      // Googlebot must be able to fetch them for image and recipe rich results,
      // so it is allowed back in explicitly (a longer Allow beats a Disallow).
      allow: ['/', '/api/image-proxy'],
      disallow: ['/api/', '/test'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
