import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Section } from '@/components/Section';
import { StickyCta } from '@/components/StickyCta';
import { WaitlistForm } from '@/components/WaitlistForm';
import { whatsappCtas } from '@/lib/whatsapp';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';

const CONTACT_EMAIL = 'johannes@solddirect.co.za';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#journey', label: 'See it work' },
  { href: '#faq', label: 'FAQ' },
];

const HERO_PILLS = ['Cape Town', 'WhatsApp-first', '0% commission'];

const SELLER_POINTS = [
  'You host the viewings — we do the paperwork',
  'A WhatsApp concierge from mandate to registration',
  'On the major property portals — doors normally closed to private sellers',
];

const STEPS = [
  {
    title: 'List on WhatsApp',
    body: 'A few guided questions, add your photos — live in minutes.',
  },
  {
    title: 'Buyers enquire & pre-qualify',
    body: 'Bond pre-qualification happens in the chat — you only deal with serious offers.',
  },
  {
    title: 'Accept an offer',
    body: 'Compare offers, sign the Offer to Purchase, hand off to a panel conveyancer.',
  },
  {
    title: 'Tracked to transfer',
    body: 'Every stage tracked, from bond to Deeds Office registration.',
  },
];

const TIERS = [
  {
    name: 'Free',
    tagline: '0% commission',
    price: 'R0',
    mechanic:
      'Your buyer bonds through our partner and a panel conveyancer handles transfer. The bank pays us — you pay nothing.',
    points: [
      'Full listing, portal syndication & deal tracker',
      'WhatsApp concierge from mandate to registration',
      'Exclusive with us for a fixed term',
    ],
    foot: 'Cash buyer? A simple 1%, agreed upfront.',
    highlight: true,
  },
  {
    name: 'Flex',
    tagline: 'No lock-in',
    price: '1%',
    mechanic:
      'No exclusivity, no partner requirements — one simple fee, only when you sell.',
    points: [
      'The same platform, tools and concierge',
      'Any buyer, any bank, any conveyancer',
      'Nothing to pay until your home sells',
    ],
    foot: 'For sellers who want total freedom.',
    highlight: false,
  },
];

const ADDONS = [
  {
    title: 'Photography & floor plans',
    body: 'Professional shoots and floor plans that make your listing stand out.',
    icon: (
      <>
        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .84-.46l.7-1.08A1 1 0 0 1 9.08 4h5.84a1 1 0 0 1 .84.46l.7 1.08a1 1 0 0 0 .84.46h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z" />
        <circle cx="12" cy="12.5" r="3.25" />
      </>
    ),
  },
  {
    title: 'Featured placement & social campaigns',
    body: 'Featured portal placement and targeted social campaigns.',
    icon: (
      <>
        <path d="M4 9v6h3l6 4V5L7 9H4Z" />
        <path d="M17.5 9.5a4 4 0 0 1 0 5" />
      </>
    ),
  },
  {
    title: 'Compliance-certificate coordination',
    body: 'We arrange every certificate your transfer needs — electrical, plumbing, gas and more.',
    icon: (
      <>
        <path d="M12 3.5 5 6.2v5.1c0 4.2 2.9 8.1 7 9.2 4.1-1.1 7-5 7-9.2V6.2L12 3.5Z" />
        <path d="m9.2 12.2 2 2 3.6-3.8" />
      </>
    ),
  },
];

