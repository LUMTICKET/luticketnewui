import Image from "next/image";
import {
  BRAND_COLORS,
  LOGO_FULL_SIZE,
  MARK_SHAPES,
  MARK_VIEWBOX,
  WORDMARK_SIZE,
} from "@/lib/brand-mark.generated";

type Tone = "dark" | "light";

/** The Lumina fan mark. `light` swaps navy for white so it reads on navy backgrounds. */
export function LogoMark({
  size = 32,
  tone = "dark",
  className = "",
  title,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  const width = (MARK_VIEWBOX.width / MARK_VIEWBOX.height) * size;

  return (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {MARK_SHAPES.map((shape, index) => (
        <path
          key={index}
          d={shape.d}
          fill={
            shape.color === "gold"
              ? BRAND_COLORS.gold
              : tone === "light"
                ? "#ffffff"
                : BRAND_COLORS.navy
          }
        />
      ))}
    </svg>
  );
}

/** Product lockup used in headers: Lumina mark + Lumiticket wordmark. */
export function Logo({
  className = "",
  tone = "dark",
  markSize = 32,
}: {
  className?: string;
  tone?: Tone;
  markSize?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} tone={tone} />
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

/** The full Lumina Holdings logo (mark + wordmark) as shipped in public/brand. */
export function LogoFull({
  tone = "dark",
  width = 160,
  className = "",
}: {
  tone?: Tone;
  width?: number;
  className?: string;
}) {
  const height = Math.round((LOGO_FULL_SIZE.height / LOGO_FULL_SIZE.width) * width);

  return (
    <Image
      src={tone === "light" ? "/brand/lumina-logo-light.png" : "/brand/lumina-logo.png"}
      alt="Lumina Holdings"
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}

/** The "LUMINA HOLDINGS" wordmark on its own — used for "a company of…" credits. */
export function LogoWordmark({
  tone = "dark",
  width = 120,
  className = "",
}: {
  tone?: Tone;
  width?: number;
  className?: string;
}) {
  const height = Math.round((WORDMARK_SIZE.height / WORDMARK_SIZE.width) * width);

  return (
    <Image
      src={tone === "light" ? "/brand/lumina-wordmark-light.png" : "/brand/lumina-wordmark.png"}
      alt="Lumina Holdings"
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
