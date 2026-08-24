import Image from 'next/image';
import type { ReactNode } from 'react';

type SectionProps = {
  id: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  tone?: 'plain' | 'tinted';
  /**
   * Optional full-bleed photo behind the section (with a dark overlay so
   * content stays readable). Drop new images in public/ and pass them here
   * to break up the page.
   */
  backdrop?: { src: string; alt: string };
  children?: ReactNode;
};

/**
 * Standard pitch section: anchor target, eyebrow badge, heading, intro,
 * content. All section spacing/typography lives here so the designer
 * restyle is one edit.
 */
export function Section({
  id,
  eyebrow,
  heading,
  intro,
  tone = 'plain',
  backdrop,
  children,
}: SectionProps) {
  const inner = (
    <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16" id={id}>
      {eyebrow ? (
        <p className="mb-2 inline-flex rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
      {intro ? <p className="mt-3 max-w-3xl text-slate-300">{intro}</p> : null}
      {children}
    </div>
  );

  if (backdrop) {
    return (
      <section className="relative isolate overflow-hidden border-y border-slate-800">
        <Image
          src={backdrop.src}
          alt={backdrop.alt}
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[50%_70%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/90 via-navy/65 to-navy/90"
        />
        {inner}
      </section>
    );
  }

  if (tone === 'tinted') {
    return (
      <section className="border-y border-slate-800 bg-slate-900/40">
        {inner}
      </section>
    );
  }
  return <section>{inner}</section>;
}