const FAQ = [
  {
    q: 'Is it really 0% commission?',
    a: 'Yes. Every sale already has a bank earning inside it. When your buyer takes a bond of 80% or more through our partner and a panel conveyancer handles transfer, the bank pays us an origination commission — and you pay R0. The cost of selling moves off your shoulders and onto the banks.',
  },
  {
    q: 'What if my buyer pays cash?',
    a: 'Take it — a cash offer is often your best offer. With no bond there’s no bank to pay us, so a simple 1% applies, agreed upfront in your mandate. On a R6m home: R60 000, versus about R414 000 for full service (6% + VAT).',
  },
  {
    q: 'What does the exclusive mandate involve? Can I cancel?',
    a: 'A fixed-term exclusive mandate with plain-language terms, e-signed on WhatsApp and handled by our registered practitioners. Cancellation follows its notice terms — or choose Flex, with no exclusivity.',
  },
  {
    q: 'Are you against estate agents?',
    a: 'No. Full-service agents are the right choice for many sellers — we employ registered practitioners ourselves. We simply serve those who choose to sell privately.',
  },
  {
    q: 'Is my information safe?',
    a: 'Explicit consent before we collect anything, only what each step needs, sensitive fields encrypted, never sold — POPIA by design. See our privacy notice and compliance page.',
  },
];

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      className={`h-5 w-5 flex-none ${className}`}
    >
      <circle cx="10" cy="10" r="10" className="fill-brand-50" />
      <path
        d="m6 10.4 2.6 2.6L14 7.6"
        className="stroke-brand-600"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  // Every CTA sends people into WhatsApp with LIST or PRICE pre-filled.
  // Null until the sender is approved (docs/META-ONBOARDING.md) — the
  // waitlist is the fallback until then.
  const wa = whatsappCtas();

  return (
    <div>
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 backdrop-blur supports-[backdrop-filter]:bg-navy/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo className="text-lg" />
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/compliance" className="hover:text-white">
                Compliance
              </Link>
            </nav>
            {/* Always visible — on mobile the nav links collapse, but the
                primary action must never disappear. */}
            <a
              href={wa ? wa.list.href : '#waitlist'}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              {wa ? 'Send “LIST” on WhatsApp' : 'Join waitlist'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="relative isolate overflow-hidden">
        <Image
          src="/cape-town-hero.jpg"
          alt="Homes above the bay in Camps Bay, Cape Town, beneath the Twelve Apostles"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Two overlays: a diagonal wash for the headline, plus a bottom-up
            scrim so the sub-copy and buttons stay legible over bright water. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-900/35"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent"
        />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-32 sm:pt-32">
          <ul className="mb-6 flex flex-wrap gap-2">
            {HERO_PILLS.map((pill) => (
              <li
                key={pill}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-inset ring-white/30 backdrop-blur"
              >
                {pill}
              </li>
            ))}
          </ul>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-md sm:text-6xl">
            Sell your home direct.{' '}
            <span className="text-brand-300 drop-shadow-[0_2px_12px_rgba(2,6,23,0.85)]">
              Keep your money.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-100 drop-shadow-sm">
            Sell privately, guided end-to-end on WhatsApp — with our concierge
            and registered practitioners behind you. 0% commission, because the
            banks pay us — not you.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={wa ? wa.list.href : '#waitlist'}
              className="rounded-lg bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-brand-950/20 transition hover:bg-brand-500"
            >
              {wa ? 'Send “LIST” on WhatsApp' : 'Join the waitlist'}
            </a>
            {wa ? (
              <a
                href={wa.price.href}
                className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-center font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Send “PRICE” — what’s my home worth?
              </a>
            ) : null}
            <a
              href="#how"
              className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-center font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See how it works
            </a>
          </div>
          {wa ? (
            <p className="mt-4 text-sm text-slate-200">
              Two words, one chat. Everything happens on WhatsApp — no forms, no
              logins.
            </p>
          ) : null}
        </div>
      </section>

      {/* Who it's for + the saving */}
      <Section
        id="for"
        tone="tinted"
        eyebrow="Who it's for"
        heading="Made for sellers who choose to sell direct."
        intro="Full-service agents are the right choice for many. Sold Direct is for sellers who'd rather do it themselves — with our technology and people handling every step."
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-7">
            <ul className="grid gap-4">
              {SELLER_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-base leading-relaxed text-slate-700"
                >
                  <CheckIcon className="mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
              Our team includes PPRA-registered property practitioners.{' '}
              <Link
                href="/compliance"
                className="whitespace-nowrap font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                How we keep it compliant →
              </Link>
            </p>
          </div>

          {/* The saving, as a comparison rather than two floating numbers. */}
          <figure className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-5">
            <figcaption>
              <p className="text-base font-bold text-slate-900">
                What it costs to sell a R6m home
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Compared with a typical full-service commission of 6% + VAT.
              </p>
            </figcaption>

            <dl className="mt-8 space-y-7">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-600">
                    A full-service sale
                  </dt>
                  <dd className="text-2xl font-extrabold tracking-tight text-slate-900">
                    ~R414 000
                  </dd>
                </div>
                <div
                  aria-hidden
                  className="mt-3 h-2.5 w-full rounded-full bg-slate-200"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm font-medium text-slate-600">
                    With Sold Direct
                  </dt>
                  <dd className="text-2xl font-extrabold tracking-tight text-brand-700">
                    R0
                  </dd>
                </div>
                <div
                  aria-hidden
                  className="mt-3 h-2.5 w-full rounded-full bg-slate-100"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                </div>
              </div>
            </dl>

            <p className="mt-8 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold leading-relaxed text-brand-800">
              About R414 000 that stays with you.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Indicative figures for a qualifying sale. Cash buyer? A simple 1%.
            </p>
          </figure>
        </div>
      </Section>

      {/* How it works */}
      <Section
        id="how"
        eyebrow="The journey"
        heading="How it works"
        intro="A guided, digital version of the South African property journey — start to registration."
        backdrop={{
          src: '/bo-kaap-street.jpg',
          alt: 'Colourful Bo-Kaap houses beneath Lion’s Head, Cape Town',
        }}
      >
        {/* Subgrid keeps every card's body text on the same baseline even when
            a title wraps to two lines. */}
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_1fr]">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-0"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-balance font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Interactive journey */}
      <Section
        id="journey"
        tone="tinted"
        eyebrow="See it work · interactive"
        heading="The whole journey, inside WhatsApp."
        intro="One Cape Town home, from listing to registered sale. Press Play, or step through it yourself."
      >
        <div className="rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <WhatsAppDemo />
        </div>
      </Section>

      {/* Pricing */}
      <Section
        id="pricing"
        align="center"
        eyebrow="Pricing"
        heading="Two ways to sell. One simple rule: the banks pay us, not you."
        intro="When your buyer bonds through our partner, the bank pays us — you pay 0%. No bond? A simple 1%, agreed upfront."
      >
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? 'border-brand-300 bg-white shadow-lg ring-2 ring-brand-200'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {tier.name}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {tier.tagline}
                </span>
              </div>
              <p className="mt-6 text-6xl font-extrabold leading-none tracking-tight text-slate-900">
                {tier.price}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                {tier.mechanic}
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-600">
                {tier.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <CheckIcon className="mt-px h-[18px] w-[18px]" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
              <div aria-hidden className="min-h-8 flex-1" />
              <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
                {tier.foot}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-base text-slate-600">
          On a R6m home, that&apos;s{' '}
          <span className="font-semibold text-brand-700">R0</span> or{' '}
          <span className="font-semibold text-brand-700">R60 000</span> —
          compared with about R414 000 at a typical full-service commission (6%
          + VAT).
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-slate-400">
          Pricing shown is indicative for our Cape Town launch and subject to
          our terms.
        </p>
      </Section>

      {/* Add-ons */}
      <Section
        id="addons"
        eyebrow="À la carte"
        heading="Optional add-ons"
        intro="Extras to make your home shine — priced per service."
        backdrop={{
          src: '/living-room-interior.jpg',
          alt: 'A bright, professionally styled living room, ready for viewings',
          overlay: 'light',
        }}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {ADDONS.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {a.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-balance font-semibold text-slate-900">
                {a.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        eyebrow="Straight answers"
        heading="Questions sellers ask"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="text-base leading-relaxed text-slate-600">
              Everything sellers want to know before they list — the mandate,
              the money and your data.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Still unsure?{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                Ask us directly
              </a>{' '}
              — a real person answers.
            </p>
          </div>
          <div className="grid content-start gap-3 lg:col-span-8">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-white px-5 shadow-sm transition open:border-brand-200 open:shadow-md hover:border-slate-300"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-slate-900 marker:content-none">
                  <span className="text-balance">{item.q}</span>
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-5 w-5 flex-none text-slate-400 transition duration-200 group-open:rotate-180 group-open:text-brand-600"
                  >
                    <path
                      d="m5.5 8 4.5 4.5L14.5 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="border-t border-slate-100 pb-5 pt-4 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* City banner */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/green-point-aerial.jpg"
          alt="Aerial view of Green Point and the Atlantic coast beneath a tablecloth cloud pouring over Table Mountain"
          width={2000}
          height={1500}
          sizes="100vw"
          className="h-[22rem] w-full object-cover object-[50%_30%] saturate-[1.1] sm:h-[30rem]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Built for Cape Town, from the first listing to registration.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-200 drop-shadow">
              Designed around how South African transfers actually work.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16 sm:py-24"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Be first in Cape Town
          </h2>
          <p className="mt-3 text-slate-600">
            Join the first group of Cape Town sellers and buyers — we&apos;ll
            reach out as we go live.
          </p>
          {wa ? (
            <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
              Ready now? Send{' '}
              <a
                href={wa.list.href}
                className="font-semibold underline underline-offset-2"
              >
                “LIST”
              </a>{' '}
              or{' '}
              <a
                href={wa.price.href}
                className="font-semibold underline underline-offset-2"
              >
                “PRICE”
              </a>{' '}
              to our WhatsApp and we’ll take it from there.
            </p>
          ) : null}
          <div className="mt-8">
            <WaitlistForm />
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Prefer email?{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Logo className="text-lg" />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
            <span>
              © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
            </span>
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
                {CONTACT_EMAIL}
              </a>
              <Link href="/onepager" className="hover:text-white">
                One-pager
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy notice
              </Link>
              <Link href="/compliance" className="hover:text-white">
                Compliance
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      <StickyCta />
    </div>
  );
}
