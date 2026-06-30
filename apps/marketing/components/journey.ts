// The Sold Direct consumer journey, scripted as a WhatsApp conversation.
// Used by the interactive demo (app/demo) to show team & investors the full
// South African flow: profile → listing → enquiry → bond pre-qual → offer →
// conveyancing → registration. All names, prices and figures are illustrative.

export type TrackerStage = { key: string; label: string };

// Mirrors the deal state machine in apps/api (modules/deals), with a "Listing"
// phase prepended for the pre-enquiry seller steps.
export const TRACKER: TrackerStage[] = [
  { key: 'listing', label: 'Listing' },
  { key: 'enquiry', label: 'Enquiry' },
  { key: 'offer', label: 'Offer (OTP)' },
  { key: 'bond', label: 'Bond' },
  { key: 'documents', label: 'Docs & FICA' },
  { key: 'clearance', label: 'Clearance' },
  { key: 'lodgement', label: 'Lodgement' },
  { key: 'registered', label: 'Registered' },
];

export type Chapter = { n: number; title: string; participant: string };

export const CHAPTERS: Chapter[] = [
  { n: 1, title: 'List in minutes', participant: 'Maria · Seller' },
  { n: 2, title: 'Enquire & get bond-ready', participant: 'John · Buyer' },
  { n: 3, title: 'Offer to Purchase', participant: 'John · Buyer' },
  { n: 4, title: 'Bond, legal & transfer', participant: 'Conveyancing' },
];

export type Tag = 'POPIA' | 'Finance' | 'Legal' | 'Revenue' | 'Product';

export type Note = { tag: Tag; title: string; body: string };

export type ChecklistItem = { label: string; sub?: string; role?: string };

export type ListingData = {
  photo: string;
  address: string;
  suburb: string;
  price: string;
  beds: number;
  baths: number;
  erf: string;
  type: string;
};

export type PrequalData = {
  amount: string;
  rate: string;
  deposit: string;
  monthly: string;
  term: string;
};

export type OtpData = {
  price: string;
  deposit: string;
  bondRequired: string;
  occupation: string;
  conditions: string[];
};

export type StatusData = {
  title: string;
  lines: string[];
  tone: 'good' | 'info' | 'win';
};

export type From = 'bot' | 'seller' | 'buyer' | 'system';
export type Kind =
  | 'text'
  | 'system'
  | 'image'
  | 'listing'
  | 'prequal'
  | 'otp'
  | 'status'
  | 'checklist';

export type Scene = {
  chapter: number;
  track: number; // index into TRACKER
  from: From;
  kind: Kind;
  text?: string;
  src?: string;
  caption?: string;
  listing?: ListingData;
  prequal?: PrequalData;
  otp?: OtpData;
  status?: StatusData;
  checklistTitle?: string;
  checklist?: ChecklistItem[];
  note?: Note;
};

const LISTING: ListingData = {
  photo: '/cape-town-hero.jpg',
  address: '23 Vredehoek Avenue',
  suburb: 'Vredehoek, Cape Town',
  price: 'R3 950 000',
  beds: 3,
  baths: 2,
  erf: '495 m²',
  type: 'House',
};

