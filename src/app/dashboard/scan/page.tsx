"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { validationLog, type ValidationLogEntry } from "@/lib/dashboard-mock";

const resultTone = {
  valid: "success",
  invalid: "error",
  duplicate: "warning",
} as const;

export default function ScanningValidationPage() {
  const { ready } = useDashboardSession();
  const [entries, setEntries] = useState(validationLog);
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState("");

  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) return;

    const alreadyUsed = entries.some((e) => e.code === code.trim() && e.result === "valid");
    const entry: ValidationLogEntry = {
      id: `scan-${Date.now()}`,
      code: code.trim(),
      kind: code.trim().toLowerCase().includes("pcl") ? "parcel" : "ticket",
      result: alreadyUsed ? "duplicate" : "valid",
      mode: offline ? "manual" : "auto",
      device: "This device",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      synced: !offline,
    };
    setEntries((prev) => [entry, ...prev]);
    setCode("");
  }

  const pendingSync = entries.filter((e) => !e.synced).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Scanning &amp; validation</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Validates tickets and parcels at boarding, entry, or delivery —
            online or offline.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={offline}
              onChange={(e) => setOffline(e.target.checked)}
              className="h-4 w-4 accent-navy-950"
            />
            Simulate no connectivity
          </label>
          {pendingSync > 0 && (
            <Badge tone="warning">{pendingSync} queued for sync</Badge>
          )}
        </div>

        <form onSubmit={handleScan} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="scan-code">Scan or enter a code</label>
          <input
            id="scan-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Scan a QR code, or type one to simulate — e.g. QR-88213"
            className="h-12 flex-1 rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
          />
          <Button type="submit" variant="accent" size="lg">
            Validate
          </Button>
        </form>
        <p className="mt-2 text-xs text-ink-faint">
          A code already marked valid above will be flagged as a duplicate,
          not silently accepted — matching offline reconciliation rules.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Synced</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-navy-950">{entry.code}</td>
                <td className="px-4 py-3 text-ink-muted">{entry.kind}</td>
                <td className="px-4 py-3">
                  <Badge tone={resultTone[entry.result]}>{entry.result}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-muted">{entry.mode}</td>
                <td className="px-4 py-3 text-ink-muted">{entry.device}</td>
                <td className="px-4 py-3 text-ink-faint">{entry.time}</td>
                <td className="px-4 py-3">
                  {entry.synced ? (
                    <Badge tone="success">Synced</Badge>
                  ) : (
                    <Badge tone="warning">Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
