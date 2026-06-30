'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  CHAPTERS,
  SCENES,
  TRACKER,
  type Note,
  type Scene,
  type Tag,
} from './journey';

const TAG_STYLES: Record<Tag, string> = {
  POPIA: 'bg-blue-100 text-blue-700 ring-blue-200',
  Finance: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Legal: 'bg-amber-100 text-amber-800 ring-amber-200',
  Revenue: 'bg-purple-100 text-purple-700 ring-purple-200',
  Product: 'bg-slate-200 text-slate-700 ring-slate-300',
};

const STEP_MS = 2600;

type View = 'full' | 'seller' | 'buyer';

// Which chapters belong to each perspective. Chapter 1 = seller listing,
// 2 = buyer enquiry/finance, 3 = offer (both), 4 = conveyancing (both).
const VIEW_CHAPTERS: Record<View, number[]> = {
  full: [1, 2, 3, 4],
  seller: [1, 3, 4],
  buyer: [2, 3, 4],
};

const VIEW_LABELS: { key: View; label: string }[] = [
  { key: 'full', label: 'Full journey' },
  { key: 'seller', label: 'Seller view' },
  { key: 'buyer', label: 'Buyer view' },
];

export function WhatsAppDemo() {
  const [view, setView] = useState<View>('full');
  // index = how many scenes are revealed (1..scenes.length)
  const [index, setIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const scenes = useMemo(
    () => SCENES.filter((s) => VIEW_CHAPTERS[view].includes(s.chapter)),
    [view],
  );

  const current = scenes[Math.min(index, scenes.length) - 1];
  const chapter = CHAPTERS[current.chapter - 1];
  const atEnd = index >= scenes.length;

  function changeView(next: View) {
    setView(next);
    setIndex(1);
    setPlaying(false);
  }

  // Once the user takes control, stop auto-play from kicking in again.
  function takeControl() {
    startedRef.current = true;
  }

  // Auto-play once when the demo scrolls into view (respecting reduced motion).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            setPlaying(true);
          }
        }
      },
      // Fire when the top of the demo scrolls up into the viewport. (A high
      // threshold never triggers here — the demo is taller than the screen.)
      { threshold: 0, rootMargin: '0px 0px -25% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Autoplay tick
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(
      () => setIndex((i) => Math.min(i + 1, scenes.length)),
      STEP_MS,
    );
    return () => clearTimeout(t);
  }, [playing, index, atEnd, scenes.length]);

  // Keep the chat scrolled to the newest bubble. Scroll the inner container
  // directly (instant) so it never chains out to nudge the whole page.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index, view]);

  const visible = useMemo(() => scenes.slice(0, index), [scenes, index]);
  const viewChapters = CHAPTERS.filter((c) =>
    scenes.some((s) => s.chapter === c.n),
  );

  function jumpToChapter(n: number) {
    const firstIdx = scenes.findIndex((s) => s.chapter === n);
    if (firstIdx >= 0) {
      takeControl();
      setIndex(firstIdx + 1);
      setPlaying(false);
    }
  }

  return (
    <div ref={rootRef} className="space-y-6">
      {/* View toggle + one-pager */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {VIEW_LABELS.map((v) => (
            <button
              key={v.key}
              onClick={() => changeView(v.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === v.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <a
          href="/onepager"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ⤓ One-pager (PDF)
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        {/* Phone */}
        <div className="mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
            {/* WhatsApp header */}
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-emerald-950">
                SD
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Sold Direct</p>
                <p className="text-[11px] text-emerald-100">
                  {chapter.participant}
                </p>
              </div>
              <span className="ml-auto text-[11px] text-emerald-100">
                online
              </span>
            </div>

            {/* Chat */}
            <div
              ref={chatRef}
              className="h-[60vh] min-h-[420px] space-y-2.5 overflow-y-auto overscroll-contain bg-[#ECE5DD] px-3 py-4"
            >
              {visible.map((s, i) => (
                <Bubble key={i} scene={s} isLast={i === visible.length - 1} />
              ))}
            </div>

            {/* Fake input bar */}
            <div className="flex items-center gap-2 bg-[#F0F0F0] px-3 py-2">
              <div className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-slate-400">
                Message
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075E54] text-white">
                ➤
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                takeControl();
                setIndex(1);
                setPlaying(false);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              aria-label="Restart"
            >
              ↺
            </button>
            <button
              onClick={() => {
                takeControl();
                setIndex((i) => Math.max(1, i - 1));
                setPlaying(false);
              }}
              disabled={index <= 1}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ‹ Back
            </button>
            <button
              onClick={() => {
                takeControl();
                if (atEnd) {
                  setIndex(1);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {atEnd ? 'Replay' : playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => {
                takeControl();
                setIndex((i) => Math.min(scenes.length, i + 1));
                setPlaying(false);
              }}
              disabled={atEnd}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Step {index} / {scenes.length}
          </p>
        </div>

        {/* Right: chapters, tracker, annotation */}
        <div className="space-y-6">
          {/* Chapters */}
          <div className="flex flex-wrap gap-2">
            {viewChapters.map((c) => {
              const active = c.n === current.chapter;
              return (
                <button
                  key={c.n}
                  onClick={() => jumpToChapter(c.n)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{c.n}.</span> {c.title}
                </button>
              );
            })}
          </div>

          {/* Deal tracker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Deal status tracker
            </p>
            <ol className="flex flex-wrap gap-x-2 gap-y-3">
              {TRACKER.map((stage, i) => {
                const done = i < current.track;
                const active = i === current.track;
                return (
                  <li key={stage.key} className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        active
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span
                      className={`text-sm ${
                        active
                          ? 'font-semibold text-slate-900'
                          : done
                            ? 'text-slate-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {i < TRACKER.length - 1 && (
                      <span className="hidden text-slate-300 sm:inline">→</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Annotation */}
          <Annotation note={current.note} />

          {/* Legend */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              What to watch for
            </p>
            <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {(
                [
                  ['Revenue', 'Where Sold Direct earns'],
                  ['Finance', 'Bond / affordability'],
                  ['Legal', 'Conveyancing & compliance'],
                  ['POPIA', 'Consent & data privacy'],
                  ['Product', 'WhatsApp UX & tracking'],
                ] as [Tag, string][]
              ).map(([tag, label]) => (
                <li key={tag} className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TAG_STYLES[tag]}`}
                  >
                    {tag}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Annotation({ note }: { note?: Note }) {
  if (!note) {
    return (
      <div className="min-h-[156px] rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
        Step through the journey to see what happens behind the scenes.
      </div>
    );
  }
  return (
    <div className="min-h-[156px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${TAG_STYLES[note.tag]}`}
      >
        {note.tag}
      </span>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{note.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        {note.body}
      </p>
    </div>
  );
}

/* ───────────────────────────── Bubbles ───────────────────────────── */

function Bubble({ scene, isLast }: { scene: Scene; isLast: boolean }) {
  const mine = scene.from === 'seller' || scene.from === 'buyer';

  if (scene.kind === 'system') {
    return (
      <div className="flex justify-center">
        <span className="max-w-[85%] rounded-lg bg-white/70 px-3 py-1.5 text-center text-[12px] text-slate-500 shadow-sm">
          {scene.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] shadow-sm ${
          mine
            ? 'rounded-br-sm bg-[#DCF8C6] text-slate-800'
            : 'rounded-bl-sm bg-white text-slate-800'
        } ${isLast ? 'animate-[fadein_.3s_ease]' : ''}`}
      >
        <BubbleBody scene={scene} />
      </div>
    </div>
  );
}

function BubbleBody({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'text':
      return <p className="whitespace-pre-line">{scene.text}</p>;

    case 'image':
      return (
        <figure className="w-56">
          <div className="overflow-hidden rounded-lg">
            <Image
              src={scene.src!}
              alt={scene.caption ?? 'Property photo'}
              width={400}
              height={260}
              className="h-32 w-full object-cover"
            />
          </div>
          {scene.caption && (
            <figcaption className="mt-1 text-[12px] text-slate-500">
              {scene.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'listing': {
      const l = scene.listing!;
      return (
        <div className="w-60 overflow-hidden rounded-lg border border-slate-100">
          <Image
            src={l.photo}
            alt={l.address}
            width={480}
            height={300}
            className="h-28 w-full object-cover"
          />
          <div className="p-2.5">
            <p className="text-base font-bold text-emerald-700">{l.price}</p>
            <p className="text-[13px] font-medium text-slate-800">
              {l.address}
            </p>
            <p className="text-[12px] text-slate-500">{l.suburb}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
              <span>🛏 {l.beds} bed</span>
              <span>🛁 {l.baths} bath</span>
              <span>📐 {l.erf}</span>
              <span>🏠 {l.type}</span>
            </div>
            <span className="mt-2 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              0% commission · Free tier
            </span>
          </div>
        </div>
      );
    }

    case 'prequal': {
      const p = scene.prequal!;
      return (
        <div className="w-60 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Pre-qualified ✅ · via ooba
          </p>
          <p className="mt-1 text-xl font-extrabold text-emerald-800">
            {p.amount}
          </p>
          <dl className="mt-2 space-y-1 text-[12px] text-slate-600">
            <Row k="Rate" v={p.rate} />
            <Row k="Deposit" v={p.deposit} />
            <Row k="Repayment" v={p.monthly} />
            <Row k="Term" v={p.term} />
          </dl>
          <p className="mt-2 text-[10px] text-slate-400">Illustrative only</p>
        </div>
      );
    }

    case 'otp': {
      const o = scene.otp!;
      return (
        <div className="w-60 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            📄 Offer to Purchase
          </p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">
            {o.price}
          </p>
          <dl className="mt-2 space-y-1 text-[12px] text-slate-600">
            <Row k="Deposit" v={o.deposit} />
            <Row k="Bond needed" v={o.bondRequired} />
            <Row k="Occupation" v={o.occupation} />
          </dl>
          <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            {o.conditions.map((c) => (
              <li key={c} className="flex gap-1.5">
                <span className="text-amber-500">§</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'status': {
      const s = scene.status!;
      const tone =
        s.tone === 'win'
          ? 'border-emerald-300 bg-emerald-50'
          : s.tone === 'good'
            ? 'border-emerald-100 bg-emerald-50/60'
            : 'border-slate-200 bg-slate-50';
      return (
        <div className={`w-60 rounded-lg border p-3 ${tone}`}>
          <p className="text-[13px] font-bold text-slate-900">{s.title}</p>
          <ul className="mt-1.5 space-y-1 text-[12px] text-slate-600">
            {s.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      );
    }

    case 'checklist': {
      return (
        <div className="w-60 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[12px] font-bold text-slate-800">
            {scene.checklistTitle}
          </p>
          <ul className="mt-2 space-y-2">
            {scene.checklist!.map((item) => (
              <li key={item.label} className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">▸</span>
                <span>
                  <span className="text-[12px] font-medium text-slate-800">
                    {item.label}
                  </span>
                  {item.sub && (
                    <span className="block text-[11px] text-slate-500">
                      {item.sub}
                    </span>
                  )}
                  {item.role && (
                    <span className="mt-0.5 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {item.role}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    default:
      return null;
  }
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400">{k}</dt>
      <dd className="font-medium text-slate-700">{v}</dd>
    </div>
  );
}
