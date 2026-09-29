import Link from "next/link";
import { listCatalogRoutes, type CatalogRoute } from "@/lib/operations";
import { popularRoutes } from "@/lib/data";
import { SeatSelector } from "@/components/bus/SeatSelector";

export default async function BusRouteDetailPage(props: PageProps<"/bus/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const passengers = Math.max(
    1,
    Number(typeof searchParams.passengers === "string" ? searchParams.passengers : 1) || 1,
  );

  // Live catalog lookup first; the sample routes fill in when the API has no
  // matching route (or is unreachable) so the page keeps working.
  let route: CatalogRoute | null = null;
  try {
    const live = await listCatalogRoutes();
    route = live.find((r) => String(r.id) === id) ?? null;
  } catch {
    route = null;
  }

  const fallback = popularRoutes.find((r) => r.id === id) ?? popularRoutes.find((r) => String(r.id) === id);
  const source = route ?? fallback;

  if (!source) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-navy-950">Route not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This route may no longer be available. Try searching again.
        </p>
        <Link href="/bus" className="mt-4 inline-block text-sm font-semibold text-navy-950">
          ← Back to bus search
        </Link>
      </div>
    );
  }

  const display = {
    id: String(source.id),
    origin: source.origin,
    destination: source.destination,
    operator: source.operator || "Operator",
    duration: source.duration ? String(source.duration) : "",
    fromPrice: source.fromPrice,
    currency: source.currency,
    departures: source.departures ?? 1,
    rating: source.rating ?? 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/bus" className="text-sm font-semibold text-navy-950 hover:text-gold-600">
        ← Back to results
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy-950">
        {display.origin} → {display.destination}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {[display.operator, display.duration, `${display.departures} departures`]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="mt-6">
        <SeatSelector route={display} passengers={passengers} />
      </div>
    </div>
  );
}
