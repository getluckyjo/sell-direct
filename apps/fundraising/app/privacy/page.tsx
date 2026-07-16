import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy notice — Sold Direct Investors',
  description:
    'How Sold Direct processes personal information submitted through the investor site, in terms of POPIA.',
};

const CONTACT_EMAIL = 'johannes@solddirect.co.za';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        ← Back to investors
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
        Privacy notice
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Investor site · Protection of Personal Information Act, 2013 (POPIA)
      </p>

      <div className="mt-10 grid gap-8 text-slate-300">
        <section>
          <h2 className="font-bold text-white">Who we are</h2>
          <p className="mt-2 text-sm">
            Sold Direct (Cape Town, South Africa) is the responsible party for
            personal information collected through this investor site. Contact:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-bold text-white">What we collect, and why</h2>
          <p className="mt-2 text-sm">
            When you request data-room access we collect your name, email
            address, firm or fund, and any message you choose to add. We use
            this information for one purpose: to assess and respond to your
            request, including arranging an NDA and sharing investor materials.
            We do not use it for marketing unrelated to this opportunity, and we
            do not sell it.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-white">Consent and lawful basis</h2>
          <p className="mt-2 text-sm">
            We process your details on the basis of the consent you give when
            submitting the form, recorded with a timestamp. You may withdraw
            consent at any time by emailing us, after which we will stop
            processing and delete your details unless a legal obligation
            requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-white">Storage and sharing</h2>
          <p className="mt-2 text-sm">
            Your details are stored securely on our systems and are accessible
            only to the Sold Direct founding team. They are not shared with
            third parties except service providers who host our infrastructure,
            under appropriate safeguards.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-white">Retention</h2>
          <p className="mt-2 text-sm">
            We keep investor-lead details for the duration of the fundraising
            process and up to 12 months afterwards, then delete them, unless you
            ask us to delete them sooner or an ongoing relationship requires
            keeping them.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-white">Your rights</h2>
          <p className="mt-2 text-sm">
            Under POPIA you may request access to, correction of, or deletion of
            your personal information, and you may object to processing. Email{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            and we will respond promptly. You also have the right to lodge a
            complaint with the Information Regulator (South Africa) at{' '}
            <span className="text-slate-200">inforeg.org.za</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
