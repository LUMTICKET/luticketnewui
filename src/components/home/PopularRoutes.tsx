import Link from "next/link";
import { popularRoutes } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export function PopularRoutes() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            Popular bus routes
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Trusted operators, live seat availability, instant QR tickets.
          </p>
        </div>
        <Link
          href="/bus"
          className="hidden shrink-0 text-sm font-semibold text-navy-950 hover:text-gold-600 sm:block"
        >
          View all routes →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {popularRoutes.map((route) => (
          <Link
            key={route.id}
            href={`/bus/${route.id}`}
            className="group rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
          >
            <div className="flex items-center justify-between text-sm font-medium text-ink-muted">
              <span>{route.operator}</span>
              <span className="inline-flex items-center gap-1 text-navy-950">
                <StarIcon />
                {route.rating}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-lg font-bold text-navy-950">
              <span>{route.origin}</span>
              <span aria-hidden className="text-ink-faint">
                →
              </span>
              <span>{route.destination}</span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-sm text-ink-muted">
              <span>{route.duration}</span>
              <span aria-hidden>·</span>
              <span>{route.departures} departures today</span>
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-ink-faint">From</p>
                <p className="text-lg font-bold text-navy-950">
                  {formatPrice(route.fromPrice, route.currency)}
                </p>
              </div>
              <span className="text-sm font-semibold text-gold-600 group-hover:text-gold-700">
                Select seats →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1l1.8 3.7 4.1.6-3 2.9.7 4.1L7 10.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6L7 1z"
        fill="currentColor" className="text-gold-500"
      />
    </svg>
  );
}
