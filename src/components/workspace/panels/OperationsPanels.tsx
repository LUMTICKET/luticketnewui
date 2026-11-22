"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import {
  createAssignment,
  createBusBooking,
  createComplianceDocument,
  createCourier,
  createSchedule,
  createVehicle,
  deleteAssignment,
  deleteBusBooking,
  deleteComplianceDocument,
  deleteCourier,
  deleteSchedule,
  deleteVehicle,
  listAssignments,
  listBusBookings,
  listCompliance,
  listCouriers,
  listDrivers,
  listFleet,
  listParcels,
  listSchedules,
  updateAssignment,
  updateBusBooking,
  updateCourier,
  updateSchedule,
  updateVehicle,
  type BusBooking as ApiBusBooking,
  type ComplianceDocument,
  type Courier,
  type DriverAssignment,
  type FleetVehicle,
  type Schedule,
} from "@/lib/operations";
import { Card, PageHeader, TableShell, THead, cell, inputClass, rowClass } from "../ui";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** Standard load/error wrapper used by every operator panel below. */
function useApiList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((loaded) => {
        if (!cancelled) setItems(loaded);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setItems([]);
          setError(requestError instanceof Error ? requestError.message : "Request failed.");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { items, setItems, error, setError, reload };
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Try again
        </button>
      )}
    </p>
  );
}

function Loading() {
  return <p className="mt-8 text-sm text-ink-muted">Loading…</p>;
}

// ---------------------------------------------------------------------------
// Bus operator: schedules & fleet
// ---------------------------------------------------------------------------
const scheduleTone: Record<string, "neutral" | "warning" | "success"> = { scheduled: "neutral", boarding: "warning", departed: "success", completed: "neutral" };
const vehicleTone: Record<string, "success" | "warning" | "error"> = { active: "success", maintenance: "warning", inactive: "error" };

export function SchedulesFleetPanel() {
  return (
    <div>
      <PageHeader
        title="Schedules & fleet"
        description="Departures, vehicles, and how long selected seats are held while a customer pays."
      />
      <div className="mt-8 flex flex-col gap-10">
        <FleetSection />
        <SchedulesSection />
      </div>
    </div>
  );
}

function FleetSection() {
  const { items: vehicles, setItems, error, setError, reload } = useApiList(listFleet);
  const [busy, setBusy] = useState(false);

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await createVehicle({
        plate: String(data.get("plate") || "").trim(),
        type: String(data.get("type") || "") || undefined,
        capacity: Number(data.get("capacity") || 0) || undefined,
        roadworthyExpiry: String(data.get("roadworthyExpiry") || "") || undefined,
        status: "active",
      });
      setItems((prev) => [...(prev ?? []), created]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add the vehicle.");
    } finally {
      setBusy(false);
    }
  }

  async function setVehicleStatus(vehicle: FleetVehicle, status: FleetVehicle["status"]) {
    setItems((prev) => prev?.map((v) => (v.id === vehicle.id ? { ...v, status } : v)) ?? prev);
    try {
      await updateVehicle(vehicle.id, { status });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the vehicle.");
      reload();
    }
  }

  async function removeVehicle(vehicle: FleetVehicle) {
    try {
      await deleteVehicle(vehicle.id);
      setItems((prev) => prev?.filter((v) => v.id !== vehicle.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove the vehicle.");
    }
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-navy-950">Fleet</h2>
      <ErrorNotice message={error} onRetry={reload} />
      {vehicles === null ? (
        <Loading />
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy-950">{v.plate}</p>
                <Badge tone={vehicleTone[v.status] ?? "neutral"}>{v.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{v.type || "Vehicle"}</p>
              {typeof v.capacity === "number" && <p className="mt-1 text-xs text-ink-faint">{v.capacity} seats</p>}
              <p className="mt-3 text-xs text-ink-faint">
                {v.roadworthyExpiry ? `Roadworthy until ${v.roadworthyExpiry.slice(0, 10)}` : "No roadworthy date recorded"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {v.status !== "active" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => void setVehicleStatus(v, "active")}>
                    Set active
                  </Button>
                )}
                {v.status !== "maintenance" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => void setVehicleStatus(v, "maintenance")}>
                    Maintenance
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => void removeVehicle(v)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
          {vehicles.length === 0 && <p className="text-sm text-ink-muted">No vehicles yet — add your first one below.</p>}
        </div>
      )}

      <Card className="mt-4">
        <h3 className="text-sm font-bold text-navy-950">Add a vehicle</h3>
        <form onSubmit={addVehicle} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_130px_170px_auto]">
          <input name="plate" required placeholder="Plate e.g. BT 4521" aria-label="Plate" className={inputClass} />
          <input name="type" placeholder="Type e.g. Coach (62 seats)" aria-label="Vehicle type" className={inputClass} />
          <input name="capacity" type="number" min={1} placeholder="Seats" aria-label="Capacity" className={inputClass} />
          <input name="roadworthyExpiry" type="date" aria-label="Roadworthy expiry" className={inputClass} />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Add
          </Button>
        </form>
      </Card>
    </section>
  );
}

