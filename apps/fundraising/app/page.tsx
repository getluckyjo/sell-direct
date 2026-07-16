import Image from 'next/image';
import Link from 'next/link';
import { InvestorForm } from '@/components/InvestorForm';
import { WhatsAppDemo } from '@/components/WhatsAppDemo';

const CONTACT_EMAIL = 'invest@solddirect.co.za';

const STATS = [
  {
    value: '~R350bn',
    label: 'SA residential transfers per year',
    sub: '~250,000 transactions (Lightstone, 2024)',
  },
  {
    value: '~R24bn',
    label: 'paid in full-service commission annually',
    sub: 'the value pool around the private-sale segment',
  },
  {
    value: 'R52–71k',
    label: 'revenue per registered deal (model)',
    sub: 'earned from the financial ecosystem — not the consumer',
  },
];

const OPPORTUNITY = [
  {
    title: 'A large, underserved segment',
    body: 'A growing group of South African sellers want to sell privately and do the work themselves — but no one has built them a streamlined, compliant way to do it. Full-service agents keep serving those who want full service; we serve the rest.',
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
    title: 'People + technology',
    body: 'A hybrid model: software does the admin — offer, FICA, bond hand-off, “where is my deal?” — while our employed, registered property practitioners and concierge assist both parties. PPRA-compliant by design.',
  },
  {
    title: 'A revenue stack',
    body: 'A core financial-services revenue engine, premium à-la-carte services, and a low-fee tier as a hedge — diversified from day one.',
  },
];

const STATUS = [
  {
    title: 'Product: built and working',
    body: 'The WhatsApp loop is live in development — guided listing intake, buyer enquiry, bond pre-qualification hand-off, structured offers and a deal tracker through every SA transfer stage, with an internal dashboard. The demo below is the real journey.',
  },
  {
    title: 'Partners: in progress',
    body: 'Referral terms with our bond originator (ooba) and panel-conveyancer subscriptions are being formalised as letters of intent; bank headline-sponsorship conversations follow the pilot.',
  },
  {
    title: 'Next: the Cape Town pilot',
    body: 'Launch in prime Cape Town (Atlantic Seaboard, City Bowl, Southern Suburbs, Constantia) to validate listing demand and marketing conversion before any scaled spend.',
  },
];

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  photo?: string; // drop a file in /public/team and set e.g. '/team/johannes.jpg'
};

const FOUNDERS: TeamMember[] = [
  {
    name: 'Johannes le Roux',
    role: 'Co-founder · Commercial Director',
    initials: 'JR',
    bio: 'Leads the commercial side of Sold Direct: the partner ecosystem (bond origination, conveyancer panel, bank sponsorship), go-to-market for the Cape Town launch, and the raise. Builds the relationships the revenue model runs on.',
  },
  {
    name: 'Dean Kruger',
    role: 'Co-founder · COO',
    initials: 'DK',
    bio: 'Leads operations: the WhatsApp concierge, our employed registered property practitioners (PPRA, Fidelity Fund Certificates), and the deal pipeline from mandate to Deeds Office registration — the machinery that keeps every transfer moving.',
  },
];

const PARTNERS: TeamMember[] = [
  {
    name: 'Paysoft',
    role: 'Technology partner',
    initials: 'PS',
    bio: 'Builds and scales the platform under a vesting technology-partner stake — preferred development rates plus a committed free-development allocation.',
  },
  {
    name: 'Jan le Roux',
    role: 'Board · non-executive',
    initials: 'JL',
    bio: 'Non-executive board member providing governance and industry oversight from inception.',
  },
];

const RAISE_USES = [
  'Cape Town launch and the first brand campaign',
  'AI-augmented concierge and practitioner team',
  'Bond-origination accreditation (FAIS/FSP) and bank aggregation agreements',
  'Platform build-out: portals syndication, e-sign, FICA integrations',
];

const NOT_PURPLEBRICKS = [
  {
    title: 'Revenue from finance, not consumer fees',
    body: 'Purplebricks and the SA hybrid casualties (PropertyFox, HouseME) sold discounted fees to consumers. We earn from bond origination, sponsorship and panel subscriptions — the parties that already pay to be in every deal.',
  },
  {
    title: 'Prime-first means referral-led CAC',
    body: 'Purplebricks died of marketing-led customer acquisition. We land in prime Cape Town, where demand is reputation- and referral-driven, and only broaden down-market once the brand has earned trust.',
  },
  {
    title: 'Breakeven inside the seed',
    body: 'The model reaches EBITDA-positive in Year 3 with the seed alone covering the cash trough. Scaled marketing spend is gated on pilot conversion data — growth is offence, not survival.',
  },
  {
    title: 'A single-digit share is enough',
    body: 'The base case needs ~8% of the upper-market segment by Year 5 — not a land-grab of the whole market. The plan works well below the base case.',
  },
];

