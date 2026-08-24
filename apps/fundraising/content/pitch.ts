// All copy and numbers for the investor pitch page live here so a designer
// restyle only touches components. Figures must match the data room —
// each block cites its source document. Copy follows the positioning
// guardrails in CLAUDE.md (never anti-agent; savings framed neutrally;
// every 0% resolves to the qualifying-path note) and is written for a
// 60-second investor skim: numbers lead, prose supports.

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
  title: 'Invest in the future of real estate.',
  // The 0%* token is rendered between these two parts as a tap-to-resolve note.
  titleAccentPre: '',
  titleAccentPost: '-commission private sales, on WhatsApp.',
  sub: 'Trained on 50 years of South African property, legal and bond data, it does the admin of a sale at near-zero cost. We earn from the banks as bond originators — not from the consumer.',
  ctaPrimary: 'Request the data room',
  ctaSecondary: 'See the numbers',
  summaryAnchor: '60-second summary ↓',
} as const;

// The one-sentence resolution behind every 0%* (tooltip copy).
export const QUALIFYING_TOOLTIP =
  '0% applies on the qualifying path: exclusive mandate + ≥80% bond via our origination partner. Otherwise a 1% flex fee applies.';

// Full wording, rendered in the footer (verbatim — do not edit).
// source: docs/dataroom/00-assumptions.md §C; 01-financial-model.md §5
export const QUALIFYING_PATH_NOTE =
  '* 0% commission applies on the qualifying path: an exclusive mandate for the agreed term, a qualifying ≥80% bond placed via our origination partner, and a panel conveyancer (with a fee discount passed to the seller). Otherwise a 1% facilitation fee applies.';

// The deal at a glance — the most important element on the page.
// source: docs/dataroom/README.md headlines; 01/02 dataroom docs
export const SUMMARY_STRIP = [
  { label: 'Raising', value: 'R10m for 25%', sub: 'R30m pre-money' },
  {
    label: 'Y5 revenue (base case)',
    value: 'R162.3m',
    sub: 'From R6.1m in Y1',
  },
  { label: 'Gross margin', value: '~88%', sub: 'COGS ~12%, built bottom-up' },
  {
    label: 'Modelled seed return',
    value: '~16.9×',
    sub: 'Base case, post-dilution',
  },
  {
    label: 'Status',
    value: 'Built & working',
    sub: 'AI agent + WhatsApp loop live',
  },
] satisfies Stat[];

// source: docs/dataroom/README.md (AI-lean strategy); founder-confirmed status
export const AI_SECTION = {
  heading: 'One AI does the work of an agency.',
  intro:
    'Built. Working. Trained on 50 years of South African property, conveyancing and bond data. Not a roadmap item — the IP you’re buying into.',
  cards: [
    {
      title: 'Knows the SA transfer, end to end',
      body: 'Offers to purchase (OTPs), suspensive conditions, Financial Intelligence Centre Act (FICA) checks, rates clearance, the Deeds Office — South Africa’s central property registry — and bank credit patterns.',
    },
    {
      title: 'Does the admin at near-zero cost',
      body: 'Listing intake, buyer qualification, offer assembly, document chasing, “where is my deal?” — the reason 0%* is sustainable, not a loss-leader.',
    },
    {
      title: 'People stay in the loop',
      body: 'Our employed practitioners — registered with the Property Practitioners Regulatory Authority (PPRA), holding Fidelity Fund Certificates — assist both parties. Full-service agents remain a great choice for those who want them.',
    },
    {
      title: 'A structurally lean cost base',
      body: 'The model runs a 50%-AI team: 8 heads in Year 1 to a delivery-realistic 96 by Year 5, reinvesting the ~88% gross margin into brand.',
    },
  ] satisfies Card[],
} as const;

// source: docs/dataroom/01-financial-model.md §1–2
export const MODEL_SECTION = {
  heading: 'The banks pay us. Not the consumer.',
  // Rendered around the 0%* tooltip token: pre + 0%* + post.
  introPre: 'Selling costs the consumer ',
  introPost:
    ' on the qualifying path. We monetise the financial ecosystem already paid in every South African property deal.',
  originationStep: {
    y1: {
      label: 'Year 1 — BetterBond referral',
      rate: '0.5% of the bond',
      body: 'Qualifying ≥80% bonds placed via BetterBond, a registered multi-bank originator. The buyer keeps full rate choice; the bank pays.',
    },
    y2: {
      label: 'Year 2+ — origination in-house',
      rate: '~1.5% of the bond',
      body: 'We become our own originator, direct with the banks — roughly 3× the referral.',
    },
  },
  revenueLines: [
    {
      title: 'Bond origination',
      body: 'The engine: R29k per qualifying deal in Year 1, ~R78k in Year 2 once in-house — paid by the bank.',
    },
    {
      title: 'Bank headline sponsorship',
      body: 'Annual platform sponsorship from a featured bank — advertising, not steering. R3m (Y1) → R8m (Y5).',
    },
    {
      title: 'Conveyancer panel advertising',
      body: 'Fixed annual subscriptions, R0.36m → R2.4m. No referral fees — the Legal Practice Council (LPC) prohibits them; sellers get a 30–40% fee discount.',
    },
    {
      title: '1% Flex fee',
      body: 'On cash, sub-80%-bond or non-partner deals — a fraction of what a full-service sale (5–7% + VAT) would have cost, disclosed up front.',
    },
  ] satisfies Card[],
  perDeal: {
    heading: 'Blended revenue per registered deal',
    rows: [
      { year: 'Y1', value: 'R55.7k', note: 'BetterBond referral' },
      { year: 'Y2', value: 'R70.6k', note: 'Origination in-house' },
      { year: 'Y5', value: 'R52.4k', note: 'Price taper' },
    ],
    // Why it dips: mix shift, not weakening economics.
    explainer:
      'It dips by Year 5 because the average transacting price deliberately tapers (R6.5m → R4.0m) as we broaden from prime into the wider upper-market — a mix shift, priced into the model.',
  },
} as const;

