"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SearchBand } from "@/components/search/SearchBand";
import { ModuleSearchBar } from "@/components/search/ModuleSearchBar";
import { getParcelTracking, type ParcelTracking } from "@/lib/operations";

const stages = ["registered", "in-transit", "out-for-delivery", "delivered"] as const;

function stageIndex(status: string) {
  const index = stages.indexOf(status as (typeof stages)[number]);
  return index === -1 ? 0 : index;
}

export default function ParcelsPage(props: { searchParams: Promise<{ ref?: string }> }) {
  const [ref, setRef] = useState("");
  const [tracking, setTracking] = useState<ParcelTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The search bar navigates with ?ref=..., so re-run the lookup when it changes.
  useEffect(() => {
    props.searchParams.then((params) => {
      const value = typeof params.ref === "string" ? params.ref.trim() : "";
      setRef(value);
      if (!value) {
        setTracking(null);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      getParcelTracking(value)
        .then(setTracking)
        .catch(() => {
          setTracking(null);
          setError(`No parcel found for “${value}”. Check the tracking number and try again.`);
        })
        .finally(() => setLoading(false));
    });
  }, [props.searchParams]);

  const currentStage = tracking ? stageIndex(tracking.status) : -1;

  return (
    <div>
      <SearchBand>
        <ModuleSearchBar module="parcel" defaultRef={ref} />
      </SearchBand>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {ref ? (
          loading ? (
            <p className="text-sm text-ink-muted">Tracking {ref}…</p>
          ) : error ? (
            <div className="rounded-2xl border border-line p-6">
              <p role="alert" className="text-sm text-error">{error}</p>
            </div>
          ) : tracking ? (
            <div className="rounded-2xl border border-line p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-ink-faint">Tracking number</p>
                  <p className="text-lg font-bold text-navy-950">{tracking.reference}</p>
                </div>
                <Badge tone={tracking.status === "delivered" ? "success" : tracking.status === "registered" ? "neutral" : "warning"}>
                  {tracking.status.replace(/-/g, " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {tracking.origin} → {tracking.destination}
                {tracking.weightKg ? ` · ${tracking.weightKg}kg` : ""}
              </p>

              <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stages.map((stage, i) => (
                  <li key={stage} className="flex flex-col items-center text-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        i <= currentStage
                          ? "bg-navy-950 text-white"
                          : "bg-surface-alt text-ink-faint"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        i <= currentStage ? "text-navy-950" : "text-ink-faint"
                      }`}
                    >
                      {stage.replace(/-/g, " ")}
                    </span>
                  </li>
                ))}
              </ol>

              {tracking.timeline.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-sm font-bold text-navy-950">Scan history</h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {tracking.timeline.map((event, index) => (
                      <li key={index} className="rounded-xl border border-line px-4 py-3 text-sm">
                        <span className="font-medium text-navy-950">{event.status.replace(/-/g, " ")}</span>
                        {event.location ? <span className="text-ink-muted"> · {event.location}</span> : null}
                        <span className="block text-xs text-ink-faint">
                          {new Date(event.occurredAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-8 text-sm text-ink-muted">
                {tracking.status === "delivered"
                  ? "Delivered and signed for."
                  : `Last update: ${tracking.timeline[0]?.status.replace(/-/g, " ") ?? "registered"}. Estimated delivery within 1–2 business days.`}
              </p>
            </div>
          ) : null
        ) : (
          <p className="text-sm text-ink-faint">
            Enter a tracking number above to follow your parcel.
          </p>
        )}

        <p className="mt-6 text-sm text-ink-muted">
          Need to send a parcel instead?{" "}
          <Link href="/parcels/send" className="font-semibold text-navy-950 hover:text-gold-600">
            Register one here →
          </Link>
        </p>
      </div>
    </div>
  );
}
