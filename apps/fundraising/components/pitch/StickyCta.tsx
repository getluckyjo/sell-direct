'use client';

import { useEffect, useState } from 'react';

/**
 * Floating "Request data room" pill. Appears once the hero has scrolled
 * out of view and hides while the access form is on screen, so it never
 * covers the thing it points to.
 */
export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [accessVisible, setAccessVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('summary');
    const access = document.getElementById('access');
    if (!hero || !access) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' },
    );
    const accessObserver = new IntersectionObserver(([entry]) =>
      setAccessVisible(entry.isIntersecting),
    );
    heroObserver.observe(hero);
    accessObserver.observe(access);
    return () => {
      heroObserver.disconnect();
      accessObserver.disconnect();
    };
  }, []);

  const show = pastHero && !accessVisible;

  return (
    <div
      aria-hidden={!show}
      className={`fixed bottom-4 left-1/2 z-20 -translate-x-1/2 transition-all duration-300 sm:left-auto sm:right-6 sm:translate-x-0 ${
        show
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <a
        href="#access"
        tabIndex={show ? 0 : -1}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        Request data room
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
