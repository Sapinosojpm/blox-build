import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Bloxburg Builder Profiles | BloxBuild',
  description:
    'View Roblox Bloxburg builder profiles, portfolios, styles, and commission availability on BloxBuild.',
  keywords: [
    'Bloxburg builder profiles',
    'hire Roblox builder',
    'Bloxburg builder portfolio',
  ],
});

export default function BuildersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
