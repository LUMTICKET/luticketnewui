import Link from "next/link";
import { popularRoutes } from "@/lib/data";
import { SeatSelector } from "@/components/bus/SeatSelector";

export default async function BusRouteDetailPage(props: PageProps<"/bus/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const passengers = Math.max(
    1,
    Number(typeof searchParams.passengers === "string" ? searchParams.passengers : 1) || 1,
  );

  const route = popularRoutes.find((r) => r.id === id);

  if (!route) {
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/bus" className="text-sm font-semibold text-navy-950 hover:text-gold-600">
        ← Back to results
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy-950">
        {route.origin} → {route.destination}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {route.operator} · {route.duration} · {route.departures} departures today
      </p>

      <div className="mt-6">
        <SeatSelector route={route} passengers={passengers} />
      </div>
    </div>
  );
}
