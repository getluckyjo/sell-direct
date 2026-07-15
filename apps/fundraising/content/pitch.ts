// All copy and numbers for the investor pitch page live here so a designer
// restyle only touches components. Figures must match the data room —
// each block cites its source document. Copy follows the positioning
// guardrails in CLAUDE.md (never anti-agent; savings framed neutrally;
// every 0% discloses the qualifying path).

export type Stat = { label: string; value: string; sub?: string };
export type Card = { title: string; body: string };

// source: docs/dataroom/02-capital-and-valuation.md §1
export const RIBBON =
  'Seed round open: R10m for 25% at a R30m pre-money valuation';

// source: docs/dataroom/02-capital-and-valuation.md §1
export const ASK = {
  amount: 'R10m',
  stake: '25%',
  preMoney: 'R30m pre-money',
  badge: 'Raising · R10m seed · 25% · R30m pre-money',
  seriesA:
    'A R50m Series A is modelled at Year 3 as optional — offence, not survival. The seed alone covers the cash trough.',
} as const;

export const HERO = {
  eyebrow: 'Private placement · Cape Town · WhatsApp-first',
  // The AI agent is built and working today (founder-confirmed).
  title: 'We built an AI real-estate agent.',
  titleAccent: 'It powers 0%*-commission private property sales on WhatsApp.',
  sub: 'Sold Direct is a WhatsApp-first platform for South Africans who choose to sell their homes privately. Our AI — trained on 50 years of SA property transaction, legal and bond data — does the admin at near-zero cost, our registered property practitioners assist both parties, and we earn from the banks as bond originators instead of charging the consumer.',
  ctaPrimary: 'Request the data room',
  ctaSecondary: 'See the numbers',
} as const;

// The qualifying-path disclosure that every "0%" refers to.
// source: docs/dataroom/00-assumptions.md §C; 01-financial-model.md §5
export const QUALIFYING_PATH_NOTE =
  '* 0% commission applies on the qualifying path: an exclusive mandate for the agreed term, a qualifying ≥80% bond placed via our origination partner, and a panel conveyancer (with a fee discount passed to the seller). Otherwise a 1% facilitation fee applies.';

// source: docs/dataroom/README.md (AI-lean strategy); founder-confirmed status
export const AI_SECTION = {
  heading: 'The IP: an AI super real-estate agent',
  intro:
    'Our core technology is an AI agent trained on the last 50 years of South African property transactions, conveyancing law and bond data. It is built and working today — not a roadmap item.',
  cards: [
    {
      title: 'Trained on the SA transfer, end to end',
      body: '50 years of property transaction, legal and bond data: OTPs, suspensive conditions, FICA, rates clearance, Deeds Office practice, bank credit patterns. It knows the journey a South African sale actually takes.',
    },
    {
      title: 'It does the admin, at near-zero cost',
      body: 'Guided listing intake, buyer qualification, offer assembly, document chasing, “where is my deal?” — the productivity heavy-lifting that lets a small team run thousands of deals, and the reason 0%* is sustainable rather than a loss-leader.',
    },
    {
      title: 'People stay in the loop',
      body: 'Our employed, registered property practitioners (PPRA, Fidelity Fund Certificates) assist both parties throughout. Technology does the admin; people help you sell. Full-service agents remain a great choice for those who want them.',
    },
    {
      title: 'A structurally lean cost base',
      body: 'The model runs a 50%-AI team — 8 heads in Year 1 scaling to a delivery-realistic 96 by Year 5 — reinvesting the ~88% gross margin into brand marketing instead of headcount.',
    },
  ] satisfies Card[],
} as const;

