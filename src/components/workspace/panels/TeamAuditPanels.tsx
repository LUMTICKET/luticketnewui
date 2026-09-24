"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  createTeamInvitation,
  createTeamRole,
  listAuditLog,
  listTeamInvitations,
  listTeamRoles,
  type AuditEntry,
  type BusinessProfile,
  type TeamInvitation,
  type TeamRole,
} from "@/lib/auth";
import { Card, PageHeader, TableShell, THead, cell, inputClass, rowClass } from "../ui";
import { ProfileGate } from "../shared";
import { useWorkspace } from "../WorkspaceContext";

export function TeamPanel() {
  return (
    <div>
      <PageHeader
        title="Team"
        description="Every staff account is individually attributable — shared logins aren't permitted. Create roles, then invite people into them."
      />
      <div className="mt-8">
        <ProfileGate feature="Your team">{(profile) => <TeamManager profile={profile} />}</ProfileGate>
      </div>
    </div>
  );
}

function TeamManager({ profile }: { profile: BusinessProfile }) {
  const { token } = useWorkspace();
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedRoles, loadedInvitations] = await Promise.all([
          listTeamRoles(token, profile.id),
          listTeamInvitations(token, profile.id),
        ]);
        if (cancelled) return;
        setRoles(loadedRoles);
        setInvitations(loadedInvitations);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load your team.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, profile.id]);

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setBusy(true);
    try {
      const data = new FormData(form);
      const created = await createTeamRole(token, {
        businessProfileId: profile.id,
        name: String(data.get("name") || ""),
        description: String(data.get("description") || ""),
        permissions: String(data.get("permissions") || "read")
          .split(",")
          .map((permission) => permission.trim())
          .filter(Boolean),
      });
      if (created) setRoles((prev) => [...prev, created]);
      form.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create role.");
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setBusy(true);
    try {
      const data = new FormData(form);
      const roleId = data.get("roleId");
      const created = await createTeamInvitation(token, {
        businessProfileId: profile.id,
        email: String(data.get("email") || ""),
        name: String(data.get("name") || ""),
        ...(roleId ? { roleId: String(roleId) } : {}),
        expiresInDays: Number(data.get("expiresInDays") || 7),
      });
      if (created) setInvitations((prev) => [...prev, created]);
      form.reset();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Could not send invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <p role="alert" className="mb-6 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-navy-950">Roles</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {roles.length === 0 && <li className="text-sm text-ink-muted">No roles yet — create one below.</li>}
            {roles.map((role) => (
              <li key={role.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-semibold text-navy-950">{role.name}</p>
                {role.description && <p className="mt-0.5 text-xs text-ink-muted">{role.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <Badge key={p} tone="neutral">{p}</Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={handleCreateRole} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            <h3 className="text-sm font-semibold text-navy-950">Create role</h3>
            <div>
              <label htmlFor="role-name" className="text-sm font-medium text-ink">Role name</label>
              <input id="role-name" name="name" required className={`mt-1.5 ${inputClass}`} placeholder="Booking Officer" />
            </div>
            <div>
              <label htmlFor="role-description" className="text-sm font-medium text-ink">Description</label>
              <input id="role-description" name="description" className={`mt-1.5 ${inputClass}`} placeholder="Processes bookings and cancellations" />
            </div>
            <div>
              <label htmlFor="role-permissions" className="text-sm font-medium text-ink">Permissions</label>
              <input id="role-permissions" name="permissions" defaultValue="read" className={`mt-1.5 ${inputClass}`} placeholder="read, write, invite" />
            </div>
            <Button type="submit" variant="primary" size="md" disabled={busy}>Create role</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-navy-950">Invitations</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {invitations.length === 0 && <li className="text-sm text-ink-muted">No invitations sent yet.</li>}
            {invitations.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{invite.name}</p>
                  <p className="text-xs text-ink-muted">{invite.email}</p>
                </div>
                <Badge tone={invite.status === "accepted" ? "success" : "warning"}>{invite.status || "pending"}</Badge>
              </li>
            ))}
          </ul>

          <form onSubmit={handleInvite} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            <div>
              <label htmlFor="invite-name" className="text-sm font-medium text-ink">Full name</label>
              <input id="invite-name" name="name" required className={`mt-1.5 ${inputClass}`} placeholder="Team member" />
            </div>
            <div>
              <label htmlFor="invite-email" className="text-sm font-medium text-ink">Email</label>
              <input id="invite-email" name="email" type="email" required className={`mt-1.5 ${inputClass}`} placeholder="member@example.com" />
            </div>
            <div>
              <label htmlFor="invite-role" className="text-sm font-medium text-ink">Role</label>
              <select id="invite-role" name="roleId" className={`mt-1.5 ${inputClass}`}>
                <option value="">No specific role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="invite-expires" className="text-sm font-medium text-ink">Expires in days</label>
              <input id="invite-expires" name="expiresInDays" type="number" min="1" max="30" defaultValue="7" required className={`mt-1.5 ${inputClass}`} />
            </div>
            <Button type="submit" variant="accent" size="md" disabled={busy}>Send invitation</Button>
          </form>
        </Card>
      </div>
    </>
  );
}

export function AuditPanel() {
  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every role, invitation and listing change on your business is recorded here for accountability."
      />
      <div className="mt-8">
        <ProfileGate feature="The audit log">{(profile) => <AuditTable profile={profile} />}</ProfileGate>
      </div>
    </div>
  );
}

function AuditTable({ profile }: { profile: BusinessProfile }) {
  const { token } = useWorkspace();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listAuditLog(token, profile.id)
      .then((loaded) => {
        if (!cancelled) setEntries(loaded);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load the audit log.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, profile.id]);

  if (error) return <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>;
  if (!entries) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <TableShell>
      <THead columns={["Action", "Details", "When"]} />
      <tbody>
        {entries.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-4 py-6 text-center text-ink-muted">No activity recorded yet.</td>
          </tr>
        ) : (
          entries.map((entry) => (
            <tr key={entry.id} className={rowClass}>
              <td className={`${cell} font-medium text-navy-950`}>{entry.action}</td>
              <td className={`${cell} text-ink-muted`}>
                {typeof entry.details === "string" ? entry.details : entry.details ? JSON.stringify(entry.details) : "—"}
              </td>
              <td className={`${cell} text-ink-faint`}>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}</td>
            </tr>
          ))
        )}
      </tbody>
    </TableShell>
  );
}
