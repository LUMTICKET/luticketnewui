"use client";

import { useEffect, useState } from "react";
import { useDashboardSession } from "@/lib/useDashboardSession";
import {
  getBusinessProfile,
  listAuditLog,
  type AuditEntry,
  type BusinessProfile,
} from "@/lib/auth";

export default function AuditLogPage() {
  const { token, ready } = useDashboardSession();
  const [profile, setProfile] = useState<BusinessProfile | null | undefined>(undefined);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    (async () => {
      const businessProfile = await getBusinessProfile(token);
      setProfile(businessProfile);
      if (businessProfile) {
        setEntries(await listAuditLog(token, businessProfile.id));
      }
    })();
  }, [ready, token]);

  if (!ready || profile === undefined) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-line p-6">
        <h1 className="text-lg font-bold text-navy-950">No business profile yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The audit log tracks activity on a business profile — create yours
          from the overview page first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Audit log</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every role, invitation, and event change on {profile.businessName} is
        recorded here for accountability.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-muted">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-950">{entry.action}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {typeof entry.details === "string"
                      ? entry.details
                      : entry.details
                        ? JSON.stringify(entry.details)
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-faint">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
