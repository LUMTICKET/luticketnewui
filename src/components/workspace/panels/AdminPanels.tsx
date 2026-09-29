"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import {
  getParcelTracking,
  listKycQueue,
  listPlatformAudit,
  listPlatformOperators,
  listReconciliationFlags,
  listSupportCases,
  listAdminRoles,
  listCommissionRules,
  createReconciliationFlag,
  createSupportCase,
  createPlatformRole,
  decideKyc,
  replacePlatformRolePermissions,
  resolveReconciliationFlag,
  setOperatorAccountStatus,
  updateSupportCaseStatus,
  upsertCommissionRule,
  type CommissionRule,
  type KycQueueItem,
  type PlatformAuditEntry,
  type PlatformOperator,
  type PlatformRole,
  type ReconciliationFlag,
} from "@/lib/operations";
import { Card, PageHeader, StatCard, TableShell, THead, cell, inputClass, rowClass } from "../ui";

// ---------------------------------------------------------------------------
// Shared load wrapper
// ---------------------------------------------------------------------------
function useApiList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

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
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { items, setItems, error, setError, reload };
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Try again
        </button>
      )}
    </p>
  );
}

function Loading() {
  return <p className="mt-8 text-sm text-ink-muted">Loading…</p>;
}

// ---------------------------------------------------------------------------
// KYC review
// ---------------------------------------------------------------------------
const kycTone: Record<string, "warning" | "success" | "error"> = { pending: "warning", approved: "success", rejected: "error", "re-verification": "warning" };
const riskTone: Record<string, "warning" | "success" | "error"> = { low: "success", medium: "warning", high: "error" };

