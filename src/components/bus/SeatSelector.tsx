"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { BusRoute } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const HOLD_SECONDS = 5 * 60;
const ROWS = 10;
const SEATS_PER_ROW = ["A", "B", "C", "D"];
const BOOKED_SEATS = new Set(["2A", "3C", "5B", "5D", "7A", "8C", "9B"]);

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SeatSelector({
  route,
  passengers,
}: {
  route: BusRoute;
  passengers: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(false);

  const seats = useMemo(() => {
    const rows: string[][] = [];
    for (let r = 1; r <= ROWS; r++) {
      rows.push(SEATS_PER_ROW.map((letter) => `${r}${letter}`));
    }
    return rows;
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      // Releasing the hold in response to the countdown reaching zero is the
      // external-timer-driven update this rule expects — not derivable state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected([]);
      setSecondsLeft(null);
      setExpiredNotice(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function toggleSeat(seat: string) {
    if (BOOKED_SEATS.has(seat) || confirmed) return;
    setExpiredNotice(false);

    setSelected((prev) => {
      if (prev.includes(seat)) {
        const next = prev.filter((s) => s !== seat);
        if (next.length === 0) setSecondsLeft(null);
        return next;
      }
      if (prev.length >= passengers) return prev;
      const next = [...prev, seat];
      if (secondsLeft === null) setSecondsLeft(HOLD_SECONDS);
      return next;
    });
  }

  const total = selected.length * route.fromPrice;
  const canContinue = selected.length === passengers && !confirmed;
  const reference = `LMT-${route.id.toUpperCase()}-${Math.abs(
    Array.from(selected.join("")).reduce((a, c) => a + c.charCodeAt(0), 7),
  )}`;

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-line p-8 text-center">
        <Badge tone="success">Booking confirmed</Badge>
        <h2 className="mt-4 text-xl font-bold text-navy-950">
          {route.origin} → {route.destination}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Seats {selected.join(", ")} · {route.operator}
        </p>

        <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            QR ticket
          </span>
        </div>

        <p className="mt-4 text-sm text-ink-muted">Reference: {reference}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Saved to your account and available offline at boarding.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Select your seats</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Choose {passengers} seat{passengers > 1 ? "s" : ""} for {route.operator}.
            </p>
          </div>
          {secondsLeft !== null && (
            <Badge tone={secondsLeft <= 30 ? "error" : "warning"}>
              Held for {formatClock(secondsLeft)}
            </Badge>
          )}
        </div>

        {expiredNotice && (
          <p role="alert" className="mt-4 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
            Your seat hold expired and was released back to availability.
            Please select again.
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="mb-2 h-8 w-full max-w-xs rounded-b-2xl border border-line text-center text-xs text-ink-faint">
            Front
          </div>
          {seats.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              {row.map((seat, idx) => {
                const booked = BOOKED_SEATS.has(seat);
                const isSelected = selected.includes(seat);
                return (
                  <div key={seat} className="flex items-center gap-2">
                    {idx === 2 && <div className="w-4" aria-hidden />}
                    <button
                      type="button"
                      disabled={booked}
                      onClick={() => toggleSeat(seat)}
                      aria-label={`Seat ${seat}${booked ? " (unavailable)" : ""}`}
                      aria-pressed={isSelected}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        booked
                          ? "cursor-not-allowed bg-surface-alt text-ink-faint"
                          : isSelected
                            ? "bg-navy-950 text-white"
                            : "border border-line text-ink hover:border-navy-300"
                      }`}
                    >
                      {seat}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-line" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-navy-950" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-surface-alt" /> Unavailable
          </span>
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-navy-950">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Route</dt>
            <dd className="text-ink">{route.origin} → {route.destination}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Seats</dt>
            <dd className="text-ink">{selected.length ? selected.join(", ") : "None selected"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Price per seat</dt>
            <dd className="text-ink">{formatPrice(route.fromPrice, route.currency)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4">
          <span className="font-semibold text-navy-950">Total</span>
          <span className="text-lg font-bold text-navy-950">
            {formatPrice(total, route.currency)}
          </span>
        </div>

        <Button
          type="button"
          variant="accent"
          size="lg"
          className="mt-6 w-full"
          disabled={!canContinue}
          onClick={() => setConfirmed(true)}
        >
          Confirm &amp; pay
        </Button>
        {!canContinue && (
          <p className="mt-2 text-center text-xs text-ink-faint">
            Select {passengers - selected.length} more seat
            {passengers - selected.length === 1 ? "" : "s"} to continue.
          </p>
        )}
      </div>
    </div>
  );
}