// source: docs/dataroom/03-market-sizing.md
export const MARKET_SECTION = {
  heading: 'A R6.25bn-a-year market. We enter at the top.',
  intro:
    'The portals sell private sellers a flat-fee listing (R499\u2013R4,999) — Property24\u2019s own private tiers prove the demand — but a listing is not a sale: pricing, viewings, the offer, bond, FICA and transfer stay on the seller. Sold Direct runs that whole journey with registered practitioners at 0% on the qualifying path, distributed through the portals as an agency-grade feed \u2014 a wholesale partner to the portals, not a competitor. We land at prime Cape Town (average transacting price R6.5m), then broaden into the national upper-market — tapering to R4.0m by Year 5.',
  stats: [
    {
      label: 'TAM',
      value: 'R6.25bn/yr',
      sub: 'Addressable revenue across ~250,000 annual SA transfers',
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
    'By Year 5 our sellers keep ~R733m a year — ~R1.46bn cumulatively — that a full-service sale (6% + VAT benchmark) would have cost. Full-service agents keep serving the majority who want full service; we serve those who choose to sell themselves.',
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
  heading: 'R6.1m to R162.3m in five years. Reviewed, not dreamed.',
  intro:
    'The base case from the chartered-accountant-reviewed model: 27% tax, delivery-realistic headcount, LPC-prohibited revenue removed. Full workbook in the data room.',
  stats: [
    {
      label: 'EBITDA-positive',
      value: 'Year 3',
      sub: 'Cash low-point ≈ −R4.5m (Y2)',
    },
    {
      label: 'EBITDA margin by Y5',
      value: '~17%',
      sub: 'Deliberately conservative',
    },
    {
      label: 'Capital to breakeven',
      value: '~R7.5m',
      sub: 'The R10m seed covers the trough — minimum cash +R5.5m',
    },
    {
      label: 'Gross margin',
      value: '~88%',
      sub: 'COGS built bottom-up, ~12% of revenue',
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
  ] satisfies Stat[],
  caveat:
    'Illustrative, model-grade projections (CA-reviewed workbook available in the data room under NDA) — not a forecast or guarantee. Key inputs, sources and reliability flags are documented per line.',
} as const;

// source: docs/PROGRESS.md; partnerships founder-confirmed
export const TRACTION_SECTION = {
  heading: 'Not a concept. A working product.',
  intro:
    'The loop runs today — list, qualify, offer, transfer — and the launch partnerships are signed up or in motion.',
  shipped: [
    'WhatsApp journey end-to-end: listing → enquiry → consented bond pre-qualification → offer → transfer tracking',
    'Deal state machine for the SA transfer: offer to purchase (OTP) → bond → FICA → clearance → lodgement → registration',
    'Internal control-room dashboard; public marketing site with waitlist',
    'Typed end-to-end, automated tests, CI green; privacy-by-design under the Protection of Personal Information Act (POPIA)',
  ],
  partners: [
    { name: 'BetterBond', role: 'Bond origination (Y1 referral)' },
    { name: 'Loom', role: 'Property valuations' },
    { name: 'Capture Media', role: 'Listing video & photography' },
    { name: 'Paysoft', role: 'Technology partner (vesting equity)' },
  ],
} as const;

// source: docs/dataroom/02-capital-and-valuation.md §3
export const TEAM_SECTION = {
  heading: 'The people behind the platform',
  intro:
    'Two working founders, a technology partner carrying the CTO function, and a reserved seat for strategic weight. Full cap table and terms are in the data room.',
  // photo: drop a headshot at public/team/<file>.jpg and set it here —
  // the card falls back to branded initials until then.
  people: [
    {
      name: 'Johannes le Roux',
      role: 'Co-founder · Marketing Director',
      initials: 'JR',
      bio: 'Property Studies at UCT. Built and sold three consumer brands, and now leads brand, growth and the seller funnel — the seed’s biggest spend, run by a founder who has done it with his own companies.',
    },
    {
      name: 'Dean',
      role: 'Co-founder · Managing Director',
      initials: 'D',
      bio: 'Architecture at UCT. A proven commercial architect — lead on the Babylonstoren development, one of the Cape’s landmark estates. Runs delivery, partnerships and the transfer operation.',
    },
    {
      name: 'Paysoft',
      role: 'Technology Partner · CTO function',
      initials: 'PS',
      bio: 'Carries the CTO role: engineering delivery of the AI agent and the WhatsApp platform at preferred development rates, with equity vesting only as that value is delivered.',
    },
    {
      name: 'Board seat',
      role: 'Reserved · Non-executive',
      initials: '+',
      bio: 'A reserved allocation for a strategic non-executive director — property, banking or consumer-brand weight to open doors ahead of the Series A.',
    },
  ],
} as const;

// source: docs/dataroom/02-capital-and-valuation.md §1–2 (Use of Funds tab)
export const ASK_SECTION = {
  heading: 'R10m for 25%. Modelled at ~16.9×.',
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
  exitLabel:
    'Modelled value at the base-case exit (~R811m EV, Y5, post-dilution)',
  caveat:
    'Illustrative only, from the model-grade base case (5× Y5 revenue exit multiple, post-optional-Series-A dilution). Not a forecast, guarantee or offer; early-stage investment carries risk, including loss of capital.',
} as const;

export const FAQ = [
  {
    q: 'Why is 0% commission sustainable?',
    a: 'Because the bank pays us, not the consumer. Origination earns 0.5% of the bond via BetterBond in Year 1 and ~1.5% in-house from Year 2, while the AI keeps the cost of running a deal near zero. Non-qualifying deals pay a disclosed 1% fee.',
  },
  {
    q: 'Are you against estate agents?',
    a: 'No — we are complementary, not adversarial. Full-service agents remain a great choice for the majority who want full service; we serve sellers who choose to do it themselves, assisted by our own employed, PPRA-registered practitioners.',
  },
  {
    q: 'What exactly is the AI agent?',
    a: 'An AI trained on 50 years of SA property transaction, legal and bond data — built and working today. It runs listing intake, buyer qualification, offer assembly and transfer tracking on WhatsApp; registered practitioners handle the human side of every deal.',
  },
  {
    q: 'Is the conveyancer revenue line legal?',
    a: 'Yes — it is designed around Legal Practice Council (LPC) rules. Attorneys pay no referral fees; panel firms pay fixed annual advertising subscriptions, and sellers who use the panel get a 30–40% conveyancing fee discount.',
  },
  {
    q: 'What about Purplebricks?',
    a: 'It is the cautionary comp we manage against. Purplebricks died of marketing-led acquisition costs and over-expansion; we land at prime Cape Town where demand is referral-driven, broaden only as the brand earns trust, and run an AI-lean cost base with delivery-realistic headcount.',
  },
  {
    q: 'What are the main risks?',
    a: 'Three, flagged before you find them: the Year-2 in-house origination step-up needs FAIS/FSP accreditation and bank aggregation agreements (Year 1 via BetterBond is the runway); marketing-to-deals conversion is the central growth assumption, validated with a Cape Town pilot; and the ~35,000/yr upper-market pool estimate needs primary confirmation. All documented with sources in the data room.',
  },
  {
    q: 'What exactly am I buying?',
    a: '25% of Sold Direct for R10m at a R30m pre-money valuation — alongside two working founders (30% each), Paysoft as vesting technology partner (10%) and a reserved non-executive board seat (5%). Full terms, the CA-reviewed model and the cap table are in the data room, under NDA.',
  },
] as const;

export const NEXT_STEPS = [
  'Request access — the data room opens under NDA',
  'Work through the CA-reviewed model and cap table',
  'Meet the founders; see the live WhatsApp product',
  'Reserve your allocation in the R10m round',
] as const;

export const DEMO_SECTION = {
  heading: 'The product, end to end.',
  intro:
    'One Cape Town home from listing to registered sale — and every point where the financial ecosystem pays instead of the consumer. Press Play, or step through it.',
} as const;

export const ACCESS_SECTION = {
  heading: 'Everything is in the data room.',
  intro:
    'The CA-reviewed model workbook, full assumptions with sources, cap table, scenarios and partner terms — shared under NDA.',
  reassurance:
    'We reply within one business day. NDA covers detailed financials, cap table and partner terms.',
} as const;

// Not an offer to the public; private placement only. (Verbatim — do not edit.)
export const DISCLAIMER =
  'This page is informational only. It is not an offer of securities to the public, nor a solicitation to invest, and any investment opportunity is available by private placement to selected investors only (Companies Act, 2008). Nothing here constitutes financial, legal or tax advice (FAIS). All projections are illustrative, model-grade and unaudited; actual results may differ materially. Detailed financials, the cap table and partner terms are shared under NDA. Personal information submitted via this page is processed in accordance with POPIA.';

export const NAV = [
  { href: '#ai', label: 'Product' },
  { href: '#model', label: 'Revenue' },
  { href: '#market', label: 'Market' },
  { href: '#financials', label: 'Financials' },
  { href: '#traction', label: 'Traction' },
  { href: '#team', label: 'Team' },
  { href: '#ask', label: 'The Raise' },
] as const;
