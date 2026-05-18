import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { buildAbsoluteUrl, createPageMetadata, siteConfig } from '@/lib/seo';

export const metadata: Metadata = {
  ...createPageMetadata({
    title: 'BloxBuild | Discover Roblox Bloxburg Builds and Hire Builders',
    description:
      'Explore Bloxburg house builds, compare builder portfolios, discover commissions, and connect with Roblox Bloxburg builders on BloxBuild.',
    path: '/',
    keywords: [
      'discover Bloxburg builds',
      'Bloxburg build ideas',
      'Roblox Bloxburg builder platform',
      'Bloxburg portfolio website',
    ],
  }),
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: buildAbsoluteUrl('/'),
    description: siteConfig.description,
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: buildAbsoluteUrl('/'),
    description: siteConfig.description,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
