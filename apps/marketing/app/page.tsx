import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/Section';
import { StickyCta } from '@/components/StickyCta';
import { WaitlistForm } from '@/components/WaitlistForm';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';

const CONTACT_EMAIL = 'johannes@solddirect.co.za';

const RIBBON =
  '0% commission — the banks pay us, not you. No bond in your sale? A simple, upfront 1% — still ~6× less than full service.';

const STEPS = [
  {
    title: 'List on WhatsApp',
    body: 'Answer a few guided questions and add photos. Self-guided on WhatsApp — your listing is live in minutes.',
  },
  {
    title: 'Buyers enquire & pre-qualify',
    body: 'Interested buyers get pre-qualified for a bond right inside the chat, so you only deal with serious offers.',
  },
  {
    title: 'Accept an offer',
    body: 'Compare offers, sign the Offer to Purchase, and hand off to a panel conveyancer — all guided, all tracked.',
  },
  {
    title: 'Tracked to transfer',
    body: 'Follow every stage from bond to Deeds Office registration. Always know exactly where your sale is.',
  },
];

const TIERS = [
  {
    name: 'Free',
    price: 'R0',
    tagline: '0% commission',
    highlight: true,
    points: [
      'Full listing + WhatsApp tools + deal tracker',
      'Syndicated to major property portals',
      'List exclusively for a fixed term and transact via our partners',
    ],
    foot: 'Free because the banks pay us — not you.',
  },
  {
    name: 'Flex',
    price: '1% of sale',
    tagline: 'No lock-in',
    highlight: false,
    points: [
      'Same platform, no exclusivity',
      'No partner requirements',
      'A simple 1% on sale — 6× less than full service',
    ],
    foot: 'For sellers who want freedom over the lowest price.',
  },
];

const ADDONS = [
  {
    title: 'Photography & floor plans',
    body: 'Professional shoots and floor plans that make your listing stand out on the portals.',
  },
  {
    title: 'Featured placement & social campaigns',
    body: 'Boost your listing’s visibility with featured portal placement and targeted social campaigns.',
  },
  {
    title: 'Compliance-certificate coordination',
    body: 'We arrange the electrical, plumbing, gas, electric-fence and beetle certificates your transfer needs.',
  },
];

const OUTCOMES = [
  {
    when: 'Your buyer bonds through our partner (80%+)',
    fee: 'You pay R0',
    why: 'The bank pays us an origination commission — the sale funds itself.',
  },
  {
    when: 'Your buyer pays cash or takes a smaller bond — or you choose Flex, with no exclusivity',
    fee: 'You pay 1%',
    why: 'One simple fee, agreed upfront, only when you sell — R60k on a R6m home, vs ~R414k full service.',
  },
];

const FAQ = [
  {
    q: 'Is it really 0% commission?',
    a: 'Yes — and here is how that is possible. Every property sale already has a bank earning inside it. When your buyer takes a bond of 80% or more through our origination partner and a panel conveyancer handles the transfer (with a fee discount passed to you), the bank pays us an origination commission — so you pay R0. It is not a discount; it is the cost of selling moved off your shoulders and onto the financial ecosystem.',
  },
  {
    q: 'What if my buyer pays cash?',
    a: 'A cash offer is often your best offer — take it. With no bond there is simply no bank in the deal to pay us, so a simple 1% applies instead, agreed upfront in your mandate, never a surprise. On a R6m home that is R60,000 — versus around R414,000 for a typical full-service commission (6% + VAT). Either way, the principle is the same: someone always pays to sell a home, and we make sure it is almost never you.',
  },
  {
    q: 'What does the exclusive mandate involve? Can I cancel?',
    a: 'The free tier uses a fixed-term exclusive mandate with plain-language terms you e-sign on WhatsApp — a proper, regulated instrument handled by our employed, registered property practitioners. Cancellation follows the mandate’s notice terms. Prefer no exclusivity? Flex at 1% is always available.',
  },
  {
    q: 'Are you against estate agents?',
    a: 'Not at all. Estate agents play a valuable role in South African property, and a full-service sale is the right choice for many sellers. We serve the growing group who choose to sell privately and do the work themselves — and we employ registered property practitioners to keep every step compliant.',
  },
  {
    q: 'Is my information safe?',
    a: 'We ask for explicit, timestamped consent before collecting anything, store only what each step needs, encrypt sensitive fields, and never sell your data — POPIA privacy-by-design from the first message. See our privacy notice and compliance page for the full picture.',
  },
];

