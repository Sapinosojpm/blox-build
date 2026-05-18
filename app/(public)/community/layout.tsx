import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Bloxburg Community Forum | BloxBuild',
  description:
    'Join BloxBuild community discussions about Roblox Bloxburg builds, builder tips, commissions, pricing, and design ideas.',
  path: '/community',
  keywords: [
    'Bloxburg forum',
    'Bloxburg builder discussion',
    'Roblox Bloxburg community',
    'Bloxburg commission advice',
  ],
});

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
