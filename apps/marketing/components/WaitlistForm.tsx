'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim() || undefined,
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim() || undefined,
      role: String(form.get('role') ?? '') || undefined,
      consent: form.get('consent') === 'on',
    };

    if (!payload.consent) {
      setStatus('error');
      setError('Please tick the consent box so we may contact you.');
      return;
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('request_failed');
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again in a moment.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-800">
          You&apos;re on the list 🎉
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          We&apos;ll be in touch as we open up Cape Town. Keep your money.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="Thabo M."
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Email <span className="text-emerald-600">*</span>
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="you@example.co.za"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">WhatsApp number</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            placeholder="+27 82 000 0000"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">I want to…</span>
          <select
            name="role"
            defaultValue="seller"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="seller">Sell a property</option>
            <option value="buyer">Buy a property</option>
            <option value="other">Just keeping an eye out</option>
          </select>
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          name="consent"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
        />
        <span>
          I agree to be contacted about Sell Direct and accept that my details
          are processed per the POPIA privacy notice.
        </span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
      </button>
    </form>
  );
}
