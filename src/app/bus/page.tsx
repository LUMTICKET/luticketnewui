import Link from "next/link";
import { popularRoutes } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { SearchBand } from "@/components/search/SearchBand";
import { ModuleSearchBar } from "@/components/search/ModuleSearchBar";

export const metadata = {
  title: "Bus tickets — Lumiticket",
};

export default async function BusSearchPage(props: PageProps<"/bus">) {
  const params = await props.searchParams;
  const origin = typeof params.origin === "string" ? params.origin : "";
  const destination =
    typeof params.destination === "string" ? params.destination : "";
  const date = typeof params.date === "string" ? params.date : "";
  const returnDate =
    typeof params.returnDate === "string" ? params.returnDate : "";
  const tripType = params.tripType === "return" ? "return" : "oneway";
  const passengers = Math.max(
    1,
    Number(typeof params.passengers === "string" ? params.passengers : 1) || 1,
  );

  const results = popularRoutes.filter(
    (r) =>
      (!origin || r.origin.toLowerCase().includes(origin.toLowerCase())) &&
      (!destination ||
        r.destination.toLowerCase().includes(destination.toLowerCase())),
  );

  return (
    <div>
      <SearchBand>
        <ModuleSearchBar
          module="bus"
          defaultOrigin={origin}
          defaultDestination={destination}
          defaultDate={date}
          defaultReturnDate={returnDate}
          defaultTripType={tripType}
          defaultPassengers={passengers}
        />
      </SearchBand>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-navy-950">
            {origin || destination
              ? `${origin || "Anywhere"} → ${destination || "Anywhere"}`
              : "All bus routes"}
          </h1>
          <Badge tone="neutral">
            {results.length} result{results.length === 1 ? "" : "s"}
          </Badge>
          <Badge tone="neutral">
            {tripType === "return" ? "Return" : "One way"}
          </Badge>
          <Badge tone="neutral">
            {passengers} passenger{passengers > 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Prices shown are per seat, from selected operators. Final price
          confirmed at checkout.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-line p-5">
            <h2 className="text-sm font-bold text-navy-950">Filters</h2>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Departure time
              </p>
              <div className="mt-2 flex flex-col gap-2 text-sm text-ink">
                {[
                  "Morning (05:00–11:00)",
                  "Afternoon (11:00–17:00)",
                  "Evening (17:00–23:00)",
                ].map((label) => (
                  <label key={label} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-navy-950"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Operator
              </p>
              <div className="mt-2 flex flex-col gap-2 text-sm text-ink">
                {[...new Set(popularRoutes.map((r) => r.operator))].map(
                  (op) => (
                    <label key={op} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-navy-950"
                      />
                      {op}
                    </label>
                  ),
                )}
              </div>
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            {results.map((route) => (
              <div
                key={route.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-line p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium text-ink-muted">
                    {route.operator}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-lg font-bold text-navy-950">
                    <span>{route.origin}</span>
                    <span aria-hidden className="text-ink-faint">
                      →
                    </span>
                    <span>{route.destination}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {route.duration} · {route.departures} departures today
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2">
                  <div className="text-right">
                    <p className="text-xs text-ink-faint">From</p>
                    <p className="text-xl font-bold text-navy-950">
                      {formatPrice(route.fromPrice, route.currency)}
                    </p>
                  </div>
                  <Link
                    href={`/bus/${route.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-navy-950 px-5 text-sm font-semibold text-white hover:bg-navy-800"
                  >
                    Select seats
                  </Link>
                </div>
              </div>
            ))}

            {results.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted">
                No routes match that search yet. Try a different origin or
                destination.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
