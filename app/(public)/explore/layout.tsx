import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Explore Bloxburg Builds | BloxBuild',
  description:
    'Browse Roblox Bloxburg build ideas including mansions, cottages, suburban homes, cafes, and roleplay cities from BloxBuild creators.',
  path: '/explore',
  keywords: [
    'Bloxburg build catalog',
    'Bloxburg house inspiration',
    'Bloxburg build ideas',
    'Roblox Bloxburg creations',
  ],
});

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
