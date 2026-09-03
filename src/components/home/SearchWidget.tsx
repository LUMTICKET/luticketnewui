"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type Tab = "bus" | "events" | "parcel";

const tabs: { id: Tab; label: string }[] = [
  { id: "bus", label: "Bus tickets" },
  { id: "events", label: "Events" },
  { id: "parcel", label: "Track a parcel" },
];

const inputClasses =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-navy-400";

export function SearchWidget() {
  const [tab, setTab] = useState<Tab>("bus");
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (tab === "bus") {
      const params = new URLSearchParams({ origin, destination, date });
      router.push(`/bus?${params.toString()}`);
    } else if (tab === "events") {
      const params = new URLSearchParams({ q: eventQuery });
      router.push(`/events?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ ref: trackingNo });
      router.push(`/parcels?${params.toString()}`);
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-3xl bg-surface p-2 shadow-2xl shadow-navy-950/20">
      <div
        role="tablist"
        aria-label="Search Lumiticket"
        className="flex gap-1 p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-navy-950 text-white"
                : "text-ink-muted hover:bg-surface-alt"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="p-3 pt-1">
        {tab === "bus" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="sr-only" htmlFor="origin">
              Leaving from
            </label>
            <input
              id="origin"
              className={inputClasses}
              placeholder="Leaving from"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <label className="sr-only" htmlFor="destination">
              Going to
            </label>
            <input
              id="destination"
              className={inputClasses}
              placeholder="Going to"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <label className="sr-only" htmlFor="date">
              Travel date
            </label>
            <input
              id="date"
              type="date"
              className={inputClasses}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Button type="submit" variant="accent" size="lg" className="sm:px-6">
              Search
            </Button>
          </div>
        )}

        {tab === "events" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="event-query">
              Search events, artists, or venues
            </label>
            <input
              id="event-query"
              className={inputClasses}
              placeholder="Search events, artists, or venues"
              value={eventQuery}
              onChange={(e) => setEventQuery(e.target.value)}
            />
            <Button type="submit" variant="accent" size="lg" className="sm:px-6">
              Search
            </Button>
          </div>
        )}

        {tab === "parcel" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="tracking-no">
              Parcel tracking number
            </label>
            <input
              id="tracking-no"
              className={inputClasses}
              placeholder="Enter your parcel tracking number"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
            />
            <Button type="submit" variant="accent" size="lg" className="sm:px-6">
              Track
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
