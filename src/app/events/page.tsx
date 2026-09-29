import { listCatalogEvents, type CatalogEvent } from "@/lib/operations";
import { countries, trendingEvents } from "@/lib/data";
import { formatEventDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { SearchBand } from "@/components/search/SearchBand";
import { ModuleSearchBar } from "@/components/search/ModuleSearchBar";
import Link from "next/link";

export const metadata = {
  title: "Events — Lumiticket",
};

const statusTone = {
  "on-sale": "success",
  "selling-fast": "warning",
  "sold-out": "error",
} as const;

interface DisplayEvent {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  countryCode: string;
  date: string;
  fromPrice: number;
  currency: string;
  status: "on-sale" | "selling-fast" | "sold-out";
}

function fromApi(event: CatalogEvent): DisplayEvent {
  return {
    id: String(event.id),
    title: event.title,
    category: event.category,
    venue: event.venue || event.location || "",
    city: event.city || "",
    countryCode: event.countryCode || "",
    date: event.startsAt,
    fromPrice: event.fromPrice,
    currency: event.currency,
    status: event.status,
  };
}

export default async function EventsPage(props: PageProps<"/events">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const country = typeof params.country === "string" ? params.country : "";
  const countryName = countries.find((c) => c.code === country)?.name;

  // Live catalog first; the sample listings are the fallback while the API is
  // empty or unreachable so the page never blanks.
  let live: CatalogEvent[] = [];
  try {
    live = await listCatalogEvents({ country: country || undefined, q: q || undefined });
  } catch {
    live = [];
  }

  const liveResults = live.map(fromApi).filter(
    (e) =>
      (!q ||
        e.title.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)) &&
      (!country || e.countryCode === country),
  );

  const sampleResults = trendingEvents
    .map((e) => ({ ...e, id: String(e.id) }))
    .filter(
      (e) =>
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)) &&
        (!country || e.countryCode === country),
    );

  const seen = new Set(liveResults.map((e) => e.title.toLowerCase()));
  const results = [...liveResults, ...sampleResults.filter((e) => !seen.has(e.title.toLowerCase()))];

  return (
    <div>
      <SearchBand>
        <ModuleSearchBar module="events" defaultQuery={q} defaultCountry={country} />
      </SearchBand>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy-950">
          {q
            ? `Events matching “${q}”`
            : countryName
              ? `Events in ${countryName}`
              : "All events"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {results.length} event{results.length === 1 ? "" : "s"}
          {countryName ? ` in ${countryName}` : " across the region"}.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-line transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
            >
              <div className="flex h-28 items-center justify-center bg-navy-950">
                <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                  {event.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Badge tone={statusTone[event.status]}>
                  {event.status.replace("-", " ")}
                </Badge>
                <h3 className="mt-3 text-base font-bold text-navy-950">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {event.venue}
                  {event.city ? `, ${event.city}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatEventDate(event.date)}
                </p>
                <p className="mt-auto pt-4 text-base font-bold text-navy-950">
                  From {formatPrice(event.fromPrice, event.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted">
            No events match that search yet. Try a different term or country.
          </div>
        )}
      </div>
    </div>
  );
}
