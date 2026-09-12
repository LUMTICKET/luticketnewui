"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { driverTrips, type DriverTrip } from "@/lib/dashboard-mock";

const tone = {
  upcoming: "neutral",
  "in-progress": "warning",
  completed: "success",
} as const;

function nextStatus(status: DriverTrip["status"]) {
  if (status === "upcoming") return "in-progress";
  if (status === "in-progress") return "completed";
  return status;
}

export default function DriverAppPage() {
  const { ready } = useDashboardSession();
  const [trips, setTrips] = useState(driverTrips);

  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  function advance(id: string) {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus(t.status) } : t)),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Driver</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Assigned trips, passenger manifests, and parcel handovers.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {trips.map((trip) => (
          <div key={trip.id} className="rounded-2xl border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-navy-950">{trip.route}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {trip.vehicle} · Departs {trip.departure}
                </p>
              </div>
              <Badge tone={tone[trip.status]}>{trip.status.replace("-", " ")}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xs">
              <div className="rounded-xl border border-dashed border-line p-3 text-center">
                <p className="text-lg font-bold text-navy-950">{trip.passengers}</p>
                <p className="text-xs text-ink-faint">Passengers</p>
              </div>
              <div className="rounded-xl border border-dashed border-line p-3 text-center">
                <p className="text-lg font-bold text-navy-950">{trip.parcels}</p>
                <p className="text-xs text-ink-faint">Parcel handovers</p>
              </div>
            </div>

            {trip.status !== "completed" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => advance(trip.id)}
              >
                Mark as {nextStatus(trip.status).replace("-", " ")}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
