import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

// Used for absolute OpenGraph URLs. Override with NEXT_PUBLIC_SITE_URL when
// the investor site's final domain is confirmed.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://investors.solddirect.co.za';

const TITLE = 'Sold Direct — Investor Overview · R10m Seed';
const DESCRIPTION =
  'Sold Direct has built an AI real-estate agent, trained on 50 years of SA property, legal and bond data, powering 0%-commission private sales on WhatsApp (qualifying path). Raising a R10m seed for 25%.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_ZA',
    siteName: 'Sold Direct',
    images: [
      {
        url: '/cape-town-hero.jpg',
        width: 1920,
        height: 1280,
        alt: 'Homes above the bay in Camps Bay, Cape Town',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/cape-town-hero.jpg'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen bg-navy text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
