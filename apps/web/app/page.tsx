import { APP_NAME } from '@sell-direct/shared';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">{APP_NAME}</h1>
      <p className="text-slate-600">
        WhatsApp-first, 0% commission property marketplace for Cape Town.
      </p>
      <p className="text-sm text-slate-500">
        Internal control room — scaffolding is in place. Listings, deals and the
        status timeline arrive in later PRs.
      </p>
    </main>
  );
}