// source: docs/dataroom/01-financial-model.md §1–2
export const MODEL_SECTION = {
  heading: 'How we earn: the banks pay, not the consumer',
  intro:
    'Selling is free on the qualifying path*. We monetise the financial ecosystem that is already paid in every South African property deal — led by bond origination.',
  originationStep: {
    y1: {
      label: 'Year 1 — BetterBond referral',
      rate: '0.5% of the bond',
      body: 'Qualifying ≥80% bonds are placed via BetterBond, a registered multi-bank originator. The buyer keeps full rate choice across banks; the bank pays the origination referral.',
    },
    y2: {
      label: 'Year 2+ — origination in-house',
      rate: '~1.5% of the bond',
      body: 'We become our own originator, direct with the banks — roughly 3× the referral. Year 1 via BetterBond is the runway to sign bank aggregation agreements and put FAIS/FSP accreditation in place.',
    },
  },
  revenueLines: [
    {
      title: 'Bond origination',
      body: 'The engine. R29k per qualifying deal in Year 1 stepping to ~R78k in Year 2 as origination goes in-house — paid by the bank, not the buyer or seller.',
    },
    {
      title: 'Bank headline sponsorship',
      body: 'An annual platform-sponsorship fee from a featured bank — advertising, not steering. Modelled R3m (Y1) → R8m (Y5).',
    },
    {
      title: 'Conveyancer panel advertising',
      body: 'Fixed annual subscriptions from panel conveyancers — R0.36m → R2.4m. No referral fees (the Legal Practice Council prohibits them); sellers get a 30–40% conveyancing fee discount.',
    },
    {
      title: '1% Flex fee',
      body: 'On cash, sub-80%-bond or non-partner deals a 1% facilitation fee applies — a fraction of what a full-service sale (5–7% + VAT) would have cost, disclosed up front.',
    },
  ] satisfies Card[],
  perDeal:
    'Blended revenue per registered deal: R55.7k (Y1) → R70.6k (Y2, origination in-house) → R52.4k (Y5, price taper).',
} as const;

// source: docs/dataroom/03-market-sizing.md
export const MARKET_SECTION = {
  heading: 'A large market, entered where trust is won',
  intro:
    'We land at prime Cape Town (Atlantic Seaboard, City Bowl, Southern Suburbs, Constantia) where average transacting prices are R6.5m, then broaden into the national upper-market as the brand earns trust — the average tapers to R4.0m by Year 5.',
  stats: [
    {
      label: 'TAM',
      value: 'R6.25bn/yr',
      sub: 'Addressable revenue pool across ~250,000 annual SA transfers',
    },
    {
      label: 'SAM',
      value: 'R1.8bn/yr',
      sub: 'Upper-market (>~R4m): ~35,000 transfers a year',
    },
    {
      label: 'SOM (base, Y5)',
      value: '8.3%',
      sub: 'Of upper-market transactions — 1.16% of all SA transfers',
    },
  ] satisfies Stat[],
  consumer:
    'By Year 5, sellers who choose the self-service path keep ~R733m a year — ~R1.46bn cumulatively — that a full-service sale (6% + VAT benchmark) would have cost. Full-service agents continue to serve the majority who want full service; we serve the segment who choose to do it themselves.',
} as const;

// source: docs/dataroom/01-financial-model.md §3 (base case, CA-reviewed)
export const REVENUE_RAMP = [
  { year: 'Y1', revenue: 6.14, deals: 50 },
  { year: 'Y2', revenue: 20.24, deals: 220 },
  { year: 'Y3', revenue: 46.83, deals: 650, ebitdaPositive: true },
  { year: 'Y4', revenue: 94.72, deals: 1500 },
  { year: 'Y5', revenue: 162.3, deals: 2900 },
] as const;

// source: docs/dataroom/01-financial-model.md, 02-capital-and-valuation.md
export const FIN_SECTION = {
  heading: 'The numbers: capital-efficient by design',
  intro:
    'Five-year base case from the CA-reviewed model (27% tax, delivery-realistic headcount, LPC-prohibited revenue removed). The full workbook lives in the data room.',
  stats: [
    { label: 'Y5 revenue (base)', value: 'R162.3m', sub: 'From R6.1m in Y1' },
    { label: 'EBITDA-positive', value: 'Year 3', sub: '~17% margin by Y5' },
    {
      label: 'Capital to breakeven',
      value: '~R7.5m',
      sub: 'The R10m seed covers the trough — minimum cash +R5.5m',
    },
    {
      label: 'Y5 enterprise value',
      value: 'R649–974m',
      sub: 'At 4–6× revenue (SA-discounted proptech comps)',
    },
    {
      label: 'Modelled seed outcome',
      value: '~16.9×',
      sub: 'On the ~R811m base-case exit (5× Y5 revenue), post-dilution',
    },
    {
      label: 'Gross margin',
      value: '~88%',
      sub: 'COGS built bottom-up, ~12% of revenue',
    },
  ] satisfies Stat[],
  caveat:
    'Illustrative, model-grade projections (CA-reviewed workbook available in the data room under NDA) — not a forecast or guarantee. Key inputs, sources and reliability flags are documented per line.',
} as const;

