"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { busSchedules, driverTrips, fleetVehicles, parcelQueue, type DriverTrip, type ParcelJob } from "@/lib/dashboard-mock";
import {
  busBookings,
  busCompliance,
  courierCompliance,
  courierRoster,
  type BusBooking,
  type ComplianceItem,
} from "@/lib/workspace-mock";
import { formatPrice } from "@/lib/format";
import { Card, PageHeader, TableShell, THead, cell, inputClass, rowClass } from "../ui";

// ---------------------------------------------------------------------------
// Bus operator
// ---------------------------------------------------------------------------
const scheduleTone = { scheduled: "neutral", boarding: "warning", departed: "success", completed: "neutral" } as const;
const vehicleTone = { active: "success", maintenance: "warning", inactive: "error" } as const;

export function SchedulesFleetPanel() {
  const [holdMinutes, setHoldMinutes] = useState(5);

  return (
    <div>
      <PageHeader
        title="Schedules & fleet"
        description="Departures, vehicles, and how long selected seats are held while a customer pays."
        demo
      />

      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Seat hold duration</h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              A selected seat is held this long. If payment isn&apos;t confirmed in time it&apos;s released back to
              availability automatically.
            </p>
          </div>
          <select
            aria-label="Seat hold duration"
            value={holdMinutes}
            onChange={(e) => setHoldMinutes(Number(e.target.value))}
            className="h-11 rounded-lg border border-line bg-surface px-3 text-sm focus:border-navy-400"
          >
            {[3, 5, 10, 15].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="mt-6">
        <TableShell>
          <THead columns={["Route", "Vehicle", "Driver", "Departure", "Seats", "Status"]} />
          <tbody>
            {busSchedules.map((row) => (
              <tr key={row.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{row.route}</td>
                <td className={`${cell} text-ink-muted`}>{row.vehicle}</td>
                <td className={`${cell} text-ink-muted`}>{row.driver}</td>
                <td className={`${cell} text-ink-muted`}>{row.departure}</td>
                <td className={`${cell} text-ink-muted`}>{row.seatsSold}/{row.seatsTotal}</td>
                <td className={cell}><Badge tone={scheduleTone[row.status]}>{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <h2 className="mt-8 text-lg font-bold text-navy-950">Fleet</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fleetVehicles.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy-950">{v.plate}</p>
              <Badge tone={vehicleTone[v.status]}>{v.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{v.type}</p>
            <p className="mt-3 text-xs text-ink-faint">Roadworthy until {v.roadworthyExpiry}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

const bookingTone = { confirmed: "warning", "checked-in": "success", cancelled: "error" } as const;

export function BusBookingsPanel() {
  const [bookings, setBookings] = useState<BusBooking[]>(busBookings);

  function update(id: string, status: BusBooking["status"]) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Process bookings and cancellations for your trips, and see whether each was sold online or at a POS."
        demo
      />
      <div className="mt-8">
        <TableShell>
          <THead columns={["Reference", "Passenger", "Route", "Seats", "Channel", "Amount", "Status", ""]} />
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{b.ref}</td>
                <td className={`${cell} text-ink-muted`}>{b.passenger}</td>
                <td className={`${cell} text-ink-muted`}>{b.route}</td>
                <td className={`${cell} text-ink-muted`}>{b.seats}</td>
                <td className={cell}><Badge tone="neutral">{b.channel === "pos" ? "POS" : "Online"}</Badge></td>
                <td className={`${cell} text-ink`}>{formatPrice(b.amount, b.currency)}</td>
                <td className={cell}><Badge tone={bookingTone[b.status]}>{b.status.replace("-", " ")}</Badge></td>
                <td className={`${cell} text-right`}>
                  {b.status === "confirmed" && (
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => update(b.id, "checked-in")}>Check in</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => update(b.id, "cancelled")}>Cancel</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

const tripTone = { upcoming: "neutral", "in-progress": "warning", completed: "success" } as const;

function nextTripStatus(status: DriverTrip["status"]) {
  if (status === "upcoming") return "in-progress";
  if (status === "in-progress") return "completed";
  return status;
}

export function DriverTripsPanel() {
  const [trips, setTrips] = useState(driverTrips);

  return (
    <div>
      <PageHeader
        title="Dispatch & drivers"
        description="Assigned trips, passenger manifests and parcel handovers — as your drivers see them in the Driver app."
        demo
      />
      <div className="mt-8 flex flex-col gap-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-navy-950">{trip.route}</p>
                <p className="mt-1 text-sm text-ink-muted">{trip.vehicle} · Departs {trip.departure}</p>
              </div>
              <Badge tone={tripTone[trip.status]}>{trip.status.replace("-", " ")}</Badge>
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
                onClick={() => setTrips((prev) => prev.map((t) => (t.id === trip.id ? { ...t, status: nextTripStatus(t.status) } : t)))}
              >
                Mark as {nextTripStatus(trip.status).replace("-", " ")}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Courier operator
// ---------------------------------------------------------------------------
const stages: ParcelJob["status"][] = ["registered", "in-transit", "out-for-delivery", "delivered"];
const parcelTone = { registered: "neutral", "in-transit": "warning", "out-for-delivery": "warning", delivered: "success", failed: "error" } as const;

function nextStage(status: ParcelJob["status"]) {
  const index = stages.indexOf(status);
  return index === -1 || index === stages.length - 1 ? status : stages[index + 1];
}

export function ParcelQueuePanel() {
  const [jobs, setJobs] = useState(parcelQueue);

  return (
    <div>
      <PageHeader
        title="Parcel queue"
        description="Move each parcel through its handling stages. A parcel is only closed once delivery is confirmed digitally."
        demo
      />
      <div className="mt-8 flex flex-col gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-navy-950">{job.ref}</p>
              <p className="mt-1 text-sm text-ink-muted">{job.sender} → {job.recipient} · {job.route}</p>
              <p className="mt-1 text-xs text-ink-faint">Courier: {job.courier} · {job.weight}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={parcelTone[job.status]}>{job.status.replace(/-/g, " ")}</Badge>
              {job.status !== "delivered" && job.status !== "failed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: nextStage(j.status) } : j)))}
                >
                  Mark as {nextStage(job.status).replace(/-/g, " ")}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const courierTone = { available: "success", "on-route": "warning", "off-duty": "neutral" } as const;

export function CourierDispatchPanel() {
  const [jobs, setJobs] = useState(parcelQueue);
  const [assignParcel, setAssignParcel] = useState("");
  const [assignCourier, setAssignCourier] = useState("");
  const [notice, setNotice] = useState("");

  const unassigned = jobs.filter((j) => j.courier === "Unassigned");

  function assign() {
    const courier = courierRoster.find((c) => c.id === assignCourier);
    if (!courier || !assignParcel) return;
    setJobs((prev) => prev.map((j) => (j.id === assignParcel ? { ...j, courier: courier.name } : j)));
    setNotice(`Assigned to ${courier.name}.`);
    setAssignParcel("");
  }

  return (
    <div>
      <PageHeader
        title="Couriers & dispatch"
        description="See who is available in each zone and assign parcels to couriers."
        demo
      />

      <div className="mt-8">
        <TableShell>
          <THead columns={["Courier", "Zone", "Vehicle", "Active parcels", "Status"]} />
          <tbody>
            {courierRoster.map((c) => (
              <tr key={c.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{c.name}</td>
                <td className={`${cell} text-ink-muted`}>{c.zone}</td>
                <td className={`${cell} text-ink-muted`}>{c.vehicle}</td>
                <td className={`${cell} text-ink-muted`}>{c.activeParcels}</td>
                <td className={cell}><Badge tone={courierTone[c.status]}>{c.status.replace("-", " ")}</Badge></td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Assign a parcel</h2>
        {unassigned.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Every parcel in the queue has a courier.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select aria-label="Parcel" value={assignParcel} onChange={(e) => setAssignParcel(e.target.value)} className={inputClass}>
              <option value="">Choose a parcel</option>
              {unassigned.map((j) => (
                <option key={j.id} value={j.id}>{j.ref} — {j.route}</option>
              ))}
            </select>
            <select aria-label="Courier" value={assignCourier} onChange={(e) => setAssignCourier(e.target.value)} className={inputClass}>
              <option value="">Choose a courier</option>
              {courierRoster.filter((c) => c.status !== "off-duty").map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.zone}</option>
              ))}
            </select>
            <Button type="button" variant="accent" size="md" onClick={assign} disabled={!assignParcel || !assignCourier}>
              Assign
            </Button>
          </div>
        )}
        {notice && <p role="status" className="mt-3 text-sm text-success">{notice}</p>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance (bus + courier)
// ---------------------------------------------------------------------------
function complianceStatus(item: ComplianceItem) {
  if (item.daysLeft < 0) return { label: "Lapsed", tone: "error" } as const;
  if (item.daysLeft <= 30) return { label: `Expires in ${item.daysLeft}d`, tone: "warning" } as const;
  return { label: "Valid", tone: "success" } as const;
}

function CompliancePanel({ items, description }: { items: ComplianceItem[]; description: string }) {
  const lapsed = items.filter((i) => i.daysLeft < 0).length;
  const expiring = items.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 30).length;

  return (
    <div>
      <PageHeader title="Compliance" description={description} demo />

      {(lapsed > 0 || expiring > 0) && (
        <p role="status" className="mt-6 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
          {lapsed > 0 && <><strong>{lapsed} lapsed</strong> — the account is flagged and may be suspended until it is renewed. </>}
          {expiring > 0 && <><strong>{expiring} expiring within 30 days.</strong></>}
        </p>
      )}

      <div className="mt-6">
        <TableShell>
          <THead columns={["Item", "Subject", "Expires", "Status"]} />
          <tbody>
            {items.map((item) => {
              const status = complianceStatus(item);
              return (
                <tr key={item.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{item.kind}</td>
                  <td className={`${cell} text-ink-muted`}>{item.subject}</td>
                  <td className={`${cell} text-ink-muted`}>{item.expires}</td>
                  <td className={cell}><Badge tone={status.tone}>{status.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

export function BusCompliancePanel() {
  return (
    <CompliancePanel
      items={busCompliance}
      description="Operator licence, roadworthiness and public service vehicle insurance. Lapsed documents flag or suspend the account automatically."
    />
  );
}

export function CourierCompliancePanel() {
  return (
    <CompliancePanel
      items={courierCompliance}
      description="Courier operating licence, vehicle registrations, rider licences and Goods-in-Transit insurance. Lapsed documents flag or suspend the account automatically."
    />
  );
}
