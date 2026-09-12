"use client";

import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { settlements } from "@/lib/dashboard-mock";
import { formatPrice } from "@/lib/format";

export default function FinancePage() {
  const { ready } = useDashboardSession();
  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  const totalGross = settlements.reduce((sum, s) => sum + s.gross, 0);
  const totalCommission = settlements.reduce((sum, s) => sum + s.commission, 0);
  const pending = settlements.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Finance &amp; settlements</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Split settlement across operator, platform commission, and gateway
            fees, with reconciliation for every payout.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Gross this period</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{formatPrice(totalGross, "MWK")}</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Platform commission</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{formatPrice(totalCommission, "MWK")}</p>
        </div>
        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Pending payouts</p>
          <p className="mt-1 text-xl font-bold text-navy-950">{pending}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net payout</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-navy-950">{row.operator}</td>
                <td className="px-4 py-3 text-ink-muted">{row.period}</td>
                <td className="px-4 py-3 text-ink-muted">{formatPrice(row.gross, row.currency)}</td>
                <td className="px-4 py-3 text-ink-muted">{formatPrice(row.commission, row.currency)}</td>
                <td className="px-4 py-3 font-semibold text-navy-950">{formatPrice(row.net, row.currency)}</td>
                <td className="px-4 py-3">
                  <Badge tone={row.status === "paid" ? "success" : "warning"}>{row.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
