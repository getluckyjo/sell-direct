import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our compliance — Sold Direct',
  description:
    'How Sold Direct keeps private property sales safe and compliant: registered property practitioners (PPRA), POPIA privacy-by-design, fair mandates, licensed finance partners and attorney trust accounts.',
};

const PILLARS = [
  {
    title: 'Registered property practitioners',
    body: 'Sold Direct operates as a registered property practitioner under the Property Practitioners Act, with a valid Fidelity Fund Certificate (FFC). Your mandate and offer documents are proper, regulated instruments — not informal templates. Registration details are available on request.',
    tag: 'PPRA · FFC',
  },
  {
    title: 'Your data, protected (POPIA)',
    body: 'We ask for explicit consent before collecting or sharing any personal or financial information, store only what each step needs, encrypt sensitive fields, and never sell your data. Every consent is timestamped and auditable.',
    tag: 'POPIA',
  },
  {
    title: 'Fair, transparent mandates',
    body: 'The 0% path uses a fixed-term exclusive mandate with plain-language terms you e-sign on WhatsApp. Prefer no exclusivity? The Flex option is always available — a genuine alternative is a condition of our pricing, not a footnote.',
    tag: 'Mandates',
  },
  {
    title: 'Finance done right',
    body: 'Bond pre-qualification and applications run through licensed finance partners across multiple banks — you always keep full choice of bank and rate. Bank sponsorship on our platform is advertising, never steering, and we only share your information after your explicit consent.',
    tag: 'NCA · Multi-bank',
  },
  {
    title: 'FICA & attorney trust accounts',
    body: 'FICA verification on both parties is completed through the conveyancing attorneys, and all deposits and purchase funds are held in an attorney’s audited trust account — never by Sold Direct.',
    tag: 'FICA · Trust',
  },
  {
    title: 'Working alongside the industry',
    body: 'Estate agents play a valuable role in South African property, and full service is the right choice for many sellers. We serve those who choose to sell privately — assisted by our own employed, registered practitioners — and we hold ourselves to the same professional standards.',
    tag: 'Industry',
  },
];

export default function Compliance() {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Sold <span className="text-emerald-600">Direct</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link
              href="/#waitlist"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Join waitlist
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            Our compliance
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Selling direct, done properly.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            A private sale should be every bit as safe and compliant as a
            full-service one. Here is how we make sure it is — from your first
            message to registration at the Deeds Office.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {p.tag}
              </span>
              <h2 className="mt-2 font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-semibold">Questions or concerns?</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            We take compliance questions seriously and answer them quickly.
            Message us on WhatsApp or write to us and a member of our team —
            including our registered practitioners — will respond. If we ever
            fall short, you may also contact the Property Practitioners
            Regulatory Authority (PPRA), the body that regulates our industry.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Sold Direct. Cape Town, South Africa.
          </span>
          <span>
            0% commission on the qualifying path · POPIA-compliant · PPRA
            registered practitioners.
          </span>
        </div>
      </footer>
    </div>
  );
}
