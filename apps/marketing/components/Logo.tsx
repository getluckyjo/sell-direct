const BUBBLE_GREEN = '#4CAF50';

/** The "o" in Sold, drawn as a WhatsApp-style speech bubble (green donut + tail). */
function BubbleO() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className="mx-[0.015em] h-[0.76em] w-[0.76em] self-center translate-y-[0.04em]"
    >
      <path
        fill={BUBBLE_GREEN}
        fillRule="evenodd"
        d="M50 2a48 48 0 1 1 0 96 48 48 0 0 1 0-96Zm0 25a23 23 0 1 0 0 46 23 23 0 0 0 0-46Z"
      />
      <path fill={BUBBLE_GREEN} d="M24 72 5 97l31-7Z" />
    </svg>
  );
}

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
      className={`inline-flex items-center font-bold tracking-tight ${
        variant === 'light' ? 'text-white' : 'text-navy'
      } ${className}`}
    >
      <span aria-hidden className="inline-flex items-center">
        S
        <BubbleO />
        ldDirect.
      </span>
      <span className="sr-only">Sold Direct</span>
    </span>
  );
}
