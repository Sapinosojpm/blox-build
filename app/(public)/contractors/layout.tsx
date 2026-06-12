import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Bloxburg Contractors & Builders Directory | BloxBuild',
  description:
    'Find and hire top Roblox Bloxburg builders, contractors, and designers. Browse portfolios, compare commission prices, and book builders.',
  keywords: [
    'Bloxburg contractors',
    'hire Bloxburg builder',
    'Bloxburg building service',
    'Bloxburg commissions',
  ],
});

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
