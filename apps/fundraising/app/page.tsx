import Image from 'next/image';
import { InvestorForm } from '@/components/InvestorForm';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';
import { Section } from '@/components/pitch/Section';
import { StatGrid } from '@/components/pitch/StatGrid';
import { RevenueBars } from '@/components/pitch/RevenueBars';
import { CapTable } from '@/components/pitch/CapTable';
import { TicketCalculator } from '@/components/pitch/TicketCalculator';
import {
  ACCESS_SECTION,
  AI_SECTION,
  ASK,
  ASK_SECTION,
  DEMO_SECTION,
  DISCLAIMER,
  FAQ,
  FIN_SECTION,
  HERO,
  MARKET_SECTION,
  MODEL_SECTION,
  NAV,
  NEXT_STEPS,
  QUALIFYING_PATH_NOTE,
  RIBBON,
  TEAM_SECTION,
  TRACTION_SECTION,
} from '@/content/pitch';

export default function Investors() {
  return (
    <div>
      <div
        role="note"
        className="bg-emerald-500 px-6 py-2 text-center text-sm font-semibold text-slate-950"
      >
        {RIBBON}
      </div>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <span className="shrink-0 text-lg font-bold tracking-tight">
            Sold <span className="text-emerald-400">Direct</span>
            <span className="ml-2 hidden text-sm font-normal text-slate-400 sm:inline">
              Investors
            </span>
          </span>
          <nav className="hidden min-w-0 items-center gap-4 overflow-x-auto text-sm text-slate-300 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#access"
            className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
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
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-slate-900/45"
        />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
          <p className="mb-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            {ASK.badge}
          </p>
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-300">
            {HERO.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            {HERO.title}{' '}
            <span className="text-emerald-400">{HERO.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">{HERO.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#access"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              {HERO.ctaPrimary}
            </a>
            <a
              href="#financials"
              className="rounded-lg border border-slate-500 px-6 py-3 font-semibold text-white transition hover:border-emerald-400 hover:text-emerald-300"
            >
              {HERO.ctaSecondary}
            </a>
          </div>
          <p className="mt-6 max-w-2xl text-xs text-slate-400">
            {QUALIFYING_PATH_NOTE}
          </p>
        </div>
      </section>

      {/* The AI */}
      <Section
        id="ai"
        tone="tinted"
        eyebrow="The IP"
        heading={AI_SECTION.heading}
        intro={AI_SECTION.intro}
      >
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {AI_SECTION.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
            >
              <h3 className="font-semibold text-emerald-300">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How we earn */}
      <Section
        id="model"
        eyebrow="Revenue model"
        heading={MODEL_SECTION.heading}
        intro={MODEL_SECTION.intro}
      >
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            MODEL_SECTION.originationStep.y1,
            MODEL_SECTION.originationStep.y2,
          ].map((step, i) => (
            <div
              key={step.label}
              className={`rounded-2xl border p-6 ${
                i === 1
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-800'
              }`}
            >
              <p className="text-sm font-medium text-slate-400">{step.label}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                {step.rate}
              </p>
              <p className="mt-2 text-sm text-slate-300">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {MODEL_SECTION.revenueLines.map((line) => (
            <div
              key={line.title}
              className="rounded-2xl border border-slate-800 p-6"
            >
              <h3 className="font-semibold">{line.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{line.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm font-medium text-emerald-300">
          {MODEL_SECTION.perDeal}
        </p>
        <p className="mt-2 max-w-3xl text-xs text-slate-400">
          {QUALIFYING_PATH_NOTE}
        </p>
      </Section>

      {/* Market */}
      <Section
        id="market"
        tone="tinted"
        eyebrow="Market"
        heading={MARKET_SECTION.heading}
        intro={MARKET_SECTION.intro}
      >
        <StatGrid stats={MARKET_SECTION.stats} />
        <p className="mt-6 max-w-3xl text-sm text-slate-300">
          {MARKET_SECTION.consumer}
        </p>
      </Section>

      {/* City banner */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/cape-town-city.jpg"
          alt="Aerial view of Cape Town, Table Mountain and the Atlantic seaboard"
          width={2000}
          height={1333}
          sizes="100vw"
          className="h-[22rem] w-full object-cover saturate-[1.15] contrast-[1.04] sm:h-[30rem]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Landing at prime Cape Town, broadening nationally.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-200 drop-shadow">
              High-value homes, near-universal WhatsApp adoption, and a finance
              ecosystem that already pays to be in every deal.
            </p>
          </div>
        </div>
      </section>

      {/* Financial headlines */}
      <Section
        id="financials"
        eyebrow="Financials"
        heading={FIN_SECTION.heading}
        intro={FIN_SECTION.intro}
      >
        <RevenueBars />
        <StatGrid stats={FIN_SECTION.stats} />
        <p className="mt-6 max-w-3xl text-xs text-slate-400">
          {FIN_SECTION.caveat}
        </p>
      </Section>

      {/* Traction & partners */}
      <Section
        id="traction"
        tone="tinted"
        eyebrow="Traction"
        heading={TRACTION_SECTION.heading}
        intro={TRACTION_SECTION.intro}
      >
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <ul className="grid gap-3 text-slate-300">
            {TRACTION_SECTION.shipped.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <span aria-hidden className="text-emerald-400">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            {TRACTION_SECTION.partners.map((partner) => (
              <div
                key={partner.name}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <h3 className="font-semibold text-white">{partner.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{partner.role}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Team & cap table */}
      <Section
        id="team"
        eyebrow="Team & ownership"
        heading={TEAM_SECTION.heading}
        intro={TEAM_SECTION.intro}
      >
        <CapTable />
      </Section>

      {/* The ask */}
      <Section
        id="ask"
        tone="tinted"
        eyebrow="The raise"
        heading={ASK_SECTION.heading}
        intro={ASK_SECTION.intro}
      >
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6">
            <p className="text-sm font-medium text-slate-400">Seed round</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">
              {ASK.amount}{' '}
              <span className="text-2xl text-emerald-300">for {ASK.stake}</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">{ASK.preMoney}</p>
            <p className="mt-4 text-sm text-slate-400">{ASK.seriesA}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white">Use of funds</h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300">
              {ASK_SECTION.useOfFunds.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="text-emerald-400">
                    →
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TicketCalculator />
          <div className="rounded-2xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white">What happens next</h3>
            <ol className="mt-3 grid gap-3 text-sm text-slate-300">
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300"
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href="#access"
              className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Request the data room
            </a>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Straight answers" heading="Investor FAQ">
        <div className="mt-8 grid gap-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-800 bg-slate-950 p-5 open:border-emerald-500/40"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-100 marker:content-none">
                <span className="mr-2 text-emerald-400 group-open:hidden">
                  +
                </span>
                <span className="mr-2 hidden text-emerald-400 group-open:inline">
                  −
                </span>
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Interactive journey */}
      <Section
        id="demo"
        eyebrow="See it work · interactive"
        heading={DEMO_SECTION.heading}
        intro={DEMO_SECTION.intro}
      >
        <div className="mt-8 rounded-3xl bg-white p-4 shadow-2xl sm:p-8">
          <WhatsAppDemo />
        </div>
      </Section>

      {/* Access / data room */}
      <section
        id="access"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16"
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {ACCESS_SECTION.heading}
          </h2>
          <p className="mt-2 text-slate-300">{ACCESS_SECTION.intro}</p>
          <div className="mt-8">
            <InvestorForm />
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            {DISCLAIMER}
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
          Confidential — do not distribute. Not an offer to the public; private
          placement only.
        </div>
      </footer>
    </div>
  );
}
