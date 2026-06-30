import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sold Direct — Investors',
  description:
    'Sold Direct is rethinking how homes are sold in South Africa: 0% commission to consumers, monetised through the financial ecosystem around every deal.',
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
