import {
  BUBBLE_PATH,
  LOGO_VIEWBOX_TM,
  TRADEMARK_PATH,
  WORDMARK_PATH,
} from '@/components/logo-paths';

const BUBBLE_GREEN = '#36B44A';

/**
 * The SoldDirect.™ lockup, exact vectors from the master artwork.
 * Sized by font-size: the wordmark is 1em tall and scales with `className`
 * (e.g. `text-lg`). Wordmark fills follow the variant; the bubble is always
 * brand green.
 *
 * The ™ is part of every rendering of the lockup and must not be dropped —
 * the mark is unregistered, and ™ is what asserts the claim in the meantime.
 * It is NOT ® and must not become ® until a registration certificate exists
 * (see context/trade-mark.md).
 */
export function Logo({
  variant = 'light',
  className = '',
}: {
  /** light = white wordmark for navy surfaces; dark = navy wordmark for light/print surfaces */
  variant?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${
        variant === 'light' ? 'text-white' : 'text-navy'
      } ${className}`}
    >
      <svg
        viewBox={LOGO_VIEWBOX_TM}
        aria-hidden
        className="h-[1em] w-auto"
        fill="currentColor"
      >
        <path d={WORDMARK_PATH} />
        <path d={TRADEMARK_PATH} />
        <path d={BUBBLE_PATH} fill={BUBBLE_GREEN} />
      </svg>
      <span className="sr-only">Sold Direct</span>
    </span>
  );
}