function SchedulesSection() {
  const { items: schedules, setItems, error, setError, reload } = useApiList(listSchedules);
  const { items: vehicles } = useApiList(listFleet);
  const [busy, setBusy] = useState(false);

  function nextStatus(status: Schedule["status"]) {
    if (status === "scheduled") return "boarding";
    if (status === "boarding") return "departed";
    if (status === "departed") return "completed";
    return status;
  }

  async function advance(schedule: Schedule) {
    const status = nextStatus(schedule.status);
    setItems((prev) => prev?.map((s) => (s.id === schedule.id ? { ...s, status } : s)) ?? prev);
    try {
      await updateSchedule(schedule.id, { status });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the departure.");
      reload();
    }
  }

  async function remove(schedule: Schedule) {
    try {
      await deleteSchedule(schedule.id);
      setItems((prev) => prev?.filter((s) => s.id !== schedule.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the departure.");
    }
  }

  async function addSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const vehicleId = String(data.get("vehicleId") || "");
    setBusy(true);
    setError("");
    try {
      const created = await createSchedule({
        // The API keys departures to a published listing (event row) of this operator.
        routeId: String(data.get("routeId") || ""),
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        departureAt: new Date(String(data.get("departureAt") || "")).toISOString(),
      });
      setItems((prev) => [...(prev ?? []), created]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the departure.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-navy-950">Departures</h2>
      <ErrorNotice message={error} onRetry={reload} />
      {schedules === null ? (
        <Loading />
      ) : (
        <div className="mt-3">
          <TableShell>
            <THead columns={["Route", "Vehicle", "Driver", "Departure", "Seats", "Status", ""]} />
            <tbody>
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                    No departures yet.
                  </td>
                </tr>
              )}
              {schedules.map((row) => (
                <tr key={row.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>
                    {row.origin || `Route ${row.routeId ?? "—"}`} → {row.destination || ""}
                  </td>
                  <td className={`${cell} text-ink-muted`}>{row.plate || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>{row.driverName || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>
                    {row.departureAt ? new Date(row.departureAt).toLocaleString() : "—"}
                  </td>
                  <td className={`${cell} text-ink-muted`}>
                    {row.seatsSold ?? 0}/{row.seatsTotal ?? "—"}
                  </td>
                  <td className={cell}>
                    <Badge tone={scheduleTone[row.status] ?? "neutral"}>{row.status}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <div className="flex justify-end gap-2">
                      {row.status !== "completed" && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void advance(row)}>
                          Mark {nextStatus(row.status).replace("-", " ")}
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => void remove(row)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}

      <Card className="mt-4">
        <h3 className="text-sm font-bold text-navy-950">Add a departure</h3>
        <p className="mt-1 text-xs text-ink-faint">
          Depatures are keyed to a published trip — create one under Published trips → Publish a trip first.
        </p>
        <form onSubmit={addSchedule} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_190px_auto]">
          <input name="routeId" required placeholder="Trip (listing) ID e.g. 7" aria-label="Trip ID" className={inputClass} />
          <select name="vehicleId" aria-label="Vehicle" className={inputClass} defaultValue="">
            <option value="">No vehicle linked</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
          <input name="departureAt" type="datetime-local" required aria-label="Departure time" className={inputClass} />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Add
          </Button>
        </form>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bus operator: bookings
// ---------------------------------------------------------------------------
const bookingTone: Record<string, "warning" | "success" | "error"> = { confirmed: "warning", "checked-in": "success", cancelled: "error" };

export function BusBookingsPanel() {
  const { items: bookings, setItems, error, setError, reload } = useApiList(listBusBookings);
  const [busy, setBusy] = useState(false);

  async function update(booking: ApiBusBooking, status: ApiBusBooking["status"]) {
    setItems((prev) => prev?.map((b) => (b.id === booking.id ? { ...b, status } : b)) ?? prev);
    try {
      await updateBusBooking(booking.id, { status });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the booking.");
      reload();
    }
  }

  async function remove(booking: ApiBusBooking) {
    try {
      await deleteBusBooking(booking.id);
      setItems((prev) => prev?.filter((b) => b.id !== booking.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the booking.");
    }
  }

  async function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const seats = String(data.get("seats") || "")
        .split(",")
        .map((seat) => seat.trim())
        .filter(Boolean);
      const created = await createBusBooking({
        customerName: String(data.get("customerName") || "").trim(),
        seats,
        amount: Number(data.get("amount") || 0),
        channel: (String(data.get("channel") || "online") as "online" | "pos"),
      });
      setItems((prev) => [created, ...(prev ?? [])]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Process bookings and cancellations for your trips, and see whether each was sold online or at a POS."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {bookings === null ? (
        <Loading />
      ) : (
        <div className="mt-8">
          <TableShell>
            <THead columns={["Reference", "Passenger", "Seats", "Channel", "Amount", "Status", ""]} />
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{b.reference}</td>
                  <td className={`${cell} text-ink-muted`}>{b.customerName}</td>
                  <td className={`${cell} text-ink-muted`}>{(b.seats ?? []).join(", ") || "—"}</td>
                  <td className={cell}>
                    <Badge tone="neutral">{b.channel === "pos" ? "POS" : "Online"}</Badge>
                  </td>
                  <td className={`${cell} text-ink`}>{formatPrice(b.amount, b.currency)}</td>
                  <td className={cell}>
                    <Badge tone={bookingTone[b.status] ?? "neutral"}>{b.status.replace("-", " ")}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <div className="flex justify-end gap-2">
                      {b.status === "confirmed" && (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => void update(b, "checked-in")}>
                            Check in
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => void update(b, "cancelled")}>
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => void remove(b)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}

      <Card className="mt-6 max-w-2xl">
        <h2 className="text-lg font-bold text-navy-950">Record a walk-in booking</h2>
        <form onSubmit={addBooking} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="customerName" required placeholder="Passenger name" aria-label="Passenger name" className={inputClass} />
          <input name="seats" placeholder="Seats e.g. 1A, 1B" aria-label="Seats" className={inputClass} />
          <input name="amount" type="number" min={0} required placeholder="Amount (minor units)" aria-label="Amount" className={inputClass} />
          <select name="channel" aria-label="Channel" className={inputClass} defaultValue="online">
            <option value="online">Online</option>
            <option value="pos">POS</option>
          </select>
          <Button type="submit" variant="accent" size="md" disabled={busy} className="sm:col-span-2">
            Create booking
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bus operator: dispatch & drivers
// ---------------------------------------------------------------------------
const tripTone: Record<string, "neutral" | "warning" | "success"> = { upcoming: "neutral", "in-progress": "warning", completed: "success" };

function nextTripStatus(status: DriverAssignment["status"]) {
  if (status === "upcoming") return "in-progress";
  if (status === "in-progress") return "completed";
  return status;
}

export function DriverTripsPanel() {
  const { items: assignments, setItems, error, setError, reload } = useApiList(listAssignments);
  const { items: drivers } = useApiList(listDrivers);
  const { items: vehicles } = useApiList(listFleet);
  const [busy, setBusy] = useState(false);

  async function advance(assignment: DriverAssignment) {
    const status = nextTripStatus(assignment.status);
    setItems((prev) => prev?.map((t) => (t.id === assignment.id ? { ...t, status } : t)) ?? prev);
    try {
      await updateAssignment(assignment.id, { status });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the assignment.");
      reload();
    }
  }

  async function remove(assignment: DriverAssignment) {
    try {
      await deleteAssignment(assignment.id);
      setItems((prev) => prev?.filter((t) => t.id !== assignment.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the assignment.");
    }
  }

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await createAssignment({
        driverId: String(data.get("driverId") || ""),
        vehicleId: data.get("vehicleId") ? String(data.get("vehicleId")) : undefined,
        passengerCount: Number(data.get("passengerCount") || 0) || undefined,
        parcelCount: Number(data.get("parcelCount") || 0) || undefined,
      });
      setItems((prev) => [created, ...(prev ?? [])]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the assignment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Dispatch & drivers"
        description="Driver assignments with passenger manifests and parcel handovers — as your drivers see them in the Driver app."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {assignments === null ? (
        <Loading />
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {assignments.length === 0 && <p className="text-sm text-ink-muted">No assignments yet — create one below.</p>}
          {assignments.map((trip) => (
            <Card key={trip.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-navy-950">{trip.driverName || `Driver ${trip.driverId}`}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {trip.plate ? `${trip.plate} · ` : ""}
                    {trip.departureAt ? `Departs ${new Date(trip.departureAt).toLocaleString()}` : "No departure linked"}
                  </p>
                </div>
                <Badge tone={tripTone[trip.status] ?? "neutral"}>{trip.status.replace("-", " ")}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xs">
                <div className="rounded-xl border border-dashed border-line p-3 text-center">
                  <p className="text-lg font-bold text-navy-950">{trip.passengerCount ?? 0}</p>
                  <p className="text-xs text-ink-faint">Passengers</p>
                </div>
                <div className="rounded-xl border border-dashed border-line p-3 text-center">
                  <p className="text-lg font-bold text-navy-950">{trip.parcelCount ?? 0}</p>
                  <p className="text-xs text-ink-faint">Parcel handovers</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {trip.status !== "completed" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => void advance(trip)}>
                    Mark as {nextTripStatus(trip.status).replace("-", " ")}
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => void remove(trip)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Add a driver assignment</h2>
        <form onSubmit={addAssignment} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_130px_130px_auto]">
          <select name="driverId" required aria-label="Driver" className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose a driver
            </option>
            {(drivers ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select name="vehicleId" aria-label="Vehicle" className={inputClass} defaultValue="">
            <option value="">No vehicle</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
          <input name="passengerCount" type="number" min={0} placeholder="Passengers" aria-label="Passenger count" className={inputClass} />
          <input name="parcelCount" type="number" min={0} placeholder="Parcels" aria-label="Parcel count" className={inputClass} />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Assign
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Courier operator: parcel queue
// ---------------------------------------------------------------------------
const parcelStageTone: Record<string, "neutral" | "warning" | "success" | "error"> = { registered: "neutral", "in-transit": "warning", "out-for-delivery": "warning", delivered: "success", failed: "error" };

export function ParcelQueuePanel() {
  const { items: parcels, error, reload } = useApiList(listParcels);

  return (
    <div>
      <PageHeader
        title="Parcel queue"
        description="Every parcel registered with your business, with its courier assignment."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {parcels === null ? (
        <Loading />
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {parcels.length === 0 && <p className="text-sm text-ink-muted">No parcels yet.</p>}
          {parcels.map((job) => (
            <Card key={job.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-navy-950">{job.reference}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {job.senderName} → {job.recipientName} · {job.origin} → {job.destination}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {job.weightKg ? `${job.weightKg}kg · ` : ""}
                  {job.courierName ? `Courier: ${job.courierName}` : "Unassigned"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={parcelStageTone[job.status] ?? "neutral"}>{job.status.replace(/-/g, " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Courier operator: couriers & dispatch
// ---------------------------------------------------------------------------
const courierTone: Record<string, "success" | "warning" | "neutral"> = { available: "success", "on-route": "warning", "off-duty": "neutral" };

export function CourierDispatchPanel() {
  const { items: couriers, setItems, error, setError, reload } = useApiList(listCouriers);
  const [busy, setBusy] = useState(false);

  async function addCourier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await createCourier({
        name: String(data.get("name") || "").trim(),
        zone: String(data.get("zone") || "") || undefined,
        vehicle: String(data.get("vehicle") || "") || undefined,
        status: "available",
      });
      setItems((prev) => [...(prev ?? []), { ...created, activeParcels: 0 }]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add the courier.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(courier: Courier, status: Courier["status"]) {
    setItems((prev) => prev?.map((c) => (c.id === courier.id ? { ...c, status } : c)) ?? prev);
    try {
      await updateCourier(courier.id, { status });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the courier.");
      reload();
    }
  }

  async function remove(courier: Courier) {
    try {
      await deleteCourier(courier.id);
      setItems((prev) => prev?.filter((c) => c.id !== courier.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove the courier.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Couriers & dispatch"
        description="See who is available in each zone and their live parcel loads. Deleting a courier detaches their parcels instead of dropping history."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {couriers === null ? (
        <Loading />
      ) : (
        <div className="mt-8">
          <TableShell>
            <THead columns={["Courier", "Zone", "Vehicle", "Active parcels", "Status", ""]} />
            <tbody>
              {couriers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                    No couriers yet — add your first one below.
                  </td>
                </tr>
              )}
              {couriers.map((c) => (
                <tr key={c.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{c.name}</td>
                  <td className={`${cell} text-ink-muted`}>{c.zone || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>{c.vehicle || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>{c.activeParcels ?? 0}</td>
                  <td className={cell}>
                    <Badge tone={courierTone[c.status] ?? "neutral"}>{c.status.replace("-", " ")}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <div className="flex justify-end gap-2">
                      {c.status !== "available" && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void setStatus(c, "available")}>
                          Set available
                        </Button>
                      )}
                      {c.status !== "off-duty" && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void setStatus(c, "off-duty")}>
                          Off duty
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => void remove(c)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Add a courier</h2>
        <form onSubmit={addCourier} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input name="name" required placeholder="Name e.g. K. Mbewe" aria-label="Courier name" className={inputClass} />
          <input name="zone" placeholder="Zone e.g. Blantyre city" aria-label="Zone" className={inputClass} />
          <input name="vehicle" placeholder="Vehicle e.g. Motorcycle MZ 3310" aria-label="Vehicle" className={inputClass} />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Add
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance (bus + courier)
// ---------------------------------------------------------------------------
function complianceStatus(item: { daysLeft?: number }) {
  const days = item.daysLeft ?? 0;
  if (days < 0) return { label: "Lapsed", tone: "error" } as const;
  if (days <= 30) return { label: `Expires in ${days}d`, tone: "warning" } as const;
  return { label: "Valid", tone: "success" } as const;
}

function ComplianceSection({ description }: { description: string }) {
  const { items, setItems, error, setError, reload } = useApiList(listCompliance);
  const [busy, setBusy] = useState(false);

  const documents = items ?? [];
  const lapsed = documents.filter((i) => (i.daysLeft ?? 0) < 0).length;
  const expiring = documents.filter((i) => (i.daysLeft ?? 0) >= 0 && (i.daysLeft ?? 0) <= 30).length;

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await createComplianceDocument({
        subject: String(data.get("subject") || "").trim(),
        kind: String(data.get("kind") || "").trim(),
        expiresAt: String(data.get("expiresAt") || ""),
        documentUrl: String(data.get("documentUrl") || "") || undefined,
      });
      setItems((prev) => [...(prev ?? []), created]);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add the document.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(document: ComplianceDocument) {
    try {
      await deleteComplianceDocument(document.id);
      setItems((prev) => prev?.filter((i) => i.id !== document.id) ?? prev);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove the document.");
    }
  }

  return (
    <div>
      <PageHeader title="Compliance" description={description} />

      {documents.length === 0 && !error && (
        <p role="note" className="mt-6 rounded-xl bg-surface-alt px-4 py-3 text-sm text-ink-muted">
          No compliance documents on file yet. Add the operator licence, roadworthiness
          certificate and insurance below — lapsed documents flag the account automatically.
        </p>
      )}
      {(lapsed > 0 || expiring > 0) && (
        <p role="status" className="mt-6 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
          {lapsed > 0 && (
            <>
              <strong>{lapsed} lapsed</strong> — the account is flagged and may be suspended until it is renewed.{" "}
            </>
          )}
          {expiring > 0 && (
            <>
              <strong>{expiring} expiring within 30 days.</strong>
            </>
          )}
        </p>
      )}

      <ErrorNotice message={error} onRetry={reload} />

      <div className="mt-6">
        <TableShell>
          <THead columns={["Item", "Subject", "Expires", "Status", ""]} />
          <tbody>
            {documents.map((item) => {
              const status = complianceStatus(item);
              return (
                <tr key={item.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{item.kind}</td>
                  <td className={`${cell} text-ink-muted`}>{item.subject}</td>
                  <td className={`${cell} text-ink-muted`}>{item.expiresAt?.slice(0, 10) ?? "—"}</td>
                  <td className={cell}>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void remove(item)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Register a document</h2>
        <form onSubmit={addDocument} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_170px_1fr_auto]">
          <input name="kind" required placeholder="Kind e.g. Roadworthiness certificate" aria-label="Document kind" className={inputClass} />
          <input name="subject" required placeholder="Subject e.g. BT 4521" aria-label="Subject" className={inputClass} />
          <input name="expiresAt" type="date" required aria-label="Expires" className={inputClass} />
          <input name="documentUrl" placeholder="Document URL (optional)" aria-label="Document URL" className={inputClass} />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Add
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function BusCompliancePanel() {
  return (
    <ComplianceSection
      description="Operator licence, roadworthiness and public service vehicle insurance. Lapsed documents flag or suspend the account automatically."
    />
  );
}

export function CourierCompliancePanel() {
  return (
    <ComplianceSection
      description="Courier operating licence, vehicle registrations, rider licences and Goods-in-Transit insurance. Lapsed documents flag or suspend the account automatically."
    />
  );
}
