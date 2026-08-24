import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sold Direct — Control room',
  description: 'Internal dashboard for Sold Direct.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-white/10 bg-navy">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="inline-flex items-baseline">
              <Logo className="text-base" />
              <span className="ml-2 text-xs font-normal text-slate-400">
                control room
              </span>
            </Link>
            <nav className="flex gap-4 text-sm text-slate-300">
              <Link href="/listings" className="hover:text-white">
                Listings
              </Link>
              <Link href="/deals" className="hover:text-white">
                Deals
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
