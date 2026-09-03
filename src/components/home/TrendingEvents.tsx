import Link from "next/link";
import { trendingEvents } from "@/lib/data";
import { formatEventDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const statusTone = {
  "on-sale": "success",
  "selling-fast": "warning",
  "sold-out": "error",
} as const;

const statusLabel = {
  "on-sale": "On sale",
  "selling-fast": "Selling fast",
  "sold-out": "Sold out",
} as const;

export function TrendingEvents() {
  return (
    <section className="bg-surface-alt">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
              Trending events
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Concerts, festivals, and conferences across the region.
            </p>
          </div>
          <Link
            href="/events"
            className="hidden shrink-0 text-sm font-semibold text-navy-950 hover:text-gold-600 sm:block"
          >
            View all events →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trendingEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
            >
              <div className="flex h-28 items-center justify-center bg-navy-950">
                <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                  {event.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Badge tone={statusTone[event.status]}>
                  {statusLabel[event.status]}
                </Badge>
                <h3 className="mt-3 text-base font-bold text-navy-950">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {event.venue}, {event.city}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatEventDate(event.date)}
                </p>
                <div className="mt-auto flex items-end justify-between pt-4">
                  <div>
                    <p className="text-xs text-ink-faint">From</p>
                    <p className="text-base font-bold text-navy-950">
                      {formatPrice(event.fromPrice, event.currency)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gold-600 group-hover:text-gold-700">
                    Get tickets →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
