"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { countries } from "@/lib/data";

type Module = "bus" | "events" | "parcel";
type TripType = "oneway" | "return";

const fieldBase =
  "h-13 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-navy-400";
const iconWrapClasses =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint";

interface ModuleSearchBarProps {
  module: Module;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
  defaultReturnDate?: string;
  defaultTripType?: TripType;
  defaultPassengers?: number;
  defaultQuery?: string;
  defaultCountry?: string;
  defaultRef?: string;
}

export function ModuleSearchBar({
  module,
  defaultOrigin = "",
  defaultDestination = "",
  defaultDate = "",
  defaultReturnDate = "",
  defaultTripType = "oneway",
  defaultPassengers = 1,
  defaultQuery = "",
  defaultCountry = "",
  defaultRef = "",
}: ModuleSearchBarProps) {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [tripType, setTripType] = useState<TripType>(defaultTripType);
  const [date, setDate] = useState(defaultDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [eventQuery, setEventQuery] = useState(defaultQuery);
  const [eventCountry, setEventCountry] = useState(defaultCountry);
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
      const params = new URLSearchParams({
        origin,
        destination,
        date,
        tripType,
        passengers: String(passengers),
      });
      if (tripType === "return" && returnDate) {
        params.set("returnDate", returnDate);
      }
      router.push(`/bus?${params.toString()}`);
    } else if (module === "events") {
      const params = new URLSearchParams({ q: eventQuery, country: eventCountry });
      router.push(`/events?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ ref: trackingNo });
      router.push(`/parcels?${params.toString()}`);
    }
  }

  return (
    <div
      id="module-search"
      className="w-full max-w-4xl scroll-mt-28 rounded-3xl bg-surface p-4 shadow-2xl shadow-navy-950/20"
    >
      <form onSubmit={onSubmit}>
        {module === "bus" && (
          <div className="flex flex-col gap-3">
            <div role="radiogroup" aria-label="Trip type" className="flex gap-1">
              {(
                [
                  { id: "oneway", label: "One way" },
                  { id: "return", label: "Return" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={tripType === opt.id}
                  onClick={() => setTripType(opt.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    tripType === opt.id
                      ? "bg-navy-950 text-white"
                      : "bg-surface-alt text-ink-muted hover:text-navy-950"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[180px] flex-1 basis-48">
                <label className="sr-only" htmlFor="origin">
                  Leaving from
                </label>
                <span className={iconWrapClasses}>
                  <PinIcon />
                </span>
                <input
                  id="origin"
                  ref={firstFieldRef}
                  className={fieldBase}
                  placeholder="Leaving from"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>

              <div className="relative min-w-[180px] flex-1 basis-48">
                <label className="sr-only" htmlFor="destination">
                  Going to
                </label>
                <span className={iconWrapClasses}>
                  <BusIcon />
                </span>
                <input
                  id="destination"
                  className={fieldBase}
                  placeholder="Going to"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="relative min-w-[150px] flex-1 basis-40">
                <label className="sr-only" htmlFor="date">
                  Travel date
                </label>
                <span className={iconWrapClasses}>
                  <CalendarIcon />
                </span>
                <input
                  id="date"
                  type="date"
                  className={fieldBase}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {tripType === "return" && (
                <div className="relative min-w-[150px] flex-1 basis-40">
                  <label className="sr-only" htmlFor="return-date">
                    Return date
                  </label>
                  <span className={iconWrapClasses}>
                    <CalendarIcon />
                  </span>
                  <input
                    id="return-date"
                    type="date"
                    className={fieldBase}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              )}

              <div className="relative min-w-[150px] flex-1 basis-40">
                <label className="sr-only" htmlFor="passengers">
                  Passengers
                </label>
                <span className={iconWrapClasses}>
                  <UsersIcon />
                </span>
                <select
                  id="passengers"
                  className={`${fieldBase} appearance-none`}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} passenger{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full sm:w-auto sm:px-8"
              >
                Search
              </Button>
            </div>
          </div>
        )}

        {module === "events" && (
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-[2] basis-72">
              <label className="sr-only" htmlFor="event-query">
                Search events, artists, or venues
              </label>
              <span className={iconWrapClasses}>
                <SearchIcon />
              </span>
              <input
                id="event-query"
                ref={firstFieldRef}
                className={fieldBase}
                placeholder="Search events, artists, or venues"
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
              />
            </div>

            <div className="relative min-w-[170px] flex-1 basis-44">
              <label className="sr-only" htmlFor="event-country">
                Country
              </label>
              <span className={iconWrapClasses}>
                <PinIcon />
              </span>
              <select
                id="event-country"
                className={`${fieldBase} appearance-none`}
                value={eventCountry}
                onChange={(e) => setEventCountry(e.target.value)}
              >
                <option value="">Any country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full sm:w-auto sm:px-8"
            >
              Search
            </Button>
          </div>
        )}

        {module === "parcel" && (
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1 basis-72">
              <label className="sr-only" htmlFor="tracking-no">
                Parcel tracking number
              </label>
              <span className={iconWrapClasses}>
                <SearchIcon />
              </span>
              <input
                id="tracking-no"
                ref={firstFieldRef}
                className={fieldBase}
                placeholder="Enter your parcel tracking number"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full sm:w-auto sm:px-8"
            >
              Track
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 15s5-4.35 5-8.2A5 5 0 003 6.8C3 10.65 8 15 8 15z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.6" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5" cy="13" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.8 14c.4-2.4 2.1-3.8 4.2-3.8s3.8 1.4 4.2 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.5" cy="5.8" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.3 10.6c1.6.2 2.8 1.3 3.1 3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 14l-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
