import Image from 'next/image';
import { InvestorForm } from '@/components/InvestorForm';

const OPPORTUNITY = [
  {
    title: 'A big, resented cost',
    body: 'Estate-agent commission is the largest discretionary cost in a South African home sale — and the one sellers most want gone.',
  },
  {
    title: 'A large, digital-first market',
    body: 'A multi-billion-rand residential market where buyers and sellers already live on WhatsApp and increasingly expect to transact there.',
  },
  {
    title: "A model that doesn't charge the consumer",
    body: 'We make money from the financial ecosystem that already pays to be in every deal — so 0% to the consumer is sustainable, not a loss-leader.',
  },
];

const APPROACH = [
  {
    title: 'WhatsApp-first',
    body: 'List, enquire, pre-qualify and track a sale inside the channel South Africans already use — not another portal nobody opens.',
  },
  {
    title: 'Guided end-to-end',
    body: 'We do the tedious admin — offer, FICA, bond hand-off — and answer the one question everyone has: “where is my deal?”',
  },
  {
    title: 'A revenue stack',
    body: 'A core financial-services revenue engine, premium à-la-carte services, and a low-fee tier as a hedge — diversified from day one.',
  },
];

export default function Investors() {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            Sold <span className="text-emerald-400">Direct</span>
            <span className="ml-2 text-sm font-normal text-slate-400">
              Investors
            </span>
          </span>
          <a
            href="#access"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Request access
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/cape-town-hero.jpg"
          alt="Homes above the bay in Camps Bay, Cape Town, beneath the Twelve Apostles"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Dark overlay tuned for the slate theme so text stays legible */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-slate-900/45"
        />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
          <p className="mb-4 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            Pre-launch • Cape Town • WhatsApp-first
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Back the company making estate-agent commission{' '}
            <span className="text-emerald-400">obsolete.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">
            Sold Direct is a WhatsApp-first property marketplace for South
            Africa. 0% commission to buyers and sellers — we earn from the
            financial ecosystem around every deal.
          </p>
          <div className="mt-8">
            <a
              href="#access"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Request the investor data room
            </a>
          </div>
        </div>
      </section>

      {/* Opportunity */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">The opportunity</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {OPPORTUNITY.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
              >
                <h3 className="font-semibold text-emerald-300">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">How we win</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {APPROACH.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 p-6"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why now */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Why now</h2>
          <ul className="mt-6 grid gap-3 text-slate-300">
            <li className="flex gap-3">
              <span aria-hidden className="text-emerald-400">
                →
              </span>
              Regulatory clarity on operating as a registered practitioner and
              referring finance to licensed partners.
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="text-emerald-400">
                →
              </span>
              Near-universal WhatsApp adoption and rising comfort transacting in
              chat.
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="text-emerald-400">
                →
              </span>
              High-value Cape Town homes, where “keep your money” bites hardest.
            </li>
          </ul>
          <p className="mt-6 text-sm text-slate-400">
            Status: building the MVP, Cape Town first. We&apos;re raising to
            accelerate launch.
          </p>
        </div>
      </section>

      {/* Access / data room */}
      <section id="access" className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Investor data room</h2>
          <p className="mt-2 text-slate-300">
            Detailed financials, unit economics and partnerships are shared
            <span className="font-semibold text-slate-100"> under NDA</span>.
            Request access and we&apos;ll be in touch.
          </p>
          <div className="mt-8">
            <InvestorForm />
          </div>
          <p className="mt-6 text-xs text-slate-500">
            This page is informational only and is not an offer or solicitation
            to invest. Nothing here constitutes financial advice.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
          Confidential — do not distribute.
        </div>
      </footer>
    </div>
  );
}