// source: docs/PROGRESS.md; partnerships founder-confirmed
export const TRACTION_SECTION = {
  heading: 'Built, working, and partnered',
  intro:
    'This is not a concept raise. The product loop and the AI agent are built; the launch partnerships are in motion.',
  shipped: [
    'The AI real-estate agent — built and working today',
    'WhatsApp journey end-to-end: listing → enquiry → consented bond pre-qualification → offer → transfer tracking',
    'Deal state machine for the SA transfer (OTP → bond → FICA → clearance → lodgement → registration)',
    'Internal control-room dashboard; public marketing site with waitlist',
    'Typed end-to-end, automated tests, CI green; POPIA privacy-by-design from commit #1',
  ],
  partners: [
    {
      name: 'BetterBond',
      role: 'Bond origination partner — Year-1 multi-bank referral while we accredit to originate in-house from Year 2.',
    },
    {
      name: 'Loom',
      role: 'Property valuations — data-driven valuation reports for accurate, defensible listing prices.',
    },
    {
      name: 'Capture Media',
      role: 'Listing video and photography — prime-grade media for every mandate.',
    },
    {
      name: 'Paysoft',
      role: 'Technology partner — payments rails, ID verification and senior build capacity; equity vesting against delivery.',
    },
  ],
} as const;

// source: docs/dataroom/02-capital-and-valuation.md §3
export const TEAM_SECTION = {
  heading: 'Team & ownership at inception',
  intro:
    'Two working founders, a committed technology partner, and a reserved seat for a strategic non-executive board member. The seed investor takes 25%.',
  capTable: [
    { holder: 'Johannes — Commercial Director', stake: 30 },
    { holder: 'Dean — COO', stake: 30 },
    { holder: 'Seed investor (R10m)', stake: 25 },
    { holder: 'Paysoft — technology partner (vesting)', stake: 10 },
    { holder: 'Board seat (reserved, non-executive)', stake: 5 },
  ],
  note: 'Paysoft’s stake vests against preferred development rates plus a free-development allocation to an agreed value. Post-optional-Series-A holdings and exit mathematics are in the data room.',
} as const;

// source: docs/dataroom/02-capital-and-valuation.md §1 (Use of Funds tab)
export const ASK_SECTION = {
  heading: 'The ask: R10m for 25%',
  intro:
    'R10m at a R30m pre-money valuation. Bottom-up capital need to self-sustaining is ~R7.5m (base case, incl. buffer) — the raise covers the trough with headroom.',
  useOfFunds: [
    'Cape Town launch + above-the-line brand campaign',
    'The AI-augmented team (concierge + registered practitioners)',
    'In-house origination accreditation (FAIS/FSP + bank aggregation agreements)',
    'Partner and platform integrations (WhatsApp BSP, BetterBond, conveyancers)',
  ],
} as const;

// source: docs/dataroom/02-capital-and-valuation.md §2b — the seed models
// ~16.9× to the base-case exit (~R811m EV at 5× Y5 revenue, post-Series-A
// dilution). The calculator scales that per rand invested; post-money R40m.
export const CALCULATOR = {
  heading: 'What your ticket becomes',
  sub: 'Drag to your investment. Illustrative outcomes from the published base-case model.',
  postMoney: 40_000_000,
  min: 1_000_000,
  max: 10_000_000,
  step: 250_000,
  initial: 2_500_000,
  exitMultiple: 16.9,
  exitLabel: 'Modelled value at the base-case exit (~R811m EV, Y5, post-dilution)',
  caveat:
    'Illustrative only, from the model-grade base case (5× Y5 revenue exit multiple, post-optional-Series-A dilution). Not a forecast, guarantee or offer; early-stage investment carries risk, including loss of capital.',
} as const;

