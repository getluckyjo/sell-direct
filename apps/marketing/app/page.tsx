import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Section } from '@/components/Section';
import { StickyCta } from '@/components/StickyCta';
import { WaitlistForm } from '@/components/WaitlistForm';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';

const CONTACT_EMAIL = 'johannes@solddirect.co.za';

const RIBBON =
  '0% commission — the banks pay us, not you. No bond in your sale? A simple 1%, agreed upfront.';

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
  },
  {
    title: 'Featured placement & social campaigns',
    body: 'Featured portal placement and targeted social campaigns.',
  },
  {
    title: 'Compliance-certificate coordination',
    body: 'We arrange every certificate your transfer needs — electrical, plumbing, gas and more.',
  },
];

const FAQ = [
  {
    q: 'Is it really 0% commission?',
    a: 'Yes. Every sale already has a bank earning inside it. When your buyer takes a bond of 80% or more through our partner and a panel conveyancer handles transfer, the bank pays us an origination commission — and you pay R0. The cost of selling moves off your shoulders and onto the banks.',
  },
  {
    q: 'What if my buyer pays cash?',
    a: 'Take it — a cash offer is often your best offer. With no bond there’s no bank to pay us, so a simple 1% applies, agreed upfront in your mandate. On a R6m home: R60,000, versus ~R414,000 for full service (6% + VAT).',
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

export default function Home() {
  return (
    <div>
      <div
        role="note"
        className="bg-navy-950 px-6 py-2 text-center text-sm font-semibold text-brand-300"
      >
        {RIBBON}
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="text-lg" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 sm:flex">
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#journey" className="hover:text-white">
              See it work
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <Link href="/compliance" className="hover:text-white">
              Compliance
            </Link>
            <a
              href="#waitlist"
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Join waitlist
            </a>
          </nav>
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
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-slate-900/25"
        />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-inset ring-white/30 backdrop-blur">
            Cape Town • WhatsApp-first • 0% commission
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Sell your home direct.{' '}
            <span className="text-brand-300">Keep your money.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-100">
            Sell privately, guided end-to-end on WhatsApp — with our concierge
            and registered practitioners behind you. 0% commission, because the
            banks pay us — not you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-950/20 transition hover:bg-brand-500"
            >
              Join the waitlist
            </a>
            <a
              href="#how"
              className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Who it's for + the saving */}
      <Section
        id="for"
        tone="tinted"
        eyebrow="Who it's for"
        heading="Made for sellers who choose to sell direct."
      >
        <div className="mt-8 grid items-center gap-10 sm:grid-cols-3">
          <div className="grid gap-6 sm:col-span-2">
            <p className="max-w-xl text-slate-600">
              Full-service agents are the right choice for many. Sold Direct is
              for sellers who&apos;d rather do it themselves — with our
              technology and people handling every step.
            </p>
            <ul className="grid gap-3 text-slate-600">
              <li className="flex gap-3">
                <span aria-hidden className="font-semibold text-brand-600">
                  ✓
                </span>
                You host the viewings — we do the paperwork
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="font-semibold text-brand-600">
                  ✓
                </span>
                A WhatsApp concierge from mandate to registration
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="font-semibold text-brand-600">
                  ✓
                </span>
                On the major property portals — doors normally closed to private
                sellers
              </li>
            </ul>
            <p className="text-sm text-slate-500">
              Our team includes PPRA-registered property practitioners.{' '}
              <Link
                href="/compliance"
                className="font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                How we keep it compliant →
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Agent commission on a R6m home
            </p>
            <p className="mt-1 text-4xl font-extrabold text-slate-600">
              ~R414k
            </p>
            <p className="mt-6 text-sm text-slate-500">With Sold Direct</p>
            <p className="mt-1 text-5xl font-extrabold text-brand-600">R0</p>
          </div>
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
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/50 bg-white/90 p-6 shadow-lg backdrop-blur"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
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
        <div className="mt-8 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <WhatsAppDemo />
        </div>
      </Section>

      {/* Pricing */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        heading="Two ways to sell. One simple rule: the banks pay us, not you."
        intro="When your buyer bonds through our partner, the bank pays us — you pay 0%. No bond? A simple 1%, agreed upfront."
      >
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? 'border-brand-300 bg-white shadow-lg ring-2 ring-brand-200'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {tier.name}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {tier.tagline}
                </span>
              </div>
              <p className="mt-4 text-6xl font-extrabold tracking-tight text-slate-900">
                {tier.price}
              </p>
              <p className="mt-4 text-sm text-slate-600">{tier.mechanic}</p>
              <ul className="mt-6 grid gap-2.5 text-sm text-slate-600">
                {tier.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span
                      aria-hidden
                      className="font-semibold text-brand-600"
                    >
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <div aria-hidden className="min-h-6 flex-1" />
              <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
                {tier.foot}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-slate-600">
          On a R6m home, that&apos;s{' '}
          <span className="font-semibold text-brand-700">R0</span> or{' '}
          <span className="font-semibold text-brand-700">R60k</span> — versus
          ~R414k for a typical full-service commission (6% + VAT).
        </p>
        <p className="mx-auto mt-3 max-w-4xl text-center text-xs text-slate-400">
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
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ADDONS.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <h3 className="font-semibold text-brand-700">{a.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{a.body}</p>
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
        <div className="mt-8 grid max-w-3xl gap-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-brand-300"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
                <span className="mr-2 text-brand-600">＋</span>
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
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
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">
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
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Be first in Cape Town
          </h2>
          <p className="mt-2 text-slate-600">
            Join the first group of Cape Town sellers and buyers — we&apos;ll
            reach out as we go live.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Prefer email?{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand-700 hover:text-brand-600"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Logo className="text-lg" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
            <span>
              © {new Date().getFullYear()} Sold Direct. Cape Town, South
              Africa.
            </span>
            <nav className="flex flex-wrap gap-5">
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
