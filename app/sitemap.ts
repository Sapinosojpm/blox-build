import type { MetadataRoute } from 'next';
import { buildAbsoluteUrl } from '@/lib/seo';

const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: buildAbsoluteUrl('/'),
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: buildAbsoluteUrl('/explore'),
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl('/community'),
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/pricing'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
