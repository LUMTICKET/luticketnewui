import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

/** Ticket-and-route scene for the brand panel, drawn in the Lumina navy + gold. */
function TicketScene() {
  const qr = [
    "1110101", "1010011", "1110110", "0001101", "1101011", "0110100", "1011101",
  ];
  return (
    <svg viewBox="0 0 420 300" className="h-auto w-full" role="img" aria-label="Boarding pass with a QR code and a route line">
      {/* route */}
      <path d="M20 250 C90 170 150 270 230 200 S350 120 400 150" fill="none" stroke="#CC9F2F" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" opacity=".9" />
      <circle cx="20" cy="250" r="8" fill="#CC9F2F" />
      <circle cx="400" cy="150" r="8" fill="#fff" />
      <circle cx="400" cy="150" r="3.5" fill="#042045" />

      {/* back ticket */}
      <g transform="rotate(-7 210 140)">
        <rect x="70" y="40" width="270" height="150" rx="18" fill="#17396a" />
        <rect x="90" y="62" width="90" height="8" rx="4" fill="#5a83bc" opacity=".6" />
        <rect x="90" y="80" width="140" height="8" rx="4" fill="#5a83bc" opacity=".35" />
      </g>

      {/* front ticket */}
      <g transform="rotate(4 210 170)">
        <path
          d="M56 92h308a16 16 0 0 1 16 16v38a14 14 0 0 0 0 28v38a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16v-38a14 14 0 0 0 0-28v-38a16 16 0 0 1 16-16z"
          fill="#fff"
        />
        <rect x="40" y="92" width="340" height="14" rx="7" fill="#CC9F2F" />
        <text x="64" y="138" fontSize="11" fontWeight="600" fill="#8792a6" fontFamily="inherit">FROM</text>
        <text x="64" y="162" fontSize="22" fontWeight="700" fill="#042045" fontFamily="inherit">Lilongwe</text>
        <text x="64" y="192" fontSize="11" fontWeight="600" fill="#8792a6" fontFamily="inherit">TO</text>
        <text x="64" y="216" fontSize="22" fontWeight="700" fill="#042045" fontFamily="inherit">Blantyre</text>
        <line x1="236" y1="116" x2="236" y2="248" stroke="#e4e1d8" strokeWidth="2" strokeDasharray="5 6" />
        <g transform="translate(262 134)">
          {qr.flatMap((row, y) =>
            row.split("").map((c, x) =>
              c === "1" ? <rect key={`${x}-${y}`} x={x * 14} y={y * 14} width="11" height="11" rx="2.5" fill="#042045" /> : null,
            ),
          )}
        </g>
      </g>

      {/* sparkles */}
      <path d="M356 54l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="#CC9F2F" />
      <path d="M44 70l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill="#fff" opacity=".7" />
    </svg>
  );
}

export function AuthShell({
  heading,
  intro,
  panelTitle,
  panelText,
  children,
  footer,
}: {
  heading: string;
  intro: string;
  panelTitle: string;
  panelText: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-alt px-3 py-6 sm:px-6 sm:py-10">
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-surface shadow-[0_30px_80px_-30px_rgba(4,32,69,0.35)] lg:grid-cols-2 lg:p-5">
        {/* soft brand glow, top right */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-300/40 blur-3xl" />

        {/* brand panel */}
        <aside className="relative hidden flex-col overflow-hidden rounded-[2.25rem] bg-navy-950 p-10 text-white lg:flex">
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-navy-600/60 blur-3xl" />
          <h2 className="relative max-w-[18ch] text-3xl font-bold leading-tight tracking-tight">{panelTitle}</h2>
          <p className="relative mt-4 max-w-[34ch] text-sm leading-relaxed text-navy-200">{panelText}</p>
          <div className="relative mt-auto pt-8">
            <TicketScene />
          </div>
        </aside>

        {/* form side */}
        <section className="relative flex flex-col justify-center px-6 py-10 sm:px-14 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <Link href="/" aria-label="Lumticket home" className="flex justify-center">
              <Logo markSize={30} />
            </Link>
            <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-navy-950">{heading}</h1>
            <p className="mt-1.5 text-center text-sm text-ink-muted">{intro}</p>
            {children}
            <div className="mt-6 space-y-1.5 text-center text-sm text-ink-muted">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
