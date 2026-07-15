import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sold Direct — Investor Overview · R10m Seed',
  description:
    'Sold Direct has built an AI real-estate agent, trained on 50 years of SA property, legal and bond data, powering 0%-commission private sales on WhatsApp (qualifying path). Raising a R10m seed for 25%.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
