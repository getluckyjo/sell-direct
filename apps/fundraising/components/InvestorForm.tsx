'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function InvestorForm() {
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
      firm: String(form.get('firm') ?? '').trim() || undefined,
      message: String(form.get('message') ?? '').trim() || undefined,
      consent: form.get('consent') === 'on',
    };

    if (!payload.consent) {
      setStatus('error');
      setError('Please confirm you agree to be contacted.');
      return;
    }

    try {
      const res = await fetch('/api/investor', {
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
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">
          Request received
        </p>
        <p className="mt-1 text-sm text-emerald-200/80">
          Thank you. We&apos;ll review and follow up with data-room access under
          NDA.
        </p>
      </div>
    );
  }

  const field =
    'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-300">Name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            className={field}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-300">
            Email <span className="text-emerald-400">*</span>
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-300">Firm / fund</span>
          <input name="firm" type="text" className={field} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-300">Anything to add?</span>
          <textarea name="message" rows={3} className={field} />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-400">
        <input
          name="consent"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
        />
        <span>
          I agree to be contacted about this opportunity. My details are
          processed per the POPIA privacy notice.
        </span>
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Request data-room access'}
      </button>
    </form>
  );
}
