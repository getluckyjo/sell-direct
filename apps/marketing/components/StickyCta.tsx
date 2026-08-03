'use client';

import { useEffect, useState } from 'react';

/**
 * Floating "Join the waitlist" pill. Appears once the hero has scrolled
 * out of view and hides while the waitlist form is on screen, so it never
 * covers the thing it points to. Mirrors the investor site's StickyCta.
 */
export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [waitlistVisible, setWaitlistVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    const waitlist = document.getElementById('waitlist');
    if (!hero || !waitlist) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' },
    );
    const waitlistObserver = new IntersectionObserver(([entry]) =>
      setWaitlistVisible(entry.isIntersecting),
    );
    heroObserver.observe(hero);
    waitlistObserver.observe(waitlist);
    return () => {
      heroObserver.disconnect();
      waitlistObserver.disconnect();
    };
  }, []);

  const show = pastHero && !waitlistVisible;

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
        href="#waitlist"
        tabIndex={show ? 0 : -1}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-emerald-600/25 transition hover:bg-emerald-700"
      >
        Join the waitlist
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