export const SCENES: Scene[] = [
  // ───────────────────────── Chapter 1 — Seller lists ─────────────────────────
  {
    chapter: 1,
    track: 0,
    from: 'system',
    kind: 'system',
    text: 'Maria taps “List my home” on solddirect.co.za — it opens WhatsApp. No app to install.',
    note: {
      tag: 'Product',
      title: 'WhatsApp is the front door',
      body: 'No download, no portal login. Sellers start in the channel they already use every day — the core of our distribution advantage.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'text',
    text: '👋 Welcome to Sold Direct — sell your home with 0% commission. Before we start, do you consent to us processing your personal details to help you sell, under POPIA?',
    note: {
      tag: 'POPIA',
      title: 'Consent captured first',
      body: 'Explicit, timestamped consent is recorded before any personal data is collected — privacy-by-design from the first message.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'seller',
    kind: 'text',
    text: 'Yes, I agree ✅',
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'text',
    text: "Great to meet you! What's your name, and are you the registered owner of the property?",
  },
  {
    chapter: 1,
    track: 0,
    from: 'seller',
    kind: 'text',
    text: 'Maria Adams — yes, I own it 🏡',
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'text',
    text: 'Two ways to sell, Maria:\n\n🟢 Free (0%) — list exclusively with us for 90 days and transact through our bond & legal partners.\n🔵 Flex — a small flat fee, total freedom.\n\nWhich suits you?',
    note: {
      tag: 'Revenue',
      title: 'Conditional 0% — the model',
      body: 'Free to the consumer when they list exclusively and use our partner ecosystem (bond originator + panel conveyancer). Flex is the low-fee hedge for sellers who want freedom.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'seller',
    kind: 'text',
    text: 'Free (0%) please 🙌',
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'text',
    text: "Perfect. I'll prepare a sole mandate for you to e-sign (required for the free tier). We act as a registered property practitioner, so this is a proper, regulated mandate.",
    note: {
      tag: 'Legal',
      title: 'Sole mandate & PPRA',
      body: 'Sold Direct operates as (or under) a registered property practitioner with a valid Fidelity Fund Certificate, so it can lawfully hold a mandate and handle offers.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'text',
    text: 'Now the fun part — a few guided questions to build your listing. Address, type, bedrooms, bathrooms, erf size, asking price, rates & levies…',
    note: {
      tag: 'Product',
      title: 'Guided listing intake',
      body: 'A structured WhatsApp Flow turns a chat into a clean, validated listing record — no agent visit, live in minutes.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'seller',
    kind: 'image',
    src: '/cape-town-hero.jpg',
    caption: 'Maria adds 14 photos 📸',
  },
  {
    chapter: 1,
    track: 0,
    from: 'bot',
    kind: 'listing',
    listing: LISTING,
    note: {
      tag: 'Product',
      title: 'Structured listing created',
      body: 'The conversation produces a typed listing record (price in ZAR, erf size, tier = Free). This is the same record the dashboard and portals read.',
    },
  },
  {
    chapter: 1,
    track: 0,
    from: 'system',
    kind: 'status',
    status: {
      title: '✅ Listing live',
      lines: [
        'Syndicated to Property24 & Private Property',
        'Shareable WhatsApp listing link generated',
      ],
      tone: 'good',
    },
    note: {
      tag: 'Product',
      title: 'Distribution without a portal of our own',
      body: 'We syndicate to the portals buyers already browse, and every listing has a one-tap WhatsApp enquiry link — meeting buyers where they are.',
    },
  },

  // ──────────────────── Chapter 2 — Buyer enquiry + finance ────────────────────
  {
    chapter: 2,
    track: 1,
    from: 'system',
    kind: 'system',
    text: 'John sees the listing on Property24 and taps “Enquire on WhatsApp”.',
    note: {
      tag: 'Product',
      title: 'Buyer enters the same channel',
      body: 'The buyer lands in WhatsApp too. One conversation thread now links a real buyer to a real listing — and creates a deal record at “Enquiry”.',
    },
  },
  {
    chapter: 2,
    track: 1,
    from: 'buyer',
    kind: 'text',
    text: 'Hi! Is 23 Vredehoek Ave still available? Could I view it? 😊',
  },
  {
    chapter: 2,
    track: 1,
    from: 'bot',
    kind: 'text',
    text: "Hi John! Yes, it's available. I can book a viewing. Quick POPIA consent to handle your details first?",
    note: {
      tag: 'POPIA',
      title: 'Consent — buyer side too',
      body: 'Same privacy gate for buyers before we capture anything. Consent + timestamp logged.',
    },
  },
  { chapter: 2, track: 1, from: 'buyer', kind: 'text', text: 'Agreed ✅' },
  {
    chapter: 2,
    track: 1,
    from: 'bot',
    kind: 'text',
    text: 'Want to know exactly what you can afford — and make a stronger offer? I can pre-qualify you for a home loan in ~2 minutes. Free, no obligation.',
    note: {
      tag: 'Finance',
      title: 'The pre-qualification hook',
      body: 'Pre-qualifying buyers in-chat is the heart of the model: it qualifies serious buyers AND opens the bond-origination referral.',
    },
  },
  { chapter: 2, track: 1, from: 'buyer', kind: 'text', text: 'Yes please!' },
  {
    chapter: 2,
    track: 1,
    from: 'bot',
    kind: 'text',
    text: 'Great — this is handled securely by ooba, our bond origination partner. A few questions on income, expenses and deposit, plus consent for a credit check.',
    note: {
      tag: 'Revenue',
      title: 'Bond origination referral (ooba)',
      body: 'A consented hand-off to our originator partner. The bank pays an origination share on a successful bond — at zero cost to the buyer or seller. This is our primary revenue engine.',
    },
  },
  {
    chapter: 2,
    track: 1,
    from: 'bot',
    kind: 'prequal',
    prequal: {
      amount: 'R3 600 000',
      rate: 'Prime −0.50%',
      deposit: 'R400 000',
      monthly: '≈ R37 800 / month',
      term: '20 years',
    },
    note: {
      tag: 'Finance',
      title: 'Buyer is now bond-ready',
      body: 'An indicative pre-qualification (illustrative figures). The buyer knows their budget; the seller only deals with qualified offers.',
    },
  },
  {
    chapter: 2,
    track: 1,
    from: 'bot',
    kind: 'text',
    text: "You're bond-ready 💪 Viewing booked for Saturday 10:00. I'll send the address and a calendar reminder.",
  },
  {
    chapter: 2,
    track: 1,
    from: 'system',
    kind: 'system',
    text: 'John views the home on Saturday — and loves it.',
  },

  // ───────────────────────── Chapter 3 — Offer to Purchase ─────────────────────
  {
    chapter: 3,
    track: 2,
    from: 'buyer',
    kind: 'text',
    text: "I'd like to make an offer 🖊️",
  },
  {
    chapter: 3,
    track: 2,
    from: 'bot',
    kind: 'text',
    text: "Let's build your Offer to Purchase (OTP). It becomes a legally binding agreement once both parties sign — so we'll capture the price, deposit, conditions and dates carefully.",
    note: {
      tag: 'Legal',
      title: 'The OTP is binding',
      body: 'In South Africa the signed Offer to Purchase IS the sale agreement. Suspensive conditions (e.g. “subject to bond approval”) must be met for it to become unconditional.',
    },
  },
  {
    chapter: 3,
    track: 2,
    from: 'buyer',
    kind: 'otp',
    otp: {
      price: 'R3 850 000',
      deposit: 'R400 000',
      bondRequired: 'R3 450 000',
      occupation: '1 September 2026',
      conditions: [
        'Subject to bond approval within 21 days',
        'Seller to provide compliance certificates',
        'Voetstoots, with disclosed defects',
      ],
    },
    note: {
      tag: 'Legal',
      title: 'Structured, not free-text',
      body: 'The offer is captured as structured terms with the standard suspensive conditions — reducing disputes and making the deal trackable end-to-end.',
    },
  },
  {
    chapter: 3,
    track: 2,
    from: 'bot',
    kind: 'text',
    text: 'Sent to Maria for review ✍️',
  },
  {
    chapter: 3,
    track: 2,
    from: 'seller',
    kind: 'text',
    text: "Close! I'll counter at R3 900 000 — everything else fine.",
  },
  {
    chapter: 3,
    track: 2,
    from: 'buyer',
    kind: 'text',
    text: 'Accepted at R3 900 000 ✅',
  },
  {
    chapter: 3,
    track: 2,
    from: 'system',
    kind: 'status',
    status: {
      title: '📄 Offer to Purchase signed',
      lines: [
        'Sale price R3 900 000',
        'Both parties e-signed',
        'Sale agreed — subject to bond approval',
      ],
      tone: 'good',
    },
    note: {
      tag: 'Legal',
      title: 'A valid sale exists',
      body: 'The deal record moves to “Offer (OTP)”. Every status change is timestamped and logged — the audit trail conveyancers and partners can rely on.',
    },
  },

  // ─────────────────── Chapter 4 — Bond, conveyancing, transfer ────────────────
  {
    chapter: 4,
    track: 3,
    from: 'bot',
    kind: 'text',
    text: "Now I'll submit John's bond application to several banks at once via ooba, to secure the best rate.",
    note: {
      tag: 'Finance',
      title: 'Multi-bank bond application',
      body: 'ooba submits to multiple banks simultaneously and negotiates — historically winning better rates than going to one bank.',
    },
  },
  {
    chapter: 4,
    track: 3,
    from: 'system',
    kind: 'status',
    status: {
      title: '🏦 Bond approved',
      lines: [
        'Standard Bank — R3 450 000',
        'Prime −0.50% over 20 years',
        'Suspensive condition met ✅',
      ],
      tone: 'good',
    },
    note: {
      tag: 'Revenue',
      title: 'Revenue realised',
      body: 'On the granted bond, the bank pays an origination share to our partner, shared with us — the consumer pays nothing. The deal moves to “Bond”.',
    },
  },
  {
    chapter: 4,
    track: 4,
    from: 'bot',
    kind: 'checklist',
    checklistTitle: 'Conveyancers appointed (3 attorneys)',
    checklist: [
      {
        label: 'Transferring attorney',
        sub: 'Transfers ownership to the buyer',
        role: 'Seller · our panel',
      },
      {
        label: 'Bond attorney',
        sub: "Registers the buyer's new bond",
        role: "Buyer's bank",
      },
      {
        label: 'Cancellation attorney',
        sub: "Cancels the seller's existing bond",
        role: "Seller's bank",
      },
    ],
    note: {
      tag: 'Revenue',
      title: 'Panel conveyancing',
      body: 'The transferring attorney comes from our panel — a second, consented revenue line (referral / fee share), again at no extra cost to the consumer.',
    },
  },
  {
    chapter: 4,
    track: 4,
    from: 'bot',
    kind: 'checklist',
    checklistTitle: 'FICA verification (both parties)',
    checklist: [
      { label: 'ID document' },
      { label: 'Proof of residence', sub: 'less than 3 months old' },
      { label: 'Source of funds & SARS tax number' },
    ],
    note: {
      tag: 'Legal',
      title: 'FICA & encrypted PII',
      body: 'Attorneys are legally required to FICA both parties. Sensitive documents are encrypted at rest and never logged — POPIA throughout.',
    },
  },
  {
    chapter: 4,
    track: 4,
    from: 'system',
    kind: 'checklist',
    checklistTitle: 'Transferring attorney gathers',
    checklist: [
      { label: 'Title deed & cancellation figures', sub: "from seller's bank" },
      { label: 'Rates clearance figures', sub: 'from the City of Cape Town' },
      { label: 'Transfer duty', sub: 'paid to SARS' },
    ],
    note: {
      tag: 'Legal',
      title: 'The transfer machinery',
      body: 'Behind the scenes the attorney coordinates the bank, municipality and SARS. We surface each step in the buyer & seller chat so nobody is left wondering “where is my deal?”.',
    },
  },
  {
    chapter: 4,
    track: 4,
    from: 'system',
    kind: 'status',
    status: {
      title: '💰 Transfer costs (illustrative)',
      lines: [
        'Transfer duty to SARS ≈ R232 000',
        'Conveyancing & bond registration fees',
        'Payable by the buyer',
      ],
      tone: 'info',
    },
    note: {
      tag: 'Legal',
      title: 'Costs made transparent',
      body: 'Transfer duty is a sliding SARS tax on the purchase price. Showing it upfront avoids the nasty surprises that derail deals.',
    },
  },
  {
    chapter: 4,
    track: 4,
    from: 'bot',
    kind: 'checklist',
    checklistTitle: 'Compliance certificates ordered',
    checklist: [
      { label: 'Electrical Compliance Certificate' },
      {
        label: 'Plumbing / water certificate',
        sub: 'City of Cape Town requirement',
      },
      { label: 'Gas Certificate of Conformity', sub: 'if gas installed' },
      { label: 'Electric fence certificate', sub: 'if applicable' },
      { label: 'Beetle clearance', sub: 'where required' },
    ],
    note: {
      tag: 'Legal',
      title: "Seller's compliance obligations",
      body: 'The seller must deliver valid certificates before transfer. We coordinate the inspections (an optional add-on revenue line too).',
    },
  },
  {
    chapter: 4,
    track: 5,
    from: 'system',
    kind: 'status',
    status: {
      title: '📑 Clearance & guarantees',
      lines: [
        'Rates Clearance Certificate issued',
        'Bank guarantees delivered to the attorney',
        'Buyer & seller sign transfer documents',
      ],
      tone: 'info',
    },
    note: {
      tag: 'Legal',
      title: 'Clearance stage',
      body: 'No transfer can be lodged without a municipal rates clearance and the bank guarantees. Deal moves to “Clearance”.',
    },
  },
  {
    chapter: 4,
    track: 6,
    from: 'system',
    kind: 'status',
    status: {
      title: '🏛️ Lodged at the Deeds Office',
      lines: [
        'Transfer + new bond + bond cancellation',
        'Lodged simultaneously by the attorneys',
        'Examination ≈ 7–10 working days',
      ],
      tone: 'info',
    },
    note: {
      tag: 'Legal',
      title: 'Simultaneous lodgement',
      body: 'The three matters must lodge together at the Deeds Office. This is the home stretch — “Lodgement”.',
    },
  },
  {
    chapter: 4,
    track: 7,
    from: 'system',
    kind: 'status',
    status: {
      title: '🎉 Registered in the Deeds Office',
      lines: [
        'Ownership transferred to John',
        'Proceeds paid to Maria',
        'Bond settled · keys handed over',
      ],
      tone: 'win',
    },
    note: {
      tag: 'Legal',
      title: 'Registration = done',
      body: 'On registration, ownership legally passes and funds are disbursed. The deal record reaches its final state, “Registered”.',
    },
  },
  {
    chapter: 4,
    track: 7,
    from: 'system',
    kind: 'status',
    status: {
      title: '🟢 0% commission',
      lines: [
        'Maria paid R0 agent commission',
        'Saved ≈ R230 000 vs 7% + VAT',
        'Sold Direct earned from partners — not the seller',
      ],
      tone: 'win',
    },
    note: {
      tag: 'Revenue',
      title: 'The whole model in one deal',
      body: 'Consumer pays nothing. We earned from the bond origination share and the conveyancing panel — recurring, scalable, paid by the financial ecosystem around every deal.',
    },
  },
  {
    chapter: 4,
    track: 7,
    from: 'bot',
    kind: 'text',
    text: "That's the Sold Direct journey: list → enquire → finance → offer → transfer → registered. All inside WhatsApp, with 0% commission. 🏡",
    note: {
      tag: 'Product',
      title: 'One thread, start to finish',
      body: 'Every step happened in a single WhatsApp conversation, tracked by the deal state machine and visible in our internal dashboard.',
    },
  },
];
