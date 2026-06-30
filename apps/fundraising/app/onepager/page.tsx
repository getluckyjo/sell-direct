import type { Metadata } from 'next';
import { TRACKER } from '@/components/journey';
import { PrintButton } from '@/components/PrintButton';

export const metadata: Metadata = {
  title: 'Sold Direct — the WhatsApp property journey (one-pager)',
  description:
    'A one-page summary of the Sold Direct consumer journey: list, enquire, finance, offer, transfer, register — at 0% commission.',
};

const CHAPTERS = [
  {
    n: 1,
    title: 'List in minutes',
    who: 'Seller',
    points: [
      'Starts in WhatsApp from solddirect.co.za — no app, no portal login',
      'POPIA consent captured first; owner confirmed',
      'Chooses Free (0%, exclusive) or Flex (low flat fee)',
      'Sole mandate e-signed; guided intake builds a structured listing',
      'Listing live & syndicated to Property24 / Private Property',
    ],
  },
  {
    n: 2,
    title: 'Enquire & get bond-ready',
    who: 'Buyer',
    points: [
      'Taps “Enquire on WhatsApp” from the portal listing',
      'POPIA consent; viewing arranged',
      'In-chat bond pre-qualification via ooba (our originator)',
      'Pre-approved amount, rate & repayment — buyer is bond-ready',
    ],
  },
  {
    n: 3,
    title: 'Offer to Purchase',
    who: 'Both',
    points: [
      'Structured OTP with suspensive conditions (subject to bond, etc.)',
      'Counter-offer and acceptance handled in-chat',
      'Both parties e-sign — a binding sale agreement exists',
      'Deal record created and timestamped',
    ],
  },
  {
    n: 4,
    title: 'Bond, legal & transfer',
    who: 'Conveyancing',
    points: [
      'Multi-bank bond application via ooba → bond granted',
      'Three attorneys: transferring, bond, cancellation',
      'FICA both parties; title deed, rates figures & SARS transfer duty',
      'Compliance certificates; rates clearance; bank guarantees',
      'Deeds Office lodgement → registration → keys & payout',
    ],
  },
];

const REVENUE = [
  'Bond origination share from the bank (via ooba) — paid by the bank',
  'Panel conveyancing referral / fee share',
  'Optional add-ons: photography, compliance coordination, insurance',
];

const COMPLIANCE = [
  'POPIA consent captured before any data — encrypted sensitive fields',
  'Registered property practitioner (Fidelity Fund Certificate)',
  'FICA on both parties via the conveyancer',
  'Compliance certificates: electrical, plumbing, gas, fence, beetle',
];

export default function OnePager() {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Action bar — hidden when printing */}
      <div className="no-print sticky top-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <p className="text-sm text-slate-500">
          Tip: choose <span className="font-semibold">“Save as PDF”</span> as
          the destination.
        </p>
        <PrintButton />
      </div>

      {/* The sheet */}
      <div className="mx-auto my-6 max-w-[820px] bg-white p-10 shadow-sm print:my-0 print:p-0 print:shadow-none">
        {/* Header */}
        <header className="flex items-baseline justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Sold <span className="text-emerald-600">Direct</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              The WhatsApp property journey — list to registered sale
            </p>
          </div>
          <p className="text-right text-sm font-semibold text-emerald-700">
            0% commission
            <span className="block font-normal text-slate-400">
              solddirect.co.za
            </span>
          </p>
        </header>

        {/* Tracker strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
          {TRACKER.map((s, i) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {s.label}
              </span>
              {i < TRACKER.length - 1 && (
                <span className="text-slate-300">→</span>
              )}
            </span>
          ))}
        </div>

        {/* Chapters */}
        <div className="mt-6 grid grid-cols-2 gap-5">
          {CHAPTERS.map((c) => (
            <section
              key={c.n}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {c.n}
                </span>
                <h2 className="text-sm font-bold text-slate-900">{c.title}</h2>
                <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {c.who}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2 text-[12px] text-slate-600">
                    <span className="text-emerald-600">▸</span>
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Revenue + compliance */}
        <div className="mt-5 grid grid-cols-2 gap-5">
          <section className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
            <h2 className="text-sm font-bold text-purple-800">
              How Sold Direct earns
            </h2>
            <ul className="mt-2 space-y-1.5">
              {REVENUE.map((r) => (
                <li key={r} className="flex gap-2 text-[12px] text-slate-600">
                  <span className="text-purple-500">●</span>
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] font-medium text-purple-700">
              The consumer pays nothing — we earn from the financial ecosystem
              around every deal.
            </p>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <h2 className="text-sm font-bold text-amber-800">
              Compliance built in
            </h2>
            <ul className="mt-2 space-y-1.5">
              {COMPLIANCE.map((c) => (
                <li key={c} className="flex gap-2 text-[12px] text-slate-600">
                  <span className="text-amber-500">●</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-400">
          For demonstration only. Names, the property and all amounts are
          illustrative and not an offer, quote or financial advice. The
          conveyancing sequence reflects a typical South African freehold
          transfer; specifics vary per deal, municipality and bank. Sold Direct
          facilitates finance via a registered bond originator and legal work
          via panel conveyancers. © Sold Direct, Cape Town.
        </footer>
      </div>
    </div>
  );
}
