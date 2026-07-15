'use client';

import { useState } from 'react';
import { CALCULATOR } from '@/content/pitch';

const zar = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

export function TicketCalculator() {
  const [amount, setAmount] = useState<number>(CALCULATOR.initial);

  const stake = (amount / CALCULATOR.postMoney) * 100;
  const exitValue = amount * CALCULATOR.exitMultiple;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <h3 className="font-semibold text-white">{CALCULATOR.heading}</h3>
      <p className="mt-1 text-sm text-slate-400">{CALCULATOR.sub}</p>

      <label className="mt-6 block">
        <span className="sr-only">Investment amount in rand</span>
        <input
          type="range"
          min={CALCULATOR.min}
          max={CALCULATOR.max}
          step={CALCULATOR.step}
          value={amount}
          onChange={(e) => setAmount(Number(e.currentTarget.value))}
          className="w-full accent-emerald-500"
        />
      </label>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        {zar.format(amount)}
      </p>

      <dl className="mt-6 grid gap-3 border-t border-slate-800 pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-400">
            Your stake at R40m post-money
          </dt>
          <dd className="font-semibold text-slate-100">
            {stake.toFixed(2)}%
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-400">{CALCULATOR.exitLabel}</dt>
          <dd className="font-semibold text-emerald-300">
            {zar.format(exitValue)}{' '}
            <span className="text-slate-400">
              (~{CALCULATOR.exitMultiple}×)
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {CALCULATOR.caveat}
      </p>
    </div>
  );
}