export const FAQ = [
  {
    q: 'Why is 0% commission sustainable?',
    a: 'Because the consumer was never our customer to bill. The bank pays for bond origination in every financed SA property deal — 0.5% of the bond via BetterBond in Year 1, ~1.5% once origination is in-house from Year 2 — and our AI agent keeps the cost of running a deal near zero. On non-qualifying deals a disclosed 1% facilitation fee applies.',
  },
  {
    q: 'Are you against estate agents?',
    a: 'No. Full-service agents play a valuable role and remain a great choice for the majority who want full service. We serve the segment who choose to sell privately and do the work themselves — and our own team includes employed, registered property practitioners (PPRA, Fidelity Fund Certificates) who assist both parties. Complementary to the industry, not adversarial.',
  },
  {
    q: 'What exactly is the AI agent?',
    a: 'An AI trained on the last 50 years of South African property transaction, legal and bond data. It runs listing intake, buyer qualification, offer assembly and transfer tracking over WhatsApp — the admin of a sale — while registered practitioners handle the human side. It is built and working today; it is the productivity engine, not a replacement for the licensed people in the deal.',
  },
  {
    q: 'Is the conveyancer revenue line legal?',
    a: 'Yes — it is designed around the Legal Practice Council rules. Attorneys may not pay referral fees, so there are none: panel conveyancers pay fixed annual advertising subscriptions (volume-independent), and sellers who use the panel receive a 30–40% conveyancing fee discount.',
  },
  {
    q: 'What about Purplebricks?',
    a: 'The cautionary comp we manage against. Purplebricks was destroyed by marketing-led customer-acquisition costs and over-expansion. We land at prime Cape Town where demand is referral- and reputation-driven (the cheapest customers), broaden down-market only as the brand earns trust, and run an AI-lean cost base with delivery-realistic headcount in the model.',
  },
  {
    q: 'What are the main risks?',
    a: 'Three we flag before investors do: the Year-2 in-house origination step-up needs bank aggregation agreements and FAIS/FSP accreditation (Year 1 via BetterBond is the de-risking runway); the marketing-to-deals conversion is the central growth assumption, validated with a Cape Town pilot before scale; and the upper-market pool estimate (~35,000 transfers/yr) still needs primary confirmation. All are documented with sources in the data room.',
  },
  {
    q: 'What exactly am I buying?',
    a: 'A 25% stake in Sold Direct for R10m at a R30m pre-money valuation, alongside two working founders (30% each), Paysoft as vesting technology partner (10%) and a reserved non-executive board seat (5%). Full terms, the CA-reviewed model and the cap table are in the data room, under NDA.',
  },
] as const;

export const NEXT_STEPS = [
  'Request access — we review and share the data room under NDA',
  'Work through the CA-reviewed model, assumptions and cap table',
  'Meet the founders and see the live WhatsApp product',
  'Reserve your allocation in the R10m round',
] as const;

export const DEMO_SECTION = {
  heading: 'The product, end to end.',
  intro:
    'One Cape Town home from listing to registered sale — and every point where we earn from the financial ecosystem instead of the consumer. Press Play, or step through it.',
} as const;

export const ACCESS_SECTION = {
  heading: 'Investor data room',
  intro:
    'The CA-reviewed model workbook, full assumptions with sources, cap table, scenarios and partner terms are shared under NDA. Request access and we’ll be in touch.',
} as const;

// Not an offer to the public; private placement only.
export const DISCLAIMER =
  'This page is informational only. It is not an offer of securities to the public, nor a solicitation to invest, and any investment opportunity is available by private placement to selected investors only (Companies Act, 2008). Nothing here constitutes financial, legal or tax advice (FAIS). All projections are illustrative, model-grade and unaudited; actual results may differ materially. Detailed financials, the cap table and partner terms are shared under NDA. Personal information submitted via this page is processed in accordance with POPIA.';

export const NAV = [
  { href: '#ai', label: 'The AI' },
  { href: '#model', label: 'Revenue' },
  { href: '#market', label: 'Market' },
  { href: '#financials', label: 'Financials' },
  { href: '#traction', label: 'Traction' },
  { href: '#team', label: 'Team' },
  { href: '#ask', label: 'The ask' },
  { href: '#faq', label: 'FAQ' },
  { href: '#demo', label: 'Demo' },
] as const;
