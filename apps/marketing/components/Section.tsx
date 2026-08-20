import Image from 'next/image';
import type { ReactNode } from 'react';

type SectionProps = {
  id: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  tone?: 'plain' | 'tinted';
  /**
   * Optional full-bleed photo behind the section. Drop new images in public/
   * and pass them here to break up the page. `overlay` controls legibility:
   * 'dark' washes the photo dark (content renders white), 'light' washes it
   * white so the standard light-theme content stays readable on top.
   */
  backdrop?: { src: string; alt: string; overlay?: 'dark' | 'light' };
  children?: ReactNode;
};

export function Section({
  id,
  eyebrow,
  heading,
  intro,
  tone = 'plain',
  backdrop,
  children,
}: SectionProps) {
  const onDarkPhoto = Boolean(backdrop) && backdrop?.overlay !== 'light';

  const inner = (
    <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16 sm:py-20" id={id}>
      {eyebrow ? (
        <p
          className={`mb-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            onDarkPhoto
              ? 'bg-white/10 text-brand-300 ring-1 ring-inset ring-white/20 backdrop-blur'
              : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`text-2xl font-bold tracking-tight sm:text-3xl ${
          onDarkPhoto ? 'text-white drop-shadow-sm' : 'text-slate-900'
        }`}
      >
        {heading}
      </h2>
      {intro ? (
        <p
          className={`mt-3 max-w-3xl ${
            onDarkPhoto ? 'text-slate-200 drop-shadow-sm' : 'text-slate-600'
          }`}
        >
          {intro}
        </p>
      ) : null}
      {children}
    </div>
  );

  if (backdrop) {
    return (
      <section className="relative isolate overflow-hidden border-y border-slate-200">
        <Image
          src={backdrop.src}
          alt={backdrop.alt}
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[50%_70%]"
        />
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 ${
            backdrop.overlay === 'light'
              ? 'bg-gradient-to-b from-white via-white/70 to-white'
              : 'bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-slate-950/90'
          }`}
        />
        {inner}
      </section>
    );
  }

  if (tone === 'tinted') {
    return (
      <section className="border-y border-slate-200/70 bg-slate-50">
        {inner}
      </section>
    );
  }
  return <section>{inner}</section>;
}
