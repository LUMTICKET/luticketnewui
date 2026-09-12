"use client";

import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { posTransactions } from "@/lib/dashboard-mock";
import { formatPrice } from "@/lib/format";

const typeLabel = {
  "bus-ticket": "Bus ticket",
  parcel: "Parcel",
  "event-ticket": "Event ticket",
} as const;

export default function RetailPosPage() {
  const { ready } = useDashboardSession();
  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  const cashTotal = posTransactions
    .filter((t) => t.method === "cash")
    .reduce((sum, t) => sum + t.amount, 0);
  const mobileTotal = posTransactions
    .filter((t) => t.method === "mobile-money")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Retail &amp; POS</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Today&apos;s sales, taken on Lumiticket&apos;s behalf, with the
            daily float reconciled below.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Cash collected</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{formatPrice(cashTotal, "MWK")}</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Mobile money</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{formatPrice(mobileTotal, "MWK")}</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Float limit</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{formatPrice(100000, "MWK")}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {posTransactions.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink-muted">{t.time}</td>
                <td className="px-4 py-3 text-navy-950">{typeLabel[t.type]}</td>
                <td className="px-4 py-3 text-ink-muted">{t.reference}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.method === "cash" ? "neutral" : "success"}>
                    {t.method === "cash" ? "Cash" : "Mobile money"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-navy-950">
                  {formatPrice(t.amount, t.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
