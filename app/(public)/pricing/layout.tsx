import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Builder Pricing and Plans | BloxBuild',
  description:
    'Compare BloxBuild subscription plans for Roblox Bloxburg creators, unlock builder badges, and start receiving build commissions.',
  path: '/pricing',
  keywords: [
    'BloxBuild pricing',
    'Bloxburg builder subscription',
    'Bloxburg commission platform',
    'Roblox builder plans',
  ],
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
