"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import { parcelQueue, type ParcelJob } from "@/lib/dashboard-mock";

const stages: ParcelJob["status"][] = [
  "registered",
  "in-transit",
  "out-for-delivery",
  "delivered",
];

const tone = {
  registered: "neutral",
  "in-transit": "warning",
  "out-for-delivery": "warning",
  delivered: "success",
  failed: "error",
} as const;

function nextStage(status: ParcelJob["status"]) {
  const index = stages.indexOf(status);
  if (index === -1 || index === stages.length - 1) return status;
  return stages[index + 1];
}

export default function CourierOperatorPage() {
  const { ready } = useDashboardSession();
  const [jobs, setJobs] = useState(parcelQueue);

  if (!ready) return <p className="text-sm text-ink-muted">Loading…</p>;

  function advance(id: string) {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: nextStage(job.status) } : job,
      ),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Courier operator</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Parcel queue, driver assignment, and delivery confirmation.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-line p-5 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-sm font-semibold text-navy-950">{job.ref}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {job.sender} → {job.recipient} · {job.route}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                Courier: {job.courier} · {job.weight}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge tone={tone[job.status]}>{job.status.replace(/-/g, " ")}</Badge>
              {job.status !== "delivered" && job.status !== "failed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => advance(job.id)}
                >
                  Mark as {nextStage(job.status).replace(/-/g, " ")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
