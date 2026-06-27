import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sell Direct — Sell your home, keep your money',
  description:
    '0% commission for buyers and sellers in Cape Town. We get paid by the banks, not by you. Manage your whole property sale from WhatsApp.',
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
