"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import {
  kycQueue,
  platformOperators,
  type KycQueueItem,
  type PlatformOperator,
} from "@/lib/dashboard-mock";

const kycTone = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  "re-verification": "warning",
} as const;

const riskTone = {
  low: "success",
  medium: "warning",
  high: "error",
} as const;

export default function SystemAdminPage() {
  const { ready } = useDashboardSession();
  const [queue, setQueue] = useState(kycQueue);
  const [operators, setOperators] = useState(platformOperators);

  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  function decide(id: string, status: KycQueueItem["status"]) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function toggleOperator(id: string) {
    setOperators((prev) =>
      prev.map((op) =>
        op.id === id
          ? { ...op, status: op.status === "active" ? "suspended" : "active" }
          : op,
      ),
    );
  }

  function updateCommission(id: string, rate: number) {
    setOperators((prev) =>
      prev.map((op) => (op.id === id ? { ...op, commissionRate: rate } : op)),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">System administration</h1>
          <p className="mt-1 text-sm text-ink-muted">
            KYC review, and commission and account controls for every operator
            and agent on the platform.
          </p>
        </div>
        <DemoBadge />
      </div>

      <h2 className="mt-8 text-lg font-bold text-navy-950">KYC review queue</h2>
      <div className="mt-3 flex flex-col gap-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-line p-5 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-sm font-semibold text-navy-950">{item.applicant}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {item.role} · Submitted {item.submitted}
              </p>
              <div className="mt-2 flex gap-2">
                <Badge tone={riskTone[item.riskTier]}>{item.riskTier} risk</Badge>
                <Badge tone={kycTone[item.status]}>{item.status.replace("-", " ")}</Badge>
              </div>
            </div>

            {(item.status === "pending" || item.status === "re-verification") && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => decide(item.id, "rejected")}>
                  Reject
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => decide(item.id, "approved")}>
                  Approve
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold text-navy-950">Operators &amp; agents</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {operators.map((op: PlatformOperator) => (
              <tr key={op.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-navy-950">{op.name}</td>
                <td className="px-4 py-3 text-ink-muted">{op.type}</td>
                <td className="px-4 py-3 text-ink-muted">{op.country}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={op.commissionRate}
                      onChange={(e) => updateCommission(op.id, Number(e.target.value))}
                      className="h-9 w-16 rounded-lg border border-line px-2 text-sm focus:border-navy-400"
                    />
                    <span className="text-ink-muted">%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={op.status === "active" ? "success" : "error"}>{op.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleOperator(op.id)}>
                    {op.status === "active" ? "Suspend" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
