/** Claude spark mark — the tutor's avatar. Drawn as an 8-ray asterisk with soft rays. */
export function ClaudeMark({ className = "", glow = false }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden style={glow ? { filter: "drop-shadow(0 0 10px rgba(217,119,87,0.55))" } : undefined}>
      <g fill="#D97757">
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M32 8 C34 8 35 10 35 12 L34 27 C34 29 30 29 30 27 L29 12 C29 10 30 8 32 8 Z"
            transform={`rotate(${i * 45} 32 32)`}
          />
        ))}
        <circle cx="32" cy="32" r="5.5" />
      </g>
    </svg>
  );
}
