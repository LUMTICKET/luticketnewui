export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="#0B1220" />
        <g fill="#E8A33D">
          <circle cx="14" cy="14" r="4.5" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 14 + Math.cos(angle) * 7;
            const y1 = 14 + Math.sin(angle) * 7;
            const x2 = 14 + Math.cos(angle) * 11.5;
            const y2 = 14 + Math.sin(angle) * 11.5;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#E8A33D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
      <span
        className={`text-lg font-bold tracking-tight ${
          tone === "light" ? "text-white" : "text-navy-950"
        }`}
      >
        Lumi<span className="text-gold-500">ticket</span>
      </span>
    </span>
  );
}
