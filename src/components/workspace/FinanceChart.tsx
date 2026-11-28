"use client";

import { useId, useState, type PointerEvent } from "react";
import { formatPrice } from "@/lib/format";

export interface FinanceSeries {
  key: string;
  label: string;
  /** Lumticket brand colour for the line. */
  color: string;
  /** SVG dash pattern so lines stay distinguishable without relying on colour alone. */
  dash?: string;
  /** One value per day, same length as `days`. */
  values: number[];
}

const W = 720;
const H = 300;
const PAD = { top: 16, right: 30, bottom: 36, left: 64 };

function niceMax(max: number) {
  if (max <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(value: number) {
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${+(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

const dayLabel = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * Multi-line chart of money per day (revenue, commission paid to Lumticket, publishing fees).
 * Plain SVG so it adds no dependency and renders the same on Vercel and in the browser.
 */
export function FinanceChart({ days, series, currency }: { days: Date[]; series: FinanceSeries[]; currency: string }) {
  const titleId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const count = days.length;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const top = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => PAD.left + (count <= 1 ? innerW / 2 : (i / (count - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const labelEvery = Math.max(1, Math.ceil(count / 6));
  const hasData = series.some((s) => s.values.some((v) => v > 0));

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (count - 1));
    setHover(Math.min(count - 1, Math.max(0, i)));
  }

  const tipLeft = hover === null ? 0 : (x(hover) / W) * 100;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={titleId}
        className="h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <title id={titleId}>Daily revenue, commission paid to Lumticket and publishing fees paid</title>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e4e1d8" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#8792a6">{compact(t)}</text>
          </g>
        ))}

        {days.map((d, i) =>
          i % labelEvery === 0 || i === count - 1 ? (
            <text key={d.toISOString()} x={x(i)} y={H - 12} textAnchor="middle" fontSize={11} fill="#8792a6">{dayLabel(d)}</text>
          ) : null,
        )}

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dash}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {count <= 31 && s.values.map((v, i) => (v > 0 ? <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} /> : null))}
          </g>
        ))}

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#042045" strokeOpacity={0.25} strokeWidth={1} />
            {series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill="#fff" stroke={s.color} strokeWidth={2.5} />)}
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 60 ? "-105%" : "5%"})` }}
        >
          <p className="font-semibold text-navy-950">{days[hover]?.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</p>
          {series.map((s) => (
            <p key={s.key} className="mt-1 flex items-center justify-between gap-3 text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <span className="font-semibold text-navy-950">{formatPrice(s.values[hover] ?? 0, currency)}</span>
            </p>
          ))}
        </div>
      )}

      {!hasData && (
        <p className="absolute inset-x-0 top-1/3 text-center text-sm text-ink-muted">No activity in this period yet. Sales and fees will appear here automatically.</p>
      )}
    </div>
  );
}
