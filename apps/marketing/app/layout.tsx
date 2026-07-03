import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sold Direct — Sell your home, direct. On WhatsApp.',
  description:
    'The streamlined way to sell your Cape Town home privately — 0% commission on the qualifying path, guided on WhatsApp by our technology, concierge and registered property practitioners.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
