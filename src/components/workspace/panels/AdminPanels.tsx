"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { sampleBookings } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { kycQueue, platformOperators, type KycQueueItem, type PlatformOperator } from "@/lib/dashboard-mock";
import {
  commissionRules,
  platformAudit,
  rbacPermissions,
  rbacRoles,
  reconciliationFlags,
  supportCases,
  type RbacPermission,
  type RbacRole,
  type ReconciliationFlag,
  type SupportCase,
} from "@/lib/workspace-mock";
import { Card, PageHeader, StatCard, TableShell, THead, cell, inputClass, rowClass } from "../ui";

// ---------------------------------------------------------------------------
// KYC review
// ---------------------------------------------------------------------------
const kycTone = { pending: "warning", approved: "success", rejected: "error", "re-verification": "warning" } as const;
const riskTone = { low: "success", medium: "warning", high: "error" } as const;

export function KycReviewPanel() {
  const [queue, setQueue] = useState(kycQueue);

  function decide(id: string, status: KycQueueItem["status"]) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <div>
      <PageHeader
        title="KYC review"
        description="Review submitted identity and business documents, then approve, reject, or request re-verification. Every decision is recorded with reviewer and timestamp."
        demo
      />
      <div className="mt-8 flex flex-col gap-3">
        {queue.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-navy-950">{item.applicant}</p>
              <p className="mt-1 text-sm text-ink-muted">{item.role} · Submitted {item.submitted}</p>
              <div className="mt-2 flex gap-2">
                <Badge tone={riskTone[item.riskTier]}>{item.riskTier} risk</Badge>
                <Badge tone={kycTone[item.status]}>{item.status.replace("-", " ")}</Badge>
              </div>
            </div>
            {(item.status === "pending" || item.status === "re-verification") && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => decide(item.id, "re-verification")}>Request re-verification</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => decide(item.id, "rejected")}>Reject</Button>
                <Button type="button" variant="primary" size="sm" onClick={() => decide(item.id, "approved")}>Approve</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operators & agents
// ---------------------------------------------------------------------------
export function OperatorsPanel() {
  const [operators, setOperators] = useState<PlatformOperator[]>(platformOperators);

  return (
    <div>
      <PageHeader
        title="Operators & agents"
        description="Every merchant on the platform: adjust commission per account, or suspend and reactivate it."
        demo
      />
      <div className="mt-8">
        <TableShell>
          <THead columns={["Name", "Type", "Country", "Commission", "Status", ""]} />
          <tbody>
            {operators.map((op) => (
              <tr key={op.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{op.name}</td>
                <td className={`${cell} text-ink-muted`}>{op.type}</td>
                <td className={`${cell} text-ink-muted`}>{op.country}</td>
                <td className={cell}>
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`${op.name} commission`}
                      type="number"
                      min={0}
                      max={100}
                      value={op.commissionRate}
                      onChange={(e) => setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, commissionRate: Number(e.target.value) } : o)))}
                      className="h-9 w-16 rounded-lg border border-line px-2 text-sm focus:border-navy-400"
                    />
                    <span className="text-ink-muted">%</span>
                  </div>
                </td>
                <td className={cell}><Badge tone={op.status === "active" ? "success" : "error"}>{op.status}</Badge></td>
                <td className={`${cell} text-right`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOperators((prev) => prev.map((o) => (o.id === op.id ? { ...o, status: o.status === "active" ? "suspended" : "active" } : o)))}
                  >
                    {op.status === "active" ? "Suspend" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commission & settlement rules
// ---------------------------------------------------------------------------
export function CommissionPanel() {
  const [rules, setRules] = useState(commissionRules);
  const [frequency, setFrequency] = useState("weekly");
  const [advanceLimit, setAdvanceLimit] = useState(30);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader
        title="Commission & settlement"
        description="Platform-wide defaults for how each payment is split and when operators are paid. Changes apply without a code release."
        demo
      />

      <Card className="mt-8">
        <h2 className="text-lg font-bold text-navy-950">Commission rates</h2>
        <div className="mt-4 divide-y divide-line">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-4 py-3">
              <label htmlFor={`rate-${rule.id}`} className="text-sm font-medium text-ink">{rule.service}</label>
              <div className="flex items-center gap-1">
                <input
                  id={`rate-${rule.id}`}
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={rule.rate}
                  onChange={(e) => { setSaved(false); setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, rate: Number(e.target.value) } : r))); }}
                  className="h-10 w-20 rounded-lg border border-line px-2 text-sm focus:border-navy-400"
                />
                <span className="text-ink-muted">%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Settlement rules</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="frequency" className="text-sm font-medium text-ink">Payout frequency</label>
            <select id="frequency" value={frequency} onChange={(e) => { setSaved(false); setFrequency(e.target.value); }} className={`mt-1.5 ${inputClass} h-12`}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="advance" className="text-sm font-medium text-ink">Advance-settlement limit on presales (%)</label>
            <input id="advance" type="number" min={0} max={100} value={advanceLimit} onChange={(e) => { setSaved(false); setAdvanceLimit(Number(e.target.value)); }} className={`mt-1.5 ${inputClass} h-12`} />
          </div>
        </div>
        <Button type="button" variant="accent" size="md" className="mt-5" onClick={() => setSaved(true)}>Save changes</Button>
        {saved && <p role="status" className="mt-3 text-sm text-success">Saved (sample data — nothing was sent to a server).</p>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles & permissions (RBAC)
// ---------------------------------------------------------------------------
export function RolesPanel() {
  const [roles, setRoles] = useState<RbacRole[]>(rbacRoles);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<RbacRole["scope"]>("Operator");

  function toggle(roleName: string, permission: RbacPermission) {
    setRoles((prev) =>
      prev.map((r) =>
        r.name === roleName
          ? { ...r, grants: r.grants.includes(permission) ? r.grants.filter((g) => g !== permission) : [...r.grants, permission] }
          : r,
      ),
    );
  }

  function addRole(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) return;
    setRoles((prev) => [...prev, { name: trimmed, scope, grants: [] }]);
    setName("");
  }

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Create, modify and revoke roles. Access is enforced at the API level — the interface only reflects it."
        demo
      />

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Role</th>
              {rbacPermissions.map((p) => (
                <th key={p} className="px-2 py-3 text-center font-semibold [writing-mode:vertical-rl] rotate-180">{p}</th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name} className={rowClass}>
                <td className={cell}>
                  <p className="font-medium text-navy-950">{role.name}</p>
                  <p className="text-xs text-ink-faint">{role.scope}</p>
                </td>
                {rbacPermissions.map((p) => (
                  <td key={p} className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${role.name}: ${p}`}
                      checked={role.grants.includes(p)}
                      onChange={() => toggle(role.name, p)}
                      className="h-4 w-4 accent-navy-950"
                    />
                  </td>
                ))}
                <td className={`${cell} text-right`}>
                  {role.name !== "Administrator" && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRoles((prev) => prev.filter((r) => r.name !== role.name))}>
                      Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Create a role</h2>
        <form onSubmit={addRole} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input aria-label="Role name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Regional Supervisor" className={inputClass} />
          <select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value as RbacRole["scope"])} className={inputClass}>
            <option value="Platform">Platform</option>
            <option value="Operator">Operator</option>
            <option value="Field">Field</option>
          </select>
          <Button type="submit" variant="accent" size="md" disabled={!name.trim()}>Add role</Button>
        </form>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment reconciliation
// ---------------------------------------------------------------------------
const flagTone = { "auto-refunded": "neutral", "booking-completed": "success", "needs-review": "warning" } as const;

export function PlatformReconciliationPanel() {
  const [flags, setFlags] = useState<ReconciliationFlag[]>(reconciliationFlags);
  const open = flags.filter((f) => f.status === "needs-review").length;

  return (
    <div>
      <PageHeader
        title="Payment reconciliation"
        description="When a gateway confirms a payment but the booking fails to write, the reconciliation job either completes the booking or refunds automatically — and logs the incident here."
        demo
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Incidents (7d)" value={flags.length} />
        <StatCard label="Needs review" value={open} tone={open ? "warning" : "default"} />
        <StatCard label="Auto-resolved" value={flags.length - open} />
      </div>

      <div className="mt-6">
        <TableShell>
          <THead columns={["Gateway ref", "Issue", "Amount", "When", "Outcome", ""]} />
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.id} className={rowClass}>
                <td className={`${cell} font-medium text-navy-950`}>{flag.gatewayRef}</td>
                <td className={`${cell} max-w-xs text-ink-muted`}>{flag.issue}</td>
                <td className={`${cell} text-ink-muted`}>{formatPrice(flag.amount, flag.currency)}</td>
                <td className={`${cell} text-ink-faint`}>{flag.when}</td>
                <td className={cell}><Badge tone={flagTone[flag.status]}>{flag.status.replace("-", " ")}</Badge></td>
                <td className={`${cell} text-right`}>
                  {flag.status === "needs-review" && (
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, status: "auto-refunded" } : f)))}>Refund</Button>
                      <Button type="button" variant="primary" size="sm" onClick={() => setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, status: "booking-completed" } : f)))}>Complete booking</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Platform audit log
// ---------------------------------------------------------------------------
export function PlatformAuditPanel() {
  return (
    <div>
      <PageHeader
        title="Platform audit log"
        description="Validation, payment, settlement and access-control actions across the platform, attributed to individual staff accounts."
        demo
      />
      <div className="mt-8">
        <TableShell>
          <THead columns={["When", "Actor", "Action", "Target"]} />
          <tbody>
            {platformAudit.map((entry) => (
              <tr key={entry.id} className={rowClass}>
                <td className={`${cell} text-ink-faint`}>{entry.time}</td>
                <td className={`${cell} text-ink-muted`}>{entry.actor}</td>
                <td className={`${cell} font-medium text-navy-950`}>{entry.action}</td>
                <td className={`${cell} text-ink-muted`}>{entry.target}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Support console (general internal staff)
// ---------------------------------------------------------------------------
const caseTone = { open: "warning", waiting: "neutral", resolved: "success" } as const;

export function SupportConsolePanel() {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<SupportCase[]>(supportCases);
  const [notice, setNotice] = useState("");

  const q = query.trim().toLowerCase();
  const matches = q
    ? sampleBookings.filter((b) => b.reference.toLowerCase().includes(q) || b.title.toLowerCase().includes(q) || b.detail.toLowerCase().includes(q))
    : [];

  return (
    <div>
      <PageHeader
        title="Support console"
        description="Look up any booking or parcel, follow its status, and take support-level actions on a customer's behalf."
        demo
      />

      <Card className="mt-8">
        <label htmlFor="support-search" className="text-sm font-medium text-ink">Booking or tracking reference</label>
        <input
          id="support-search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setNotice(""); }}
          placeholder="e.g. LMT-PCL-20481 or LMT-R1-2029"
          className={`mt-1.5 ${inputClass} h-12`}
        />

        {q && matches.length === 0 && <p className="mt-4 text-sm text-ink-muted">No booking or parcel matches “{query}”.</p>}

        {matches.map((b) => (
          <div key={b.id} className="mt-4 rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-950">{b.title}</p>
              <Badge tone={b.status === "cancelled" ? "error" : b.status === "completed" || b.status === "delivered" ? "success" : "warning"}>{b.status.replace("-", " ")}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{b.detail} · {b.reference} · {b.date} · {formatPrice(b.amount, b.currency)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setNotice(`Ticket for ${b.reference} re-sent to the customer.`)}>Resend ticket</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setNotice(`Refund started for ${b.reference}.`)}>Issue refund</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setNotice(`${b.reference} escalated to the operator.`)}>Escalate</Button>
            </div>
          </div>
        ))}
        {notice && <p role="status" className="mt-4 text-sm text-success">{notice}</p>}
      </Card>

      <h2 className="mt-8 text-lg font-bold text-navy-950">Cases</h2>
      <div className="mt-3 flex flex-col gap-3">
        {cases.map((c) => (
          <Card key={c.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-navy-950">{c.subject}</p>
              <p className="mt-1 text-xs text-ink-muted">{c.customer} · {c.ref} · opened {c.opened}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={caseTone[c.status]}>{c.status}</Badge>
              {c.status !== "resolved" && (
                <Button type="button" variant="outline" size="sm" onClick={() => setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "resolved" } : x)))}>
                  Mark resolved
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