export default function Home() {
  return (
    <div>
      <div
        role="note"
        className="border-b border-slate-800 bg-slate-900 px-6 py-2 text-center text-sm font-semibold text-emerald-300"
      >
        {RIBBON}
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            Sold <span className="text-emerald-400">Direct</span>
          </span>
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
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
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
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/40"
        />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            Cape Town • WhatsApp-first • 0% commission
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Sell your home direct.{' '}
            <span className="text-emerald-400">Keep your money.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">
            The streamlined way to sell privately — guided end-to-end by our
            technology, concierge team and registered property practitioners,
            with 0% commission on the qualifying path. We get paid by the banks,
            not by you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Join the waitlist
            </a>
            <a
              href="#how"
              className="rounded-lg border border-slate-500 bg-slate-950/60 px-6 py-3 font-semibold text-white backdrop-blur transition hover:border-emerald-400 hover:text-emerald-300"
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
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col justify-between gap-6 sm:col-span-2">
            <p className="max-w-xl text-slate-300">
              Estate agents play a valuable role in South African property, and
              a full-service sale is the right choice for many. Sold Direct is
              built for a different seller: the growing group who want to sell
              privately and do the work themselves. Our technology, WhatsApp
              concierge and registered property practitioners streamline every
              step — so selling direct is simple, safe and fully compliant.
            </p>
            <ul className="grid gap-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span aria-hidden className="text-emerald-400">
                  ✓
                </span>
                You host the viewings and choose the offer — we do the admin,
                paperwork and chasing.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-emerald-400">
                  ✓
                </span>
                A WhatsApp concierge with you from mandate to Deeds Office
                registration.
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-emerald-400">
                  ✓
                </span>
                Your listing on the major property portals from day one.
              </li>
            </ul>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-emerald-300">
                  People + technology, on your side.
                </span>{' '}
                Our team includes registered property practitioners (PPRA, with
                a valid Fidelity Fund Certificate) and a WhatsApp concierge. The
                technology does the admin — our people help you sell, from
                mandate to registration.{' '}
                <Link
                  href="/compliance"
                  className="font-semibold text-emerald-400 underline-offset-2 hover:underline"
                >
                  See how we keep it compliant →
                </Link>
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm text-slate-400">
              Typical full-service commission on a R6m home (5–7% + VAT)
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-300">
              R345k–R483k
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Sold Direct — buyer bonds via our partner
            </p>
            <p className="mt-1 text-4xl font-extrabold text-emerald-400">R0</p>
            <p className="mt-4 text-sm text-slate-400">
              Sold Direct — cash buyer (1%, agreed upfront)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">
              R60k
            </p>
            <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
              Commission pays for a full-service agent. If you handle the
              viewings yourself — with our tools and team behind you — you keep
              it, whichever way your buyer pays.
            </p>
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
              className="rounded-2xl border border-slate-700 bg-slate-950/80 p-6 backdrop-blur"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{step.body}</p>
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
        intro="Follow one Cape Town home from listing to registered sale — consent, guided listing, buyer enquiry, in-chat bond pre-qualification, a binding offer, conveyancing and Deeds Office registration. Press Play, or step through it yourself."
      >
        <div className="mt-8 rounded-3xl bg-white p-4 shadow-2xl sm:p-8">
          <WhatsAppDemo />
        </div>
      </Section>

      {/* Pricing */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        heading="Someone always pays to sell a home. We make sure it's not you."
        intro="Every sale has banks and attorneys earning inside it. When your buyer bonds through our origination partner, the bank pays us — and you pay 0%. When there's no bond in the deal, a simple 1% covers it, agreed upfront in your mandate. Either way, you keep what a full-service commission would have cost."
      >
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {OUTCOMES.map((o) => (
            <div
              key={o.when}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <p className="text-sm text-slate-400">{o.when}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {o.fee}
              </p>
              <p className="mt-1 text-xs text-slate-500">{o.why}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-950'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                  {tier.tagline}
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-white">
                {tier.price}
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-slate-300">
                {tier.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="text-emerald-400">
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400">
                {tier.foot}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Pricing shown is indicative for our Cape Town launch and subject to
          our terms. A genuine alternative is always available.
        </p>
      </Section>

      {/* Add-ons */}
      <Section
        id="addons"
        tone="tinted"
        eyebrow="À la carte"
        heading="Optional add-ons"
        intro="Extras to make your home shine — priced per service, only if you want them."
      >
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ADDONS.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
            >
              <h3 className="font-semibold text-emerald-300">{a.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{a.body}</p>
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
              className="group rounded-2xl border border-slate-800 bg-slate-950 p-5 open:border-emerald-500/40"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-100 marker:content-none">
                <span className="mr-2 text-emerald-400">＋</span>
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-slate-300">{item.a}</p>
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
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Built for Cape Town, from the first listing to registration.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-200 drop-shadow">
              A local, mobile-first way to buy and sell property — designed
              around how South African transfers actually work.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16"
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Be first in Cape Town
          </h2>
          <p className="mt-2 text-slate-300">
            We&apos;re opening up to a first group of sellers and buyers. Join
            the waitlist and we&apos;ll reach out as we go live.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Prefer email?{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500">
          <span>
            © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
          </span>
          <nav className="flex flex-wrap gap-5">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-slate-300"
            >
              {CONTACT_EMAIL}
            </a>
            <Link href="/onepager" className="hover:text-slate-300">
              One-pager
            </Link>
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy notice
            </Link>
            <Link href="/compliance" className="hover:text-slate-300">
              Compliance
            </Link>
          </nav>
        </div>
      </footer>

      <StickyCta />
    </div>
  );
}
