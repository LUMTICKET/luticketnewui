"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type Module = "bus" | "events" | "parcel";

const inputClasses =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-navy-400";

interface ModuleSearchBarProps {
  module: Module;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
  defaultQuery?: string;
  defaultRef?: string;
}

export function ModuleSearchBar({
  module,
  defaultOrigin = "",
  defaultDestination = "",
  defaultDate = "",
  defaultQuery = "",
  defaultRef = "",
}: ModuleSearchBarProps) {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [eventQuery, setEventQuery] = useState(defaultQuery);
  const [trackingNo, setTrackingNo] = useState(defaultRef);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#module-search") {
      firstFieldRef.current?.focus();
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (module === "bus") {
      const params = new URLSearchParams({ origin, destination, date });
      router.push(`/bus?${params.toString()}`);
    } else if (module === "events") {
      const params = new URLSearchParams({ q: eventQuery });
      router.push(`/events?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ ref: trackingNo });
      router.push(`/parcels?${params.toString()}`);
    }
  }

  return (
    <div
      id="module-search"
      className="w-full max-w-3xl scroll-mt-28 rounded-3xl bg-surface p-3 shadow-2xl shadow-navy-950/20"
    >
      <form onSubmit={onSubmit}>
        {module === "bus" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="sr-only" htmlFor="origin">
              Leaving from
            </label>
            <input
              id="origin"
              ref={firstFieldRef}
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

        {module === "events" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="event-query">
              Search events, artists, or venues
            </label>
            <input
              id="event-query"
              ref={firstFieldRef}
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

        {module === "parcel" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="tracking-no">
              Parcel tracking number
            </label>
            <input
              id="tracking-no"
              ref={firstFieldRef}
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
