import Image from 'next/image';
import type { ReactNode } from 'react';
import { InvestorForm } from '@/components/InvestorForm';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';
import { Section } from '@/components/pitch/Section';
import { StatGrid } from '@/components/pitch/StatGrid';
import { RevenueBars } from '@/components/pitch/RevenueBars';
import { CapTable } from '@/components/pitch/CapTable';
import { TicketCalculator } from '@/components/pitch/TicketCalculator';
import { SummaryStrip } from '@/components/pitch/SummaryStrip';
import { QualifyingNote } from '@/components/pitch/QualifyingNote';
import { StickyCta } from '@/components/pitch/StickyCta';
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

// Copy strings mark the qualifying-path condition as "0%*"; every instance
// must resolve instantly, so split around the token and render the tooltip.
function withZeroNote(text: string): ReactNode {
  if (!text.includes('0%*')) return text;
  const parts = text.split('0%*');
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <QualifyingNote key={`zero-${i}`} />]
      : [part],
  );
}

export default function Investors() {
  return (
    <div>
      <div
        role="note"
        className="border-b border-slate-800 bg-slate-900 px-6 py-2 text-center text-sm font-semibold text-emerald-300"
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
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">
              {HERO.eyebrow}
            </p>
            <a
              href="#summary"
              className="text-sm font-medium text-emerald-300 underline decoration-emerald-400/50 underline-offset-4 hover:text-emerald-200"
            >
              {HERO.summaryAnchor}
            </a>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            {HERO.title}{' '}
            <span className="text-emerald-400">
              {HERO.titleAccentPre}
              <QualifyingNote />
              {HERO.titleAccentPost}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">{HERO.sub}</p>

          {/* The deal at a glance */}
          <SummaryStrip />

          <a
            href="#financials"
            className="mt-4 inline-flex rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-400 hover:text-emerald-300"
          >
            {HERO.ctaSecondary} ↓
          </a>
        </div>
      </section>

      {/* Product (the AI) */}
      <Section
        id="ai"
        tone="tinted"
        eyebrow="Product"
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
              <p className="mt-2 text-base text-slate-300">
                {withZeroNote(card.body)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Revenue model */}
      <Section
        id="model"
        eyebrow="Revenue model"
        heading={MODEL_SECTION.heading}
      >
        <p className="mt-3 max-w-3xl text-base text-slate-300">
          {MODEL_SECTION.introPre}
          <QualifyingNote />
          {MODEL_SECTION.introPost}
        </p>
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
              <p className="mt-2 text-base text-slate-300">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          {MODEL_SECTION.dependsOn}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {MODEL_SECTION.revenueLines.map((line) => (
            <div
              key={line.title}
              className="rounded-2xl border border-slate-800 p-6"
            >
              <h3 className="font-semibold">{line.title}</h3>
              <p className="mt-2 text-base text-slate-300">{line.body}</p>
            </div>
          ))}
        </div>

        {/* Revenue per deal — mini table */}
        <div className="mt-8 max-w-3xl">
          <h3 className="font-semibold text-white">
            {MODEL_SECTION.perDeal.heading}
          </h3>
          <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-800 text-center">
            {MODEL_SECTION.perDeal.rows.map((row) => (
              <div
                key={row.year}
                className="border-slate-800 p-4 [&:not(:first-child)]:border-l"
              >
                <p className="text-sm text-slate-400">{row.year}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                  {row.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{row.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {MODEL_SECTION.perDeal.explainer}
          </p>
        </div>
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
        <p className="mt-6 max-w-3xl text-base text-slate-300">
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

      {/* Financials */}
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
        <ul className="mt-8 grid max-w-3xl gap-3 text-slate-300">
          {TRACTION_SECTION.shipped.map((item) => (
            <li key={item} className="flex gap-3 text-base">
              <span aria-hidden className="text-emerald-400">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {TRACTION_SECTION.partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-baseline gap-2 rounded-full border border-slate-700 bg-slate-950 px-5 py-2.5"
            >
              <span className="font-semibold text-white">{partner.name}</span>
              <span className="text-sm text-slate-400">{partner.role}</span>
            </div>
          ))}
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

      {/* The Raise */}
      <Section
        id="ask"
        tone="tinted"
        eyebrow="The Raise"
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
            <p className="mt-1 text-base text-slate-300">{ASK.preMoney}</p>
            <p className="mt-4 text-sm text-slate-400">{ASK.seriesA}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white">Use of funds</h3>
            <ul className="mt-3 grid gap-2 text-base text-slate-300">
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
            <ol className="mt-3 grid gap-3 text-base text-slate-300">
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
              <p className="mt-3 text-base leading-relaxed text-slate-300">
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
          <p className="mt-2 text-base text-slate-300">
            {ACCESS_SECTION.intro}
          </p>
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
          <p>{QUALIFYING_PATH_NOTE}</p>
          <p className="mt-4">
            © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
            Confidential — do not distribute. Not an offer to the public;
            private placement only.
          </p>
        </div>
      </footer>

      <StickyCta />
    </div>
  );
}
