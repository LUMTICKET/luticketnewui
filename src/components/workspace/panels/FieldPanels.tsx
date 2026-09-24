"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { popularRoutes, trendingEvents } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import {
  posTransactions,
  settlements,
  validationLog,
  type PosTransaction,
  type ValidationLogEntry,
} from "@/lib/dashboard-mock";
import { commissionRules, eventSales, posFloat } from "@/lib/workspace-mock";
import { Card, PageHeader, StatCard, TableShell, THead, cell, inputClass, rowClass } from "../ui";
import { useWorkspace } from "../WorkspaceContext";

// ---------------------------------------------------------------------------
// Scanning & validation (ticket inspector / entry staff / delivery confirmation)
// ---------------------------------------------------------------------------
const resultTone = { valid: "success", invalid: "error", duplicate: "warning" } as const;

export function ScanPanel({
  title,
  description,
  placeholder,
}: {
  title: string;
  description: string;
  placeholder: string;
}) {
  const [entries, setEntries] = useState<ValidationLogEntry[]>(validationLog);
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState("");

  function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (!value) return;

    const alreadyUsed = entries.some((e) => e.code === value && e.result === "valid");
    setEntries((prev) => [
      {
        id: `scan-${prev.length}-${value}`,
        code: value,
        kind: value.toLowerCase().includes("pcl") ? "parcel" : "ticket",
        result: alreadyUsed ? "duplicate" : "valid",
        mode: offline ? "manual" : "auto",
        device: "This device",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        synced: !offline,
      },
      ...prev,
    ]);
    setCode("");
  }

  const pendingSync = entries.filter((e) => !e.synced).length;

  return (
    <div>
      <PageHeader title={title} description={description} demo />

      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="h-4 w-4 accent-navy-950" />
            Simulate no connectivity
          </label>
          {pendingSync > 0 && <Badge tone="warning">{pendingSync} queued for sync</Badge>}
        </div>

        <form onSubmit={handleScan} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="scan-code">Scan or enter a code</label>
          <input id="scan-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={placeholder} className={`flex-1 ${inputClass} h-12`} />
          <Button type="submit" variant="accent" size="lg">Validate</Button>
        </form>
        <p className="mt-2 text-xs text-ink-faint">
          A code already marked valid is flagged as a duplicate rather than silently accepted, and offline scans are
          queued and reconciled once you reconnect.
        </p>
      </Card>

      <div className="mt-6">
        <TableShell>
          <THead columns={["Code", "Kind", "Result", "Mode", "Device", "Time", "Synced"]} />
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{entry.code}</td>
                <td className={`${cell} text-ink-muted`}>{entry.kind}</td>
                <td className={cell}><Badge tone={resultTone[entry.result]}>{entry.result}</Badge></td>
                <td className={`${cell} text-ink-muted`}>{entry.mode}</td>
                <td className={`${cell} text-ink-muted`}>{entry.device}</td>
                <td className={`${cell} text-ink-faint`}>{entry.time}</td>
                <td className={cell}>{entry.synced ? <Badge tone="success">Synced</Badge> : <Badge tone="warning">Pending</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Finance & settlements (operator view)
// ---------------------------------------------------------------------------
const commissionKey = { "bus-operator": "bus", courier: "parcels", organizer: "events", agent: "agent", staff: "bus" } as const;

export function FinancePanel() {
  const { role, profile } = useWorkspace();
  const businessName = profile?.businessName ?? "Your business";
  const rule = commissionRules.find((r) => r.id === commissionKey[role]);

  const totals = useMemo(() => {
    const gross = settlements.reduce((sum, s) => sum + s.gross, 0);
    const commission = settlements.reduce((sum, s) => sum + s.commission, 0);
    return { gross, commission, net: gross - commission, pending: settlements.filter((s) => s.status === "pending").length };
  }, []);

  return (
    <div>
      <PageHeader
        title="Finance & settlements"
        description="Every payment is split automatically between you, the platform commission and gateway fees, then paid out to your verified account."
        demo
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatPrice(totals.gross, "MWK")} />
        <StatCard label={`Platform commission (${rule?.rate ?? 10}%)`} value={formatPrice(totals.commission, "MWK")} />
        <StatCard label="Net payouts" value={formatPrice(totals.net, "MWK")} />
        <StatCard label="Pending payouts" value={totals.pending} tone={totals.pending ? "warning" : "default"} />
      </div>

      <div className="mt-6">
        <TableShell>
          <THead columns={["Account", "Period", "Gross", "Commission", "Net payout", "Status"]} />
          <tbody>
            {settlements.map((row) => (
              <tr key={row.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{businessName}</td>
                <td className={`${cell} text-ink-muted`}>{row.period}</td>
                <td className={`${cell} text-ink-muted`}>{formatPrice(row.gross, row.currency)}</td>
                <td className={`${cell} text-ink-muted`}>{formatPrice(row.commission, row.currency)}</td>
                <td className={`${cell} font-semibold text-navy-950`}>{formatPrice(row.net, row.currency)}</td>
                <td className={cell}><Badge tone={row.status === "paid" ? "success" : "warning"}>{row.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organizer: sales & attendance
// ---------------------------------------------------------------------------
export function OrganizerReportsPanel() {
  return (
    <div>
      <PageHeader
        title="Sales & attendance"
        description="Tickets sold against capacity, gross presales, and how many holders have checked in at the gate."
        demo
      />
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {eventSales.map((row) => {
          const soldPct = Math.round((row.sold / row.capacity) * 100);
          const attendPct = row.sold ? Math.round((row.checkedIn / row.sold) * 100) : 0;
          return (
            <Card key={row.id} className="p-5">
              <p className="font-semibold text-navy-950">{row.event}</p>
              <p className="mt-1 text-sm text-ink-muted">{formatPrice(row.gross, row.currency)} gross</p>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Sold</span>
                  <span>{row.sold}/{row.capacity} ({soldPct}%)</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-alt">
                  <div className="h-2 rounded-full bg-navy-950" style={{ width: `${soldPct}%` }} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Checked in</span>
                  <span>{row.checkedIn} ({attendPct}%)</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-alt">
                  <div className="h-2 rounded-full bg-gold-500" style={{ width: `${attendPct}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Retail / POS agent
// ---------------------------------------------------------------------------
const typeLabel = { "bus-ticket": "Bus ticket", parcel: "Parcel", "event-ticket": "Event ticket" } as const;

type SaleKind = PosTransaction["type"];

export function PosSellPanel() {
  const [kind, setKind] = useState<SaleKind>("bus-ticket");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(1);
  const [method, setMethod] = useState<PosTransaction["method"]>("cash");
  const [sales, setSales] = useState<PosTransaction[]>([]);
  const [receipt, setReceipt] = useState("");

  const catalogue = kind === "bus-ticket"
    ? popularRoutes.map((r) => ({ id: r.id, label: `${r.origin} → ${r.destination} (${r.operator})`, price: r.fromPrice, currency: r.currency }))
    : kind === "event-ticket"
      ? trendingEvents.filter((e) => e.status !== "sold-out").map((e) => ({ id: e.id, label: `${e.title} — ${e.city}`, price: e.fromPrice, currency: e.currency }))
      : [];

  const selected = catalogue.find((c) => c.id === item);
  const parcelCost = Math.round(3000 + Math.max(0, weight) * 1500);
  const total = kind === "parcel" ? parcelCost : (selected?.price ?? 0) * quantity;
  const currency = kind === "parcel" ? "MWK" : (selected?.currency ?? "MWK");
  const canSell = kind === "parcel" ? weight > 0 : Boolean(selected);

  function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSell) return;
    const reference = kind === "parcel" ? `LMT-PCL-${20500 + sales.length}` : selected?.label ?? "";
    setSales((prev) => [
      {
        id: `sale-${prev.length}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: kind,
        reference,
        amount: total,
        currency,
        method,
      },
      ...prev,
    ]);
    setReceipt(`${typeLabel[kind]} sold — ${formatPrice(total, currency)} by ${method === "cash" ? "cash" : "mobile money"}.`);
    setItem("");
    setQuantity(1);
  }

  return (
    <div>
      <PageHeader
        title="Sell & register"
        description="Sell bus and event tickets, or register a parcel, on Lumiticket's behalf. The customer receives a QR ticket or tracking reference by SMS."
        demo
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
                  onClick={() => { setKind(k); setItem(""); }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${kind === k ? "bg-navy-950 text-white" : "bg-surface-alt text-ink-muted hover:text-navy-950"}`}
                >
                  {typeLabel[k]}
                </button>
              ))}
            </div>

            {kind === "parcel" ? (
              <div>
                <label htmlFor="pos-weight" className="text-sm font-medium text-ink">Parcel weight (kg)</label>
                <input id="pos-weight" type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="pos-item" className="text-sm font-medium text-ink">{kind === "bus-ticket" ? "Route" : "Event"}</label>
                  <select id="pos-item" value={item} onChange={(e) => setItem(e.target.value)} className={`mt-1.5 ${inputClass} h-12`}>
                    <option value="">Choose…</option>
                    {catalogue.map((c) => (
                      <option key={c.id} value={c.id}>{c.label} — {formatPrice(c.price, c.currency)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pos-qty" className="text-sm font-medium text-ink">Quantity</label>
                  <input id="pos-qty" type="number" min={1} max={9} value={quantity} onChange={(e) => setQuantity(Math.min(9, Math.max(1, Number(e.target.value) || 1)))} className={`mt-1.5 ${inputClass} h-12`} />
                </div>
              </>
            )}

            <div>
              <label htmlFor="pos-phone" className="text-sm font-medium text-ink">Customer mobile (for the SMS receipt)</label>
              <input id="pos-phone" className={`mt-1.5 ${inputClass} h-12`} placeholder="+265 999 000 000" />
            </div>

            <div role="radiogroup" aria-label="Payment method" className="flex gap-2">
              {(["cash", "mobile-money"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  onClick={() => setMethod(m)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${method === m ? "bg-navy-950 text-white" : "bg-surface-alt text-ink-muted hover:text-navy-950"}`}
                >
                  {m === "cash" ? "Cash" : "Mobile money"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-ink-faint">Total</p>
                <p className="text-xl font-bold text-navy-950">{formatPrice(total, currency)}</p>
              </div>
              <Button type="submit" variant="accent" size="lg" disabled={!canSell}>Complete sale</Button>
            </div>
            {receipt && <p role="status" className="text-sm text-success">{receipt}</p>}
          </form>
        </Card>

        <Card className="h-fit">
          <h2 className="text-lg font-bold text-navy-950">This session</h2>
          {sales.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Sales you complete appear here.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {sales.map((s) => (
                <li key={s.id} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-navy-950">{typeLabel[s.type]}</span>
                    <span className="text-ink">{formatPrice(s.amount, s.currency)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">{s.reference} · {s.time}</p>
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
  const cash = posTransactions.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
  const mobile = posTransactions.filter((t) => t.method === "mobile-money").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader title="Transactions" description="Today's sales taken through your registered POS device." demo />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cash collected" value={formatPrice(cash, "MWK")} />
        <StatCard label="Mobile money" value={formatPrice(mobile, "MWK")} />
        <StatCard label="Transactions" value={posTransactions.length} />
      </div>

      <div className="mt-6">
        <TableShell>
          <THead columns={["Time", "Type", "Reference", "Method", "Amount"]} />
          <tbody>
            {posTransactions.map((t) => (
              <tr key={t.id} className={rowClass}>
                <td className={`${cell} text-ink-muted`}>{t.time}</td>
                <td className={`${cell} text-navy-950`}>{typeLabel[t.type]}</td>
                <td className={`${cell} text-ink-muted`}>{t.reference}</td>
                <td className={cell}><Badge tone={t.method === "cash" ? "neutral" : "success"}>{t.method === "cash" ? "Cash" : "Mobile money"}</Badge></td>
                <td className={`${cell} font-semibold text-navy-950`}>{formatPrice(t.amount, t.currency)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

export function EndOfDayPanel() {
  const cashSales = posTransactions.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
  const expected = posFloat.opening + cashSales;
  const [counted, setCounted] = useState("");
  const [closed, setClosed] = useState(false);

  const countedNumber = Number(counted);
  const variance = counted === "" ? null : countedNumber - expected;

  return (
    <div>
      <PageHeader
        title="End of day"
        description="Count your till, compare it with what the system expects, and close the day. Cash discrepancies are recorded against your agent account."
        demo
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Opening float" value={formatPrice(posFloat.opening, posFloat.currency)} />
        <StatCard label="Cash sales today" value={formatPrice(cashSales, posFloat.currency)} />
        <StatCard label="Expected in till" value={formatPrice(expected, posFloat.currency)} hint={`Float limit ${formatPrice(posFloat.limit, posFloat.currency)}`} />
      </div>

      <Card className="mt-6 max-w-xl">
        <h2 className="text-lg font-bold text-navy-950">Count your till</h2>
        <label htmlFor="counted" className="mt-4 block text-sm font-medium text-ink">Cash counted (MWK)</label>
        <input id="counted" type="number" min={0} value={counted} onChange={(e) => setCounted(e.target.value)} disabled={closed} className={`mt-1.5 ${inputClass} h-12`} />

        {variance !== null && (
          <p role="status" className={`mt-3 text-sm ${variance === 0 ? "text-success" : "text-warning"}`}>
            {variance === 0
              ? "Till balances exactly."
              : `${variance > 0 ? "Over" : "Short"} by ${formatPrice(Math.abs(variance), posFloat.currency)} — this will be flagged for review.`}
          </p>
        )}

        <Button type="button" variant="accent" size="lg" className="mt-5" disabled={counted === "" || closed} onClick={() => setClosed(true)}>
          {closed ? "Day closed" : "Close the day"}
        </Button>
      </Card>
    </div>
  );
}
