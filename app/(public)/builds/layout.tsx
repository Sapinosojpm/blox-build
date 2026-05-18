import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Bloxburg Build Showcases | BloxBuild',
  description:
    'Browse detailed Roblox Bloxburg build showcases, screenshots, budgets, and builder information on BloxBuild.',
  keywords: [
    'Bloxburg build showcase',
    'Roblox Bloxburg house gallery',
    'Bloxburg build listings',
  ],
});

export default function BuildsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
