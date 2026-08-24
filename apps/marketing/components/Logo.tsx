import {
  BUBBLE_PATH,
  LOGO_VIEWBOX,
  WORDMARK_PATH,
} from '@/components/logo-paths';

const BUBBLE_GREEN = '#36B44A';

/**
 * The SoldDirect. lockup, exact vectors from the master artwork.
 * Sized by font-size: the wordmark is 1em tall and scales with `className`
 * (e.g. `text-lg`). Wordmark fills follow the variant; the bubble is always
 * brand green.
 *
 * The lockup carries no ™/® — founder decision (Aug 2026). Do not add ®
 * in any case unless a registration certificate exists; see
 * context/trade-mark.md for the application status.
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
        viewBox={LOGO_VIEWBOX}
        aria-hidden
        className="h-[1em] w-auto"
        fill="currentColor"
      >
        <path d={WORDMARK_PATH} />
        <path d={BUBBLE_PATH} fill={BUBBLE_GREEN} />
      </svg>
      <span className="sr-only">Sold Direct</span>
    </span>
  );
}
