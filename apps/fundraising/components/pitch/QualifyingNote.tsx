'use client';

import { useEffect, useRef, useState } from 'react';
import { QUALIFYING_TOOLTIP } from '@/content/pitch';

/**
 * Renders "0%*" with a tap/click-friendly popover resolving the asterisk
 * instantly (the full legal wording lives in the footer). Inherits the
 * surrounding text style so it can sit inside the hero H1.
 */
export function QualifyingNote() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-label="0 percent — what qualifies?"
        onClick={() => setOpen((v) => !v)}
        className="cursor-help underline decoration-brand-400/60 decoration-dotted underline-offset-4 hover:decoration-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      >
        0%*
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 block w-72 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-sm font-normal normal-case leading-snug tracking-normal text-slate-200 shadow-2xl sm:w-80"
        >
          {QUALIFYING_TOOLTIP}
        </span>
      ) : null}
    </span>
  );
}
