import type { Metadata } from 'next';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const siteConfig = {
  name: 'BloxBuild',
  title: 'BloxBuild | Roblox Bloxburg Builds, Builders, and Commissions',
  description:
    'BloxBuild is a Roblox Bloxburg builder marketplace where players discover house builds, browse portfolios, compare builder styles, and book Bloxburg build commissions.',
  keywords: [
    'BloxBuild',
    'blox build',
    'bloxbuild hub',
    'Roblox Bloxburg builds',
    'Bloxburg builders',
    'Bloxburg build commissions',
    'Bloxburg house ideas',
    'Bloxburg mansion builds',
    'Bloxburg cottage builds',
    'Roblox building community',
    'Bloxburg build marketplace',
    'hire Bloxburg builder',
  ],
};

export const siteUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'https://www.bloxbuild.xyz'
).replace(/^((?!https?:\/\/).*)$/, 'https://$1');

export const siteUrlObject = new URL(siteUrl);

export const buildAbsoluteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, siteUrlObject).toString();
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export const createPageMetadata = ({
  title,
  description,
  path,
  keywords = [],
}: PageMetadataOptions): Metadata => ({
  title,
  description,
  keywords: [...siteConfig.keywords, ...keywords],
  alternates: path
    ? {
        canonical: path,
      }
    : undefined,
  openGraph: {
    title,
    description,
    url: path,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
});
