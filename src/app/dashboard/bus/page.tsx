"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { busSchedules, fleetVehicles } from "@/lib/dashboard-mock";

const scheduleTone = {
  scheduled: "neutral",
  boarding: "warning",
  departed: "success",
  completed: "neutral",
} as const;

const vehicleTone = {
  active: "success",
  maintenance: "warning",
  inactive: "error",
} as const;

export default function BusOperatorPage() {
  const { ready } = useDashboardSession();
  const [holdMinutes, setHoldMinutes] = useState(5);

  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Bus operator</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Schedules, fleet, and seat-hold configuration.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Seat hold duration</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Selected seats are held for this long before payment must be
              confirmed, then released back to availability (FR-21/22).
            </p>
          </div>
          <select
            value={holdMinutes}
            onChange={(e) => setHoldMinutes(Number(e.target.value))}
            className="h-11 rounded-lg border border-line bg-surface px-3 text-sm focus:border-navy-400"
          >
            {[3, 5, 10, 15].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Departure</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {busSchedules.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-navy-950">{row.route}</td>
                <td className="px-4 py-3 text-ink-muted">{row.vehicle}</td>
                <td className="px-4 py-3 text-ink-muted">{row.driver}</td>
                <td className="px-4 py-3 text-ink-muted">{row.departure}</td>
                <td className="px-4 py-3 text-ink-muted">{row.seatsSold}/{row.seatsTotal}</td>
                <td className="px-4 py-3">
                  <Badge tone={scheduleTone[row.status]}>{row.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold text-navy-950">Fleet</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fleetVehicles.map((v) => (
          <div key={v.id} className="rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy-950">{v.plate}</p>
              <Badge tone={vehicleTone[v.status]}>{v.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{v.type}</p>
            <p className="mt-3 text-xs text-ink-faint">
              Roadworthy until {v.roadworthyExpiry}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
