"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { popularRoutes, trendingEvents } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import {
  createBooking,
  createParcel,
  createPosTransaction,
  closeTill,
  getTillSummary,
  listCatalogEvents,
  listCatalogRoutes,
  listPosTransactions,
  listSettlements,
  listValidations,
  openTill,
  resolveValidation,
  type PosTransaction,
  type Settlement,
  type TillSummary,
} from "@/lib/operations";
import { listEvents, getEvent, type EventSummary } from "@/lib/auth";
import { Card, PageHeader, StatCard, TableShell, THead, cell, inputClass, rowClass } from "../ui";
import { useWorkspace } from "../WorkspaceContext";

// ---------------------------------------------------------------------------
// Shared load wrapper
// ---------------------------------------------------------------------------
function useApiList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState("");

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
  }, []);

  return { items, setItems, error, setError };
}

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-6 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
      {message}
    </p>
  );
}

function Loading() {
  return <p className="mt-8 text-sm text-ink-muted">Loading…</p>;
}

// ---------------------------------------------------------------------------
// Scanning & validation (ticket inspector / entry staff / delivery confirmation)
// ---------------------------------------------------------------------------
const resultTone: Record<string, "success" | "error" | "warning"> = { valid: "success", invalid: "error", duplicate: "warning" };

export function ScanPanel({
  title,
  description,
  placeholder,
}: {
  title: string;
  description: string;
  placeholder: string;
}) {
  const { items: entries, setItems, error } = useApiList(listValidations);
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (!value) return;

    setBusy(true);
    setScanError("");
    try {
      const record = await resolveValidation({
        code: value,
        kind: value.toLowerCase().includes("pcl") ? "parcel" : "ticket",
        mode: offline ? "manual" : "auto",
        device: "Web console",
        synced: !offline,
      });
      setItems((prev) => [record, ...(prev ?? [])]);
      setCode("");
    } catch (scanFailure) {
      setScanError(
        scanFailure instanceof Error ? scanFailure.message : "The code could not be validated.",
      );
    } finally {
      setBusy(false);
    }
  }

  const pendingSync = (entries ?? []).filter((e) => !e.synced).length;

  return (
    <div>
      <PageHeader title={title} description={description} />

      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={offline}
              onChange={(e) => setOffline(e.target.checked)}
              className="h-4 w-4 accent-navy-950"
            />
            Scanning offline (queue without connectivity)
          </label>
          {pendingSync > 0 && <Badge tone="warning">{pendingSync} queued for sync</Badge>}
        </div>

        <form onSubmit={handleScan} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="scan-code">
            Scan or enter a code
          </label>
          <input
            id="scan-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 ${inputClass} h-12`}
          />
          <Button type="submit" variant="accent" size="lg" disabled={busy}>
            {busy ? "Validating…" : "Validate"}
          </Button>
        </form>
        {scanError && (
          <p role="alert" className="mt-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
            {scanError}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          Every scan is resolved against live tickets and parcels — duplicates are flagged, and offline
          scans keep their original time when they sync.
        </p>
      </Card>

      <ErrorNotice message={error} />

      <div className="mt-6">
        {entries === null ? (
          <Loading />
        ) : (
          <TableShell>
            <THead columns={["Code", "Kind", "Result", "Mode", "Device", "Time", "Synced"]} />
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                    No scans recorded yet.
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{entry.code}</td>
                  <td className={`${cell} text-ink-muted`}>{entry.kind}</td>
                  <td className={cell}>
                    <Badge tone={resultTone[entry.result] ?? "neutral"}>{entry.result}</Badge>
                  </td>
                  <td className={`${cell} text-ink-muted`}>{entry.mode}</td>
                  <td className={`${cell} text-ink-muted`}>{entry.device || "—"}</td>
                  <td className={`${cell} text-ink-faint`}>
                    {entry.occurredAt ? new Date(entry.occurredAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className={cell}>
                    {entry.synced !== false ? (
                      <Badge tone="success">Synced</Badge>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Finance & settlements (operator view)
// ---------------------------------------------------------------------------
export function FinancePanel() {
  const { profile } = useWorkspace();
  const { items: settlements, error } = useApiList(listSettlements);

  const totals = useMemo(() => {
    const rows = settlements ?? [];
    const gross = rows.reduce((sum, s) => sum + (s.grossAmount ?? 0), 0);
    const commission = rows.reduce((sum, s) => sum + (s.commissionAmount ?? 0), 0);
    const net = rows.reduce((sum, s) => sum + (s.netAmount ?? 0), 0);
    return { gross, commission, net, pending: rows.filter((s) => s.status === "pending").length };
  }, [settlements]);

  const currency = (settlements ?? [])[0]?.currency ?? "MWK";

  return (
    <div>
      <PageHeader
        title="Finance & settlements"
        description="Every payment is split automatically between you, the platform commission and gateway fees, then paid out to your verified account."
      />

      <ErrorNotice message={error} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatPrice(totals.gross, currency)} />
        <StatCard label="Platform commission" value={formatPrice(totals.commission, currency)} />
        <StatCard label="Net payouts" value={formatPrice(totals.net, currency)} />
        <StatCard
          label="Pending payouts"
          value={totals.pending}
          tone={totals.pending ? "warning" : "default"}
        />
      </div>

      <div className="mt-6">
        {settlements === null ? (
          <Loading />
        ) : (
          <TableShell>
            <THead columns={["Account", "Period", "Gross", "Commission", "Net payout", "Status"]} />
            <tbody>
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                    No settlements recorded yet — they appear here after your first payout cycle.
                  </td>
                </tr>
              )}
              {settlements.map((row: Settlement) => (
                <tr key={row.id} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>
                    {profile?.businessName || "Your business"}
                  </td>
                  <td className={`${cell} text-ink-muted`}>
                    {row.periodStart && row.periodEnd
                      ? `${row.periodStart.slice(0, 10)} → ${row.periodEnd.slice(0, 10)}`
                      : "—"}
                  </td>
                  <td className={`${cell} text-ink-muted`}>{formatPrice(row.grossAmount ?? 0, row.currency ?? "MWK")}</td>
                  <td className={`${cell} text-ink-muted`}>
                    {formatPrice(row.commissionAmount ?? 0, row.currency ?? "MWK")}
                  </td>
                  <td className={`${cell} font-semibold text-navy-950`}>
                    {formatPrice(row.netAmount ?? 0, row.currency ?? "MWK")}
                  </td>
                  <td className={cell}>
                    <Badge tone={row.status === "paid" ? "success" : "warning"}>{row.status}</Badge>
                    {row.paidAt && (
                      <p className="mt-1 text-xs text-ink-faint">Paid {row.paidAt.slice(0, 10)}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organizer: sales & attendance
// ---------------------------------------------------------------------------
export function OrganizerReportsPanel() {
  const { token, profile } = useWorkspace();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [details, setDetails] = useState<Record<string, Awaited<ReturnType<typeof getEvent>>>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    listEvents(token, profile.id)
      .then(async (all) => {
        if (cancelled) return;
        setEvents(all);
        const loaded: Record<string, Awaited<ReturnType<typeof getEvent>>> = {};
        await Promise.all(
          all.map(async (event) => {
            try {
              const detail = await getEvent(token, event.id);
              if (detail) loaded[String(event.id)] = detail;
            } catch {
              // A missing detail just skips that listing's stats.
            }
          }),
        );
        if (!cancelled) setDetails(loaded);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setEvents([]);
          setError(loadError instanceof Error ? loadError.message : "Could not load sales data.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, profile]);

  const rows = useMemo(() => {
    return (events ?? []).map((event) => {
      const tickets = details[String(event.id)]?.tickets ?? [];
      const sold = tickets.reduce((sum, t) => sum + Math.max((t.capacity ?? 0) - (t.remaining ?? 0), 0), 0);
      const capacity = tickets.reduce((sum, t) => sum + (t.capacity ?? 0), 0);
      const gross = tickets.reduce(
        (sum, t) => sum + Math.max((t.capacity ?? 0) - (t.remaining ?? 0), 0) * (t.price ?? 0),
        0,
      );
      return { id: event.id, title: event.title, sold, capacity, gross, currency: tickets[0]?.currency ?? "MWK" };
    });
  }, [events, details]);

  return (
    <div>
      <PageHeader
        title="Sales & attendance"
        description="Tickets sold against capacity and gross presales for every listing you've published."
      />
      <ErrorNotice message={error} />
      {events === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">Publish an event to see its sales here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {rows.map((row) => {
            const soldPct = row.capacity ? Math.round((row.sold / row.capacity) * 100) : 0;
            return (
              <Card key={String(row.id)} className="p-5">
                <p className="font-semibold text-navy-950">{row.title}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {row.gross > 0 ? `${formatPrice(row.gross, row.currency)} gross` : "No sales yet"}
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>Sold</span>
                    <span>
                      {row.sold}/{row.capacity} ({soldPct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface-alt">
                    <div className="h-2 rounded-full bg-navy-950" style={{ width: `${soldPct}%` }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Retail / POS agent
// ---------------------------------------------------------------------------
const typeLabel: Record<string, string> = { "bus-ticket": "Bus ticket", parcel: "Parcel", "event-ticket": "Event ticket" };

type SaleKind = "bus-ticket" | "parcel" | "event-ticket";

export function PosSellPanel() {
  const [kind, setKind] = useState<SaleKind>("bus-ticket");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(1);
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [method, setMethod] = useState<"cash" | "mobile-money">("cash");
  const [sales, setSales] = useState<PosTransaction[]>([]);
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Live catalogues for bus + event pickers, with the sample data as offline fallback.
  const [routes, setRoutes] = useState(popularRoutes);
  const [events, setEvents] = useState(trendingEvents);

  useEffect(() => {
    let cancelled = false;
    listCatalogRoutes()
      .then((live) => {
        if (!cancelled && live.length > 0) {
          setRoutes(
            live.map((route) => ({
              id: String(route.id),
              origin: route.origin,
              destination: route.destination,
              operator: route.operator || "Operator",
              duration: String(route.duration ?? ""),
              fromPrice: route.fromPrice,
              currency: route.currency,
              departures: route.departures ?? 1,
              rating: route.rating ?? 4.5,
            })),
          );
        }
      })
      .catch(() => {
        // Keep the sample catalogue when the API is unreachable.
      });
    listCatalogEvents()
      .then((live) => {
        if (!cancelled && live.length > 0) {
          setEvents(
            live
              .filter((e) => e.status !== "sold-out")
              .map((event) => ({
                id: String(event.id),
                title: event.title,
                category: event.category,
                venue: event.venue || event.location || "",
                city: event.city || "",
                countryCode: event.countryCode || "MW",
                date: event.startsAt,
                fromPrice: event.fromPrice,
                currency: event.currency,
                status: event.status,
              })),
          );
        }
      })
      .catch(() => {
        // Keep the sample catalogue when the API is unreachable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogue =
    kind === "bus-ticket"
      ? routes.map((r) => ({ id: r.id, label: `${r.origin} → ${r.destination} (${r.operator})`, price: r.fromPrice, currency: r.currency }))
      : kind === "event-ticket"
        ? events.map((e) => ({ id: e.id, label: `${e.title} — ${e.city || e.venue}`, price: e.fromPrice, currency: e.currency }))
        : [];

  const selected = catalogue.find((c) => c.id === item);
  const parcelCost = Math.round(3000 + Math.max(0, weight) * 1500);
  const total = kind === "parcel" ? parcelCost : (selected?.price ?? 0) * quantity;
  const currency = kind === "parcel" ? "MWK" : (selected?.currency ?? "MWK");
  const canSell = kind === "parcel" ? Boolean(senderName && recipientName && origin && destination) : Boolean(selected);

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSell) return;
    setBusy(true);
    setError("");
    setReceipt("");
    try {
      let amount = total;
      let reference = "";

      if (kind === "parcel") {
        // Register the real parcel; the API computes the cost (base fee + per kg).
        const parcel = await createParcel({
          senderName,
          recipientName,
          origin,
          destination,
          weightKg: weight,
        });
        amount = parcel.amount;
        reference = parcel.reference;
      } else {
        // Record the customer's booking so the ticket exists, then log the POS sale.
        const booking = await createBooking({
          kind: kind === "bus-ticket" ? "bus" : "event",
          title: selected?.label ?? "",
          detail: `Sold at POS · ${method === "cash" ? "cash" : "mobile money"}`,
          amount: total,
          currency,
        });
        amount = booking.amount;
        reference = booking.reference;
      }

      const transaction = await createPosTransaction({
        kind,
        amount,
        method,
        reference: reference || undefined,
        currency,
      });
      setSales((prev) => [transaction, ...prev]);
      setReceipt(
        `${typeLabel[kind]} sold — ${formatPrice(amount, currency)} by ${method === "cash" ? "cash" : "mobile money"}.` +
          (reference ? ` Reference ${reference}.` : ""),
      );
      setItem("");
      setQuantity(1);
      setSenderName("");
      setRecipientName("");
      setOrigin("");
      setDestination("");
    } catch (sellError) {
      setError(sellError instanceof Error ? sellError.message : "The sale could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sell & register"
        description="Sell bus and event tickets, or register a parcel, on Lumticket's behalf. The customer receives a QR ticket or tracking reference."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <form onSubmit={complete} className="flex flex-col gap-4">
            <div role="radiogroup" aria-label="Service" className="flex flex-wrap gap-2">
              {(Object.keys(typeLabel) as SaleKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => {
                    setKind(k);
                    setItem("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    kind === k ? "bg-navy-950 text-white" : "bg-surface-alt text-ink-muted hover:text-navy-950"
                  }`}
                >
                  {typeLabel[k]}
                </button>
              ))}
            </div>

            {kind === "parcel" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pos-sender" className="text-sm font-medium text-ink">
                      Sender name
                    </label>
                    <input
                      id="pos-sender"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className={`mt-1.5 ${inputClass} h-12`}
                      placeholder="Chikondi Banda"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-recipient" className="text-sm font-medium text-ink">
                      Recipient name
                    </label>
                    <input
                      id="pos-recipient"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className={`mt-1.5 ${inputClass} h-12`}
                      placeholder="Grace Mvula"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-origin" className="text-sm font-medium text-ink">
                      Origin
                    </label>
                    <input
                      id="pos-origin"
                      required
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className={`mt-1.5 ${inputClass} h-12`}
                      placeholder="Lilongwe"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-destination" className="text-sm font-medium text-ink">
                      Destination
                    </label>
                    <input
                      id="pos-destination"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className={`mt-1.5 ${inputClass} h-12`}
                      placeholder="Blantyre"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="pos-weight" className="text-sm font-medium text-ink">
                    Parcel weight (kg)
                  </label>
                  <input
                    id="pos-weight"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value) || 0)}
                    className={`mt-1.5 ${inputClass} h-12`}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="pos-item" className="text-sm font-medium text-ink">
                    {kind === "bus-ticket" ? "Route" : "Event"}
                  </label>
                  <select
                    id="pos-item"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className={`mt-1.5 ${inputClass} h-12`}
                  >
                    <option value="">Choose…</option>
                    {catalogue.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — {formatPrice(c.price, c.currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pos-qty" className="text-sm font-medium text-ink">
                    Quantity
                  </label>
                  <input
                    id="pos-qty"
                    type="number"
                    min={1}
                    max={9}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(9, Math.max(1, Number(e.target.value) || 1)))}
                    className={`mt-1.5 ${inputClass} h-12`}
                  />
                </div>
              </>
            )}

            <div role="radiogroup" aria-label="Payment method" className="flex gap-2">
              {(["cash", "mobile-money"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  onClick={() => setMethod(m)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    method === m ? "bg-navy-950 text-white" : "bg-surface-alt text-ink-muted hover:text-navy-950"
                  }`}
                >
                  {m === "cash" ? "Cash" : "Mobile money"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-ink-faint">
                  {kind === "parcel" ? "Estimated total" : "Total"}
                </p>
                <p className="text-xl font-bold text-navy-950">{formatPrice(total, currency)}</p>
              </div>
              <Button type="submit" variant="accent" size="lg" disabled={!canSell || busy}>
                {busy ? "Recording…" : "Complete sale"}
              </Button>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
            {receipt && (
              <p role="status" className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
                {receipt}
              </p>
            )}
          </form>
        </Card>

        <Card className="h-fit">
          <h2 className="text-lg font-bold text-navy-950">This session</h2>
          {sales.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Sales you complete appear here and in Transactions.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {sales.map((s) => (
                <li key={s.id} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-navy-950">{typeLabel[s.kind] ?? s.kind}</span>
                    <span className="text-ink">{formatPrice(s.amount, s.currency)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {s.reference} · {s.occurredAt ? new Date(s.occurredAt).toLocaleTimeString() : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function TransactionsPanel() {
  const { items: transactions, error } = useApiList(listPosTransactions);

  const rows = transactions ?? [];
  const cash = rows.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
  const mobile = rows.filter((t) => t.method === "mobile-money").reduce((s, t) => s + t.amount, 0);
  const currency = rows[0]?.currency ?? "MWK";

  return (
    <div>
      <PageHeader title="Transactions" description="Sales taken through your registered POS device." />
      <ErrorNotice message={error} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cash collected" value={formatPrice(cash, currency)} />
        <StatCard label="Mobile money" value={formatPrice(mobile, currency)} />
        <StatCard label="Transactions" value={rows.length} />
      </div>

      <div className="mt-6">
        {transactions === null ? (
          <Loading />
        ) : (
          <TableShell>
            <THead columns={["Time", "Type", "Reference", "Method", "Amount"]} />
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className={rowClass}>
                  <td className={`${cell} text-ink-muted`}>
                    {t.occurredAt ? new Date(t.occurredAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className={`${cell} text-navy-950`}>{typeLabel[t.kind] ?? t.kind}</td>
                  <td className={`${cell} text-ink-muted`}>{t.reference}</td>
                  <td className={cell}>
                    <Badge tone={t.method === "cash" ? "neutral" : "success"}>
                      {t.method === "cash" ? "Cash" : "Mobile money"}
                    </Badge>
                  </td>
                  <td className={`${cell} font-semibold text-navy-950`}>{formatPrice(t.amount, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}

export function EndOfDayPanel() {
  const [summary, setSummary] = useState<TillSummary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("20000");
  const [limitAmount, setLimitAmount] = useState("100000");

  async function load() {
    setError("");
    try {
      setSummary(await getTillSummary());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your till.");
    }
  }

  const loadRef = useRef(load);
  useEffect(() => {
    void loadRef.current();
  }, []);

  const current = summary?.current ?? null;
  const cashSales = summary?.today.cashSales ?? 0;
  const mobileSales = summary?.today.mobileSales ?? 0;
  const expected = (current?.openingFloat ?? 0) + cashSales;
  const currency = current?.currency ?? "MWK";

  async function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await openTill({
        openingFloat: Number(openingFloat) || 0,
        limitAmount: Number(limitAmount) || undefined,
      });
      await load();
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Could not open the till.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      await closeTill(current.id);
      await load();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Could not close the till.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="End of day"
        description="Open your till at the start of the day, then close it to lock in the cash and mobile-money totals computed from your transactions."
      />
      <ErrorNotice message={error} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Opening float" value={formatPrice(current?.openingFloat ?? 0, currency)} />
        <StatCard label="Cash sales today" value={formatPrice(cashSales, currency)} />
        <StatCard
          label="Expected in till"
          value={formatPrice(expected, currency)}
          hint={current?.limitAmount ? `Limit ${formatPrice(current.limitAmount, currency)}` : undefined}
        />
        <StatCard label="Mobile money today" value={formatPrice(mobileSales, currency)} />
        <StatCard label="Transactions today" value={summary?.today.count ?? 0} />
        <StatCard
          label="Till status"
          value={current ? "Open" : "Closed"}
          hint={current ? `Opened ${new Date(current.openedAt).toLocaleTimeString()}` : "Open a till to start selling"}
          tone={current ? "default" : "warning"}
        />
      </div>

      {summary === null && !error && <Loading />}

      {summary !== null && !current && (
        <Card className="mt-6 max-w-xl">
          <h2 className="text-lg font-bold text-navy-950">Open the till</h2>
          <form onSubmit={handleOpen} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="opening-float" className="text-sm font-medium text-ink">
                Opening float (minor units)
              </label>
              <input
                id="opening-float"
                type="number"
                min={0}
                required
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className={`mt-1.5 ${inputClass} h-12`}
              />
            </div>
            <div>
              <label htmlFor="limit-amount" className="text-sm font-medium text-ink">
                Float limit (optional)
              </label>
              <input
                id="limit-amount"
                type="number"
                min={0}
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className={`mt-1.5 ${inputClass} h-12`}
              />
            </div>
            <Button type="submit" variant="accent" size="lg" disabled={busy} className="sm:col-span-2">
              {busy ? "Opening…" : "Open till"}
            </Button>
          </form>
        </Card>
      )}

      {current && (
        <Card className="mt-6 max-w-xl">
          <h2 className="text-lg font-bold text-navy-950">Close the day</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Closing stores the cash and mobile-money totals computed from your transactions on the till record.
          </p>
          <Button type="button" variant="accent" size="lg" className="mt-5" disabled={busy} onClick={() => void handleClose()}>
            {busy ? "Closing…" : "Close the till"}
          </Button>
        </Card>
      )}

      {summary && summary.history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy-950">Till history</h2>
          <div className="mt-3">
            <TableShell>
              <THead columns={["Opened", "Closed", "Float", "Cash", "Mobile money"]} />
              <tbody>
                {summary.history.map((till) => (
                  <tr key={till.id} className={rowClass}>
                    <td className={`${cell} text-ink-muted`}>{new Date(till.openedAt).toLocaleString()}</td>
                    <td className={`${cell} text-ink-muted`}>
                      {till.closedAt ? new Date(till.closedAt).toLocaleString() : "Open"}
                    </td>
                    <td className={`${cell} text-ink-muted`}>{formatPrice(till.openingFloat, till.currency)}</td>
                    <td className={`${cell} text-ink-muted`}>{formatPrice(till.cashSales ?? 0, till.currency)}</td>
                    <td className={`${cell} text-ink-muted`}>{formatPrice(till.mobileSales ?? 0, till.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        </div>
      )}
    </div>
  );
}
