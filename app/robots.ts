import type { MetadataRoute } from 'next';
import { buildAbsoluteUrl, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/login', '/register', '/api/'],
    },
    sitemap: buildAbsoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}