const FAQ = [
  {
    q: 'If it’s 0% commission, how does Sold Direct make money?',
    a: 'From the financial ecosystem around every deal: the bank-paid bond origination commission (via our originator partner in Year 1, in-house thereafter), a bank headline sponsorship, fixed conveyancer panel-advertising subscriptions (never per-deal referral fees — the Legal Practice Council prohibits those), and optional add-ons like photography and compliance coordination.',
  },
  {
    q: 'What happens if the buyer pays cash on the free tier?',
    a: 'The 0% applies to the qualifying path: a bond of 80% or more placed through our originator, with a panel conveyancer handling transfer. On a cash sale, a smaller bond, or a non-partner deal, a disclosed 1% facilitation fee applies — agreed upfront in the mandate, and still roughly six times less than a typical full-service commission (6% + VAT).',
  },
  {
    q: 'What does the 90-day sole mandate involve? Can a seller cancel?',
    a: 'The free tier requires listing exclusively with us for 90 days, under a proper PPRA-compliant mandate handled by our employed, registered practitioners. Cancellation follows the mandate’s notice terms. Sellers who want no exclusivity choose Flex at 1% of the sale price.',
  },
  {
    q: 'Are you competing with estate agents?',
    a: 'No. Full-service agents remain the right choice for the majority who want full service — and we employ registered property practitioners ourselves. We serve the segment who choose to sell privately and do the work themselves, with technology and people supporting them.',
  },
  {
    q: 'Aren’t you dependent on WhatsApp and the portals?',
    a: 'WhatsApp is our distribution advantage, accessed through a swappable business-service-provider layer rather than a single vendor integration. Listings syndicate to Property24 and Private Property and carry their own shareable WhatsApp links, so demand generation is multi-channel from day one.',
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
          <nav className="flex items-center gap-4">
            <Link
              href="/onepager"
              className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block"
            >
              One-pager
            </Link>
            <a
              href="#access"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Request access
            </a>
          </nav>
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
            Pre-launch • Cape Town • Raising a R10m seed
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Back the platform powering{' '}
            <span className="text-emerald-400">private property sales</span> in
            South Africa.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">
            Sold Direct is a WhatsApp-first platform that streamlines selling
            direct. 0% commission to buyers and sellers on the qualifying path —
            we earn from the financial ecosystem around every deal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#access"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Request the investor data room
            </a>
            <Link
              href="/onepager"
              className="rounded-lg border border-slate-600 bg-slate-950/60 px-6 py-3 font-semibold text-slate-100 backdrop-blur transition hover:border-slate-400"
            >
              View the one-pager
            </Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.value}>
              <p className="text-3xl font-extrabold text-emerald-400">
                {s.value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {s.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Opportunity */}
      <section className="border-b border-slate-800 bg-slate-900/40">
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

      {/* City banner */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/cape-town-city.jpg"
          alt="Aerial view of Cape Town, Table Mountain and the Atlantic seaboard"
          width={2000}
          height={1333}
          sizes="100vw"
          className="h-[26rem] w-full object-cover saturate-[1.15] contrast-[1.04] sm:h-[34rem]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl">
              A multi-billion-rand market, starting with Cape Town.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-200 drop-shadow">
              High-value homes, near-universal WhatsApp adoption, and a finance
              ecosystem that already pays to be in every deal.
            </p>
          </div>
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
              High-value Cape Town homes, where the self-service saving is
              largest.
            </li>
          </ul>
        </div>
      </section>

      {/* Where we are */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Where we are</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STATUS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 p-6"
            >
              <h3 className="font-semibold text-emerald-300">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive journey */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
            See it work · interactive
          </p>
          <h2 className="text-2xl font-bold sm:text-3xl">
            The product, end to end.
          </h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            One Cape Town home from listing to registered sale — and every point
            where we earn from the financial ecosystem instead of the consumer.
            Press <span className="font-semibold text-white">Play</span>, or
            step through it.
          </p>
          <div className="mt-8 rounded-3xl bg-white p-4 shadow-2xl sm:p-8">
            <WhatsAppDemo />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">The team</h2>
        <p className="mt-2 max-w-2xl text-slate-300">
          Two working founders, a committed technology partner and independent
          board oversight — in place from inception.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {FOUNDERS.map((m) => (
            <div
              key={m.name}
              className="flex gap-5 rounded-2xl border border-slate-800 bg-slate-950 p-6"
            >
              {m.photo ? (
                <Image
                  src={m.photo}
                  alt={m.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                  {m.initials}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white">{m.name}</h3>
                <p className="text-sm font-medium text-emerald-300">{m.role}</p>
                <p className="mt-2 text-sm text-slate-300">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {PARTNERS.map((m) => (
            <div
              key={m.name}
              className="flex gap-4 rounded-2xl border border-slate-800 p-5"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-slate-300">
                {m.initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{m.name}</h3>
                <p className="text-xs font-medium text-emerald-300">{m.role}</p>
                <p className="mt-1 text-xs text-slate-400">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The raise */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">The raise</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <p className="text-4xl font-extrabold text-emerald-400">
                R10m seed
              </p>
              <p className="mt-2 text-sm text-slate-300">
                A single round to reach self-sustaining. The model turns
                EBITDA-positive in Year 3, and the seed alone covers the cash
                trough — a later Series A is optional fuel on a proven engine,
                not survival.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Full financial model, scenarios, valuation and cap table in the
                data room.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 p-6">
              <h3 className="font-semibold text-white">Use of funds</h3>
              <ul className="mt-3 grid gap-2 text-sm text-slate-300">
                {RAISE_USES.map((u) => (
                  <li key={u} className="flex gap-3">
                    <span aria-hidden className="text-emerald-400">
                      →
                    </span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why this isn't Purplebricks */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Why this isn&apos;t Purplebricks
        </h2>
        <p className="mt-2 max-w-2xl text-slate-300">
          Low-fee property models have failed before — Purplebricks most
          famously. We designed against the failure modes deliberately.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {NOT_PURPLEBRICKS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 p-6"
            >
              <h3 className="font-semibold text-emerald-300">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Questions investors ask
          </h2>
          <div className="mt-8 grid gap-4">
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
          <p className="mt-6 text-sm text-slate-400">
            Prefer email?{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-4 text-xs text-slate-500">
            This page is informational only and is not an offer or solicitation
            to invest. Nothing here constitutes financial advice.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
            Confidential — do not distribute.
          </p>
          <nav className="flex gap-5">
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
