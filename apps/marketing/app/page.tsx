import { WaitlistForm } from '@/components/WaitlistForm';

const STEPS = [
  {
    title: 'List on WhatsApp',
    body: 'Answer a few guided questions and add photos. Your listing is live in minutes — no agent visit needed.',
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
    price: 'Low flat fee',
    tagline: 'No lock-in',
    highlight: false,
    points: [
      'Same platform, no exclusivity',
      'Use your own bank or attorney',
      'Still far cheaper than traditional commission',
    ],
    foot: 'For sellers who want freedom over the lowest price.',
  },
  {
    name: 'Add-ons',
    price: 'Per service',
    tagline: 'À la carte',
    highlight: false,
    points: [
      'Professional photography & floor plans',
      'Featured placement & social campaigns',
      'Compliance-certificate coordination',
    ],
    foot: 'Optional extras to make your home shine.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            Sell<span className="text-emerald-600">Direct</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a href="#how" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <a
              href="#waitlist"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Join waitlist
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          Cape Town • WhatsApp-first • 0% commission
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Sell your home.{' '}
          <span className="text-emerald-600">Keep your money.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          0% commission for buyers and sellers. We get paid by the banks, not by
          you — and you manage the whole sale from WhatsApp, all the way to
          transfer.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#waitlist"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Join the waitlist
          </a>
          <a
            href="#how"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Commission is the biggest, most resented cost in a sale.
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              On an average Cape Town home, traditional estate-agent commission
              of 5–7.5% plus VAT takes a six-figure bite out of the
              seller&apos;s pocket — for work many sellers feel they could
              partly do themselves.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Typical agent commission</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-400 line-through">
              R120k–R215k
            </p>
            <p className="mt-4 text-sm text-slate-500">With Sell Direct</p>
            <p className="mt-1 text-4xl font-extrabold text-emerald-600">R0</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
        <p className="mt-2 text-slate-600">
          A guided, digital version of the South African property journey —
          start to registration.
        </p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-slate-200 p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Conditional 0% — with options
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            It&apos;s free when you list exclusively and transact through our
            partner ecosystem. Want freedom instead? The Flex tier is still the
            cheapest credible option in the market.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  tier.highlight
                    ? 'border-emerald-300 bg-white ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    {tier.tagline}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-extrabold">{tier.price}</p>
                <ul className="mt-4 grid gap-2 text-sm text-slate-600">
                  {tier.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden className="text-emerald-600">
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  {tier.foot}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Pricing shown is indicative for our Cape Town launch and subject to
            our terms. A genuine alternative is always available.
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Be first in Cape Town
          </h2>
          <p className="mt-2 text-slate-600">
            We&apos;re opening up to a first group of sellers and buyers. Join
            the waitlist and we&apos;ll reach out as we go live.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Sell Direct. Cape Town, South Africa.
          </span>
          <span>
            0% commission · POPIA-compliant · We handle your data with care.
          </span>
        </div>
      </footer>
    </div>
  );
}
