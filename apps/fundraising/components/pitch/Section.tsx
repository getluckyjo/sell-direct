import type { ReactNode } from 'react';

type SectionProps = {
  id: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  tone?: 'plain' | 'tinted';
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
  children,
}: SectionProps) {
  const inner = (
    <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16" id={id}>
      {eyebrow ? (
        <p className="mb-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
      {intro ? <p className="mt-3 max-w-3xl text-slate-300">{intro}</p> : null}
      {children}
    </div>
  );

  if (tone === 'tinted') {
    return (
      <section className="border-y border-slate-800 bg-slate-900/40">
        {inner}
      </section>
    );
  }
  return <section>{inner}</section>;
}