export function KycReviewPanel() {
  const { items: queue, setItems, error, setError, reload } = useApiList(listKycQueue);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(item: KycQueueItem, status: "approved" | "rejected" | "re-verification") {
    setBusyId(String(item.id));
    setError("");
    try {
      const updated = await decideKyc(item.id, status);
      setItems((prev) => prev?.map((q) => (q.id === item.id ? { ...q, ...updated } : q)) ?? prev);
    } catch (decideError) {
      setError(decideError instanceof Error ? decideError.message : "Could not record the decision.");
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="KYC review"
        description="Review submitted business profiles, then approve, reject, or request re-verification. Approving also verifies the business on the platform. Every decision is recorded."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {queue === null ? (
        <Loading />
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {queue.length === 0 && <p className="text-sm text-ink-muted">The review queue is clear.</p>}
          {queue.map((item) => (
            <Card key={String(item.id)} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-navy-950">{item.businessName}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {item.country || "—"} · {item.email || "no email"} · Submitted{" "}
                  {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}
                </p>
                <div className="mt-2 flex gap-2">
                  {item.riskTier && <Badge tone={riskTone[item.riskTier] ?? "neutral"}>{item.riskTier} risk</Badge>}
                  <Badge tone={kycTone[item.status] ?? "neutral"}>{item.status.replace("-", " ")}</Badge>
                </div>
              </div>
              {(item.status === "pending" || item.status === "re-verification") && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === String(item.id)}
                    onClick={() => void decide(item, "re-verification")}
                  >
                    Request re-verification
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === String(item.id)}
                    onClick={() => void decide(item, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={busyId === String(item.id)}
                    onClick={() => void decide(item, "approved")}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operators & agents
// ---------------------------------------------------------------------------
export function OperatorsPanel() {
  const { items: operators, setItems, error, setError, reload } = useApiList(listPlatformOperators);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(operator: PlatformOperator) {
    const accountStatus = operator.accountStatus === "active" ? "suspended" : "active";
    setBusyId(String(operator.id));
    setError("");
    setItems((prev) =>
      prev?.map((o) => (o.id === operator.id ? { ...o, accountStatus } : o)) ?? prev,
    );
    try {
      await setOperatorAccountStatus(operator.id, accountStatus);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update the account.");
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Operators & agents"
        description="Every merchant on the platform — suspend or reactivate accounts. Commission rates are managed under Commission & settlement."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {operators === null ? (
        <Loading />
      ) : (
        <div className="mt-8">
          <TableShell>
            <THead columns={["Name", "Type", "Country", "Owner", "Verified", "Status", ""]} />
            <tbody>
              {operators.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                    No merchant accounts yet.
                  </td>
                </tr>
              )}
              {operators.map((op) => (
                <tr key={String(op.id)} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{op.businessName}</td>
                  <td className={`${cell} text-ink-muted`}>{op.type || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>{op.country || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>{op.ownerName || "—"}</td>
                  <td className={cell}>
                    <Badge tone={op.isVerified ? "success" : "warning"}>{op.isVerified ? "Verified" : "Pending"}</Badge>
                  </td>
                  <td className={cell}>
                    <Badge tone={op.accountStatus === "active" ? "success" : "error"}>{op.accountStatus}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === String(op.id)}
                      onClick={() => void toggleStatus(op)}
                    >
                      {op.accountStatus === "active" ? "Suspend" : "Reactivate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commission & settlement rules
// ---------------------------------------------------------------------------
export function CommissionPanel() {
  const { items: rules, setItems, error, setError, reload } = useApiList(listCommissionRules);
  const [busy, setBusy] = useState(false);
  const [savedService, setSavedService] = useState<string | null>(null);

  const serviceLabels: Record<string, string> = {
    bus: "Bus tickets",
    events: "Event tickets",
    parcels: "Parcels",
    agent: "Retail / POS agent commission",
    gateway: "Payment gateway fee (pass-through)",
  };

  async function save(rule: CommissionRule, rate: number) {
    setBusy(true);
    setError("");
    try {
      const updated = await upsertCommissionRule(rule.service, rate);
      setItems((prev) => prev?.map((r) => (r.id === rule.id ? updated : r)) ?? prev);
      setSavedService(rule.service);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the rate.");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Commission & settlement"
        description="Platform-wide commission per service. Changes apply immediately — every upsert is recorded in the platform audit log."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {rules === null ? (
        <Loading />
      ) : (
        <Card className="mt-8">
          <h2 className="text-lg font-bold text-navy-950">Commission rates</h2>
          <div className="mt-4 divide-y divide-line">
            {rules.map((rule) => (
              <CommissionRow
                key={String(rule.id)}
                rule={rule}
                label={serviceLabels[rule.service] ?? rule.service}
                busy={busy}
                saved={savedService === rule.service}
                onSave={(rate) => void save(rule, rate)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CommissionRow({
  rule,
  label,
  busy,
  saved,
  onSave,
}: {
  rule: CommissionRule;
  label: string;
  busy: boolean;
  saved: boolean;
  onSave: (rate: number) => void;
}) {
  const [rate, setRate] = useState(String(rule.rate));

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={`rate-${rule.id}`} className="text-sm font-medium text-ink">
        {label}
        {saved && <span className="ml-2 text-xs font-semibold text-success">Saved ✓</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`rate-${rule.id}`}
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="h-10 w-20 rounded-lg border border-line px-2 text-sm focus:border-navy-400"
        />
        <span className="text-ink-muted">%</span>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onSave(Number(rate))}>
          Save
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles & permissions (RBAC)
// ---------------------------------------------------------------------------
export function RolesPanel() {
  const [roles, setRoles] = useState<PlatformRole[] | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"platform" | "operator" | "field">("operator");

  const load = useCallback(async () => {
    setError("");
    try {
      const payload = await listAdminRoles();
      setRoles(payload.roles);
      setPermissions(payload.permissions);
    } catch (loadError) {
      setRoles([]);
      setError(loadError instanceof Error ? loadError.message : "Could not load roles.");
    }
  }, []);

  const loadRef = useRef(load);
  useEffect(() => {
    void loadRef.current();
  }, []);

  async function toggle(roleName: string, permission: string) {
    const role = roles?.find((r) => r.name === roleName);
    if (!role) return;
    const next = role.permissions.includes(permission)
      ? role.permissions.filter((p) => p !== permission)
      : [...role.permissions, permission];

    setRoles((prev) =>
      prev?.map((r) => (r.name === roleName ? { ...r, permissions: next } : r)) ?? prev,
    );
    setError("");
    try {
      await replacePlatformRolePermissions(roleName, next);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update the role.");
      load();
    }
  }

  async function addRole(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || roles?.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) return;
    setBusy(true);
    setError("");
    try {
      await createPlatformRole({ name: trimmed, scope, permissions: [] });
      setName("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the role.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Create platform, operator or field roles and toggle their permission keys. Changes are enforced by the API and audited."
      />
      <ErrorNotice message={error} onRetry={load} />
      {roles === null ? (
        <Loading />
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  {permissions.map((p) => (
                    <th key={p} className="px-2 py-3 text-center font-semibold [writing-mode:vertical-rl] rotate-180">
                      {p.replace(/-/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={permissions.length + 1} className="px-4 py-6 text-center text-ink-muted">
                      No roles yet — create one below.
                    </td>
                  </tr>
                )}
                {roles.map((role) => (
                  <tr key={String(role.id)} className={rowClass}>
                    <td className={cell}>
                      <p className="font-medium text-navy-950">{role.name}</p>
                      <p className="text-xs text-ink-faint">{role.scope}</p>
                    </td>
                    {permissions.map((p) => (
                      <td key={p} className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${role.name}: ${p}`}
                          checked={role.permissions.includes(p)}
                          onChange={() => void toggle(role.name, p)}
                          className="h-4 w-4 accent-navy-950"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="mt-6">
            <h2 className="text-lg font-bold text-navy-950">Create a role</h2>
            <form onSubmit={addRole} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
              <input
                aria-label="Role name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Regional Supervisor"
                className={inputClass}
              />
              <select
                aria-label="Scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as "platform" | "operator" | "field")}
                className={inputClass}
              >
                <option value="platform">Platform</option>
                <option value="operator">Operator</option>
                <option value="field">Field</option>
              </select>
              <Button type="submit" variant="accent" size="md" disabled={!name.trim() || busy}>
                Add role
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment reconciliation
// ---------------------------------------------------------------------------
const flagTone: Record<string, "neutral" | "success" | "warning"> = { "auto-refunded": "neutral", "booking-completed": "success", "needs-review": "warning" };

export function PlatformReconciliationPanel() {
  const { items: flags, setItems, error, setError, reload } = useApiList(listReconciliationFlags);
  const [busy, setBusy] = useState(false);
  const [gatewayRef, setGatewayRef] = useState("");
  const [amount, setAmount] = useState("");
  const [issue, setIssue] = useState("");

  const open = (flags ?? []).filter((f) => f.status === "needs-review").length;

  async function resolve(flag: ReconciliationFlag, status: "auto-refunded" | "booking-completed" | "needs-review") {
    setError("");
    setItems((prev) => prev?.map((f) => (f.id === flag.id ? { ...f, status } : f)) ?? prev);
    try {
      await resolveReconciliationFlag(flag.id, status);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Could not resolve the flag.");
      reload();
    }
  }

  async function addFlag(event: FormEvent) {
    event.preventDefault();
    if (!gatewayRef.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await createReconciliationFlag({
        gatewayRef: gatewayRef.trim(),
        amount: amount ? Number(amount) : undefined,
        issue: issue.trim() || undefined,
      });
      setItems((prev) => [...(prev ?? []), created]);
      setGatewayRef("");
      setAmount("");
      setIssue("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the flag.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Payment reconciliation"
        description="When a gateway confirms a payment but the booking fails to write, the reconciliation job either completes the booking or refunds automatically — and logs the incident here."
      />
      <ErrorNotice message={error} onRetry={reload} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Incidents" value={(flags ?? []).length} />
        <StatCard label="Needs review" value={open} tone={open ? "warning" : "default"} />
        <StatCard label="Auto-resolved" value={(flags ?? []).length - open} />
      </div>

      {flags === null ? (
        <Loading />
      ) : (
        <div className="mt-6">
          <TableShell>
            <THead columns={["Gateway ref", "Issue", "Amount", "Detected", "Outcome", ""]} />
            <tbody>
              {flags.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                    No reconciliation flags recorded.
                  </td>
                </tr>
              )}
              {flags.map((flag) => (
                <tr key={String(flag.id)} className={rowClass}>
                  <td className={`${cell} font-medium text-navy-950`}>{flag.gatewayRef}</td>
                  <td className={`${cell} max-w-xs text-ink-muted`}>{flag.issue || "—"}</td>
                  <td className={`${cell} text-ink-muted`}>
                    {typeof flag.amount === "number" ? formatPrice(flag.amount, flag.currency || "MWK") : "—"}
                  </td>
                  <td className={`${cell} text-ink-faint`}>
                    {flag.detectedAt ? new Date(flag.detectedAt).toLocaleString() : "—"}
                  </td>
                  <td className={cell}>
                    <Badge tone={flagTone[flag.status] ?? "neutral"}>{flag.status.replace(/-/g, " ")}</Badge>
                  </td>
                  <td className={`${cell} text-right`}>
                    {flag.status === "needs-review" && (
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void resolve(flag, "auto-refunded")}>
                          Refund
                        </Button>
                        <Button type="button" variant="primary" size="sm" onClick={() => void resolve(flag, "booking-completed")}>
                          Complete booking
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Log a reconciliation flag</h2>
        <form onSubmit={addFlag} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_170px_1fr_auto]">
          <input
            value={gatewayRef}
            onChange={(e) => setGatewayRef(e.target.value)}
            required
            placeholder="Gateway reference e.g. GW-88213"
            aria-label="Gateway reference"
            className={inputClass}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={0}
            placeholder="Amount (optional)"
            aria-label="Amount"
            className={inputClass}
          />
          <input
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Issue description (optional)"
            aria-label="Issue"
            className={inputClass}
          />
          <Button type="submit" variant="accent" size="md" disabled={busy}>
            Log flag
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Platform audit log
// ---------------------------------------------------------------------------
export function PlatformAuditPanel() {
  const { items: entries, error, reload } = useApiList(listPlatformAudit);

  return (
    <div>
      <PageHeader
        title="Platform audit log"
        description="Every admin mutation — commission changes, KYC decisions, role updates, reconciliation resolutions and support actions — attributed to the acting staff account."
      />
      <ErrorNotice message={error} onRetry={reload} />
      {entries === null ? (
        <Loading />
      ) : (
        <div className="mt-8">
          <TableShell>
            <THead columns={["When", "Actor", "Action", "Resource"]} />
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                    No platform activity recorded yet.
                  </td>
                </tr>
              )}
              {entries.map((entry: PlatformAuditEntry) => (
                <tr key={String(entry.id)} className={rowClass}>
                  <td className={`${cell} text-ink-faint`}>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className={`${cell} text-ink-muted`}>{entry.actorUserId ? `User ${entry.actorUserId}` : "System"}</td>
                  <td className={`${cell} font-medium text-navy-950`}>{entry.action}</td>
                  <td className={`${cell} text-ink-muted`}>
                    {entry.resourceType || "—"}
                    {entry.resourceId ? ` #${entry.resourceId}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Support console (general internal staff)
// ---------------------------------------------------------------------------
const caseTone: Record<string, "warning" | "neutral" | "success"> = { open: "warning", waiting: "neutral", resolved: "success" };

export function SupportConsolePanel() {
  const { items: cases, setItems, error, setError, reload } = useApiList(() => listSupportCases());
  const [lookup, setLookup] = useState("");
  const [tracking, setTracking] = useState<Awaited<ReturnType<typeof getParcelTracking>> | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function searchReference(event: FormEvent) {
    event.preventDefault();
    const ref = lookup.trim();
    if (!ref) return;
    setTracking(null);
    setNotice("");
    setError("");
    try {
      setTracking(await getParcelTracking(ref));
    } catch {
      setNotice(`No parcel found for ${ref}.`);
    }
  }

  async function resolveCase(id: string | number, status: "open" | "waiting" | "resolved") {
    setError("");
    setItems((prev) => prev?.map((c) => (c.id === id ? { ...c, status } : c)) ?? prev);
    try {
      await updateSupportCaseStatus(id, status);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the case.");
      reload();
    }
  }

  async function addCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await createSupportCase({
        customerName: String(data.get("customerName") || "").trim(),
        subject: String(data.get("subject") || "").trim(),
        reference: String(data.get("reference") || "") || undefined,
        kind: String(data.get("kind") || "bus"),
      });
      setItems((prev) => [created, ...(prev ?? [])]);
      form.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not open the case.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Support console"
        description="Track any parcel by reference, open support cases, and move them to resolved. Case decisions are recorded on the platform audit log."
      />
      <ErrorNotice message={error} onRetry={reload} />

      <Card className="mt-8">
        <h2 className="text-lg font-bold text-navy-950">Look up a tracking reference</h2>
        <form onSubmit={searchReference} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="e.g. LMT-PCL-20481"
            aria-label="Tracking reference"
            className={`flex-1 ${inputClass} h-12`}
          />
          <Button type="submit" variant="accent" size="md">
            Look up
          </Button>
        </form>
        {notice && <p role="status" className="mt-3 text-sm text-ink-muted">{notice}</p>}

        {tracking && (
          <div className="mt-4 rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-950">
                {tracking.reference} · {tracking.origin} → {tracking.destination}
              </p>
              <Badge tone={tracking.status === "delivered" ? "success" : "warning"}>{tracking.status.replace(/-/g, " ")}</Badge>
            </div>
            <ol className="mt-3 flex flex-col gap-2">
              {tracking.timeline.map((event, index) => (
                <li key={index} className="text-sm text-ink-muted">
                  <span className="font-medium text-navy-950">{event.status.replace(/-/g, " ")}</span>
                  {event.location ? ` · ${event.location}` : ""} · {new Date(event.occurredAt).toLocaleString()}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      <h2 className="mt-8 text-lg font-bold text-navy-950">Cases</h2>
      {cases === null ? (
        <Loading />
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {cases.length === 0 && <p className="text-sm text-ink-muted">No support cases open.</p>}
          {cases.map((c) => (
            <Card key={String(c.id)} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-navy-950">{c.subject}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {c.customerName} · {c.reference || "no reference"} · {c.kind} · opened{" "}
                  {c.openedAt ? new Date(c.openedAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={caseTone[c.status] ?? "neutral"}>{c.status}</Badge>
                {c.status !== "resolved" && (
                  <div className="flex gap-2">
                    {c.status === "open" && (
                      <Button type="button" variant="outline" size="sm" onClick={() => void resolveCase(c.id, "waiting")}>
                        Wait on customer
                      </Button>
                    )}
                    <Button type="button" variant="primary" size="sm" onClick={() => void resolveCase(c.id, "resolved")}>
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-bold text-navy-950">Open a case</h2>
        <form onSubmit={addCase} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="customerName" required placeholder="Customer name" aria-label="Customer name" className={inputClass} />
          <input name="subject" required placeholder="Subject" aria-label="Subject" className={inputClass} />
          <input name="reference" placeholder="Booking / tracking reference (optional)" aria-label="Reference" className={inputClass} />
          <select name="kind" aria-label="Kind" className={inputClass} defaultValue="bus">
            <option value="bus">Bus</option>
            <option value="event">Event</option>
            <option value="parcel">Parcel</option>
          </select>
          <Button type="submit" variant="accent" size="md" disabled={busy} className="sm:col-span-2">
            Open case
          </Button>
        </form>
      </Card>
    </div>
  );
}
