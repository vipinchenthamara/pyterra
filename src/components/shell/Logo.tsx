export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="ao-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path d="M20 4 L34 32 H27 L20 18 L13 32 H6 Z" fill="url(#ao-g)" />
      <path d="M14.5 32 L20 22 L25.5 32 Z" fill="#070b14" opacity="0.9" />
      <circle cx="20" cy="9" r="2" fill="#e6edf7" />
    </svg>
  );
}
