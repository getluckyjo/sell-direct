import type { Metadata } from 'next';
import Link from 'next/link';
import { WhatsAppDemo } from './WhatsAppDemo';

export const metadata: Metadata = {
  title: 'The Sold Direct journey — list to registered sale on WhatsApp',
  description:
    'An interactive walkthrough of the full South African property journey on Sold Direct: profile, listing, buyer enquiry, bond pre-qualification, offer, conveyancing and Deeds Office registration — all in WhatsApp, at 0% commission.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Sold <span className="text-emerald-600">Direct</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Intro */}
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Interactive demo · illustrative figures
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            The whole journey, inside WhatsApp.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Follow one Cape Town home from listing to registered sale — profile
            and consent, guided listing, buyer enquiry, in-chat bond
            pre-qualification, a binding offer, conveyancing and Deeds Office
            registration. Press <span className="font-semibold">Play</span>, or
            step through it yourself. Watch the{' '}
            <span className="font-semibold text-emerald-700">tags</span> to see
            the legal steps and where Sold Direct earns.
          </p>
        </div>

        {/* The simulator */}
        <div className="mt-10">
          <WhatsAppDemo />
        </div>

        {/* Footnote */}
        <p className="mt-12 max-w-3xl text-xs leading-relaxed text-slate-400">
          For demonstration only. Names, the property and all amounts (prices,
          rates, repayments, transfer duty) are illustrative and not an offer,
          quote or financial advice. The conveyancing sequence reflects a
          typical South African freehold transfer; specifics vary per deal,
          municipality and bank. Sold Direct facilitates finance via a
          registered bond originator and legal work via panel conveyancers.
        </p>
      </main>
    </div>
  );
}
