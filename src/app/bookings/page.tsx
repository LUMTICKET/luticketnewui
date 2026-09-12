"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { sampleBookings } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { CustomerBooking } from "@/lib/types";

const filters = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
] as const;

const kindLabel = { bus: "Bus ticket", event: "Event ticket", parcel: "Parcel" } as const;

const statusTone = {
  upcoming: "warning",
  completed: "neutral",
  "in-transit": "warning",
  delivered: "success",
  cancelled: "error",
} as const;

function isPast(status: CustomerBooking["status"]) {
  return status === "completed" || status === "delivered" || status === "cancelled";
}

export default function BookingsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = sampleBookings.filter((b) => {
    if (filter === "upcoming") return !isPast(b.status);
    if (filter === "past") return isPast(b.status);
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy-950">Manage my bookings</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Bus tickets, event tickets, and parcels — all in one place.
      </p>

      <div className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-sm text-ink-muted">
        Showing example bookings for preview.{" "}
        <Link href="/login" className="font-semibold text-navy-950 hover:text-gold-600">
          Log in
        </Link>{" "}
        to see your real trips and tickets.
      </div>

      <div role="tablist" aria-label="Filter bookings" className="mt-6 flex gap-1">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.id
                ? "bg-navy-950 text-white"
                : "bg-surface-alt text-ink-muted hover:text-navy-950"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {results.length === 0 && (
          <p className="text-sm text-ink-muted">No bookings in this view.</p>
        )}

        {results.map((booking) => (
          <div key={booking.id} className="rounded-2xl border border-line p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{kindLabel[booking.kind]}</Badge>
                  <Badge tone={statusTone[booking.status]}>
                    {booking.status.replace("-", " ")}
                  </Badge>
                </div>
                <p className="mt-2 font-semibold text-navy-950">{booking.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{booking.detail}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {booking.reference} · {booking.date}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <p className="text-sm font-semibold text-navy-950">
                  {formatPrice(booking.amount, booking.currency)}
                </p>
                {booking.kind === "parcel" ? (
                  <Link
                    href={`/parcels?ref=${booking.reference}`}
                    className="text-sm font-semibold text-navy-950 hover:text-gold-600"
                  >
                    Track parcel →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => (prev === booking.id ? null : booking.id))
                    }
                    className="text-sm font-semibold text-navy-950 hover:text-gold-600"
                  >
                    {expanded === booking.id ? "Hide ticket" : "View ticket →"}
                  </button>
                )}
              </div>
            </div>

            {expanded === booking.id && booking.kind !== "parcel" && (
              <div className="mt-5 flex flex-col items-center border-t border-line pt-5 text-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-line">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    QR ticket
                  </span>
                </div>
                <p className="mt-3 text-xs text-ink-faint">
                  Available offline — present this at{" "}
                  {booking.kind === "bus" ? "boarding" : "the gate"}.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
