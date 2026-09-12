"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDashboardSession } from "@/lib/useDashboardSession";
import {
  createTeamInvitation,
  createTeamRole,
  getBusinessProfile,
  listTeamInvitations,
  listTeamRoles,
  type BusinessProfile,
  type TeamInvitation,
  type TeamRole,
} from "@/lib/auth";

export default function TeamPage() {
  const { token, ready } = useDashboardSession();
  const [profile, setProfile] = useState<BusinessProfile | null | undefined>(undefined);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    (async () => {
      const businessProfile = await getBusinessProfile(token);
      setProfile(businessProfile);
      if (businessProfile) {
        setRoles(await listTeamRoles(token, businessProfile.id));
        setInvitations(await listTeamInvitations(token, businessProfile.id));
      }
    })();
  }, [ready, token]);

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profile) return;
    setError("");
    setBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const created = await createTeamRole(token, {
        businessProfileId: profile.id,
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || ""),
        permissions: String(formData.get("permissions") || "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });
      if (created) setRoles((prev) => [...prev, created]);
      event.currentTarget.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create role.");
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profile) return;
    setError("");
    setBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const roleId = formData.get("roleId");
      const created = await createTeamInvitation(token, {
        businessProfileId: profile.id,
        email: String(formData.get("email") || ""),
        name: String(formData.get("name") || ""),
        ...(roleId ? { roleId: String(roleId) } : {}),
      });
      if (created) setInvitations((prev) => [...prev, created]);
      event.currentTarget.reset();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Could not send invitation.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || profile === undefined) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-line p-6">
        <h1 className="text-lg font-bold text-navy-950">No business profile yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Team roles and invitations belong to a business profile — create yours
          from the overview page first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Team</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every staff account is individually attributable — shared logins aren&apos;t
        permitted. Create a role, then invite people into it.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Roles</h2>

          <ul className="mt-4 flex flex-col gap-2">
            {roles.length === 0 && (
              <li className="text-sm text-ink-muted">No roles yet — create one below.</li>
            )}
            {roles.map((role) => (
              <li key={role.id} className="rounded-xl border border-line p-3">
                <p className="text-sm font-semibold text-navy-950">{role.name}</p>
                {role.description && (
                  <p className="mt-0.5 text-xs text-ink-muted">{role.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <Badge key={p} tone="neutral">{p}</Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={handleCreateRole} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            <div>
              <label htmlFor="role-name" className="text-sm font-medium text-ink">Role name</label>
              <input id="role-name" name="name" required className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-400" placeholder="Booking Officer" />
            </div>
            <div>
              <label htmlFor="role-description" className="text-sm font-medium text-ink">Description</label>
              <input id="role-description" name="description" className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-400" placeholder="Processes bookings and cancellations" />
            </div>
            <div>
              <label htmlFor="role-permissions" className="text-sm font-medium text-ink">Permissions (comma separated)</label>
              <input id="role-permissions" name="permissions" className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-400" placeholder="read, write, invite" />
            </div>
            <Button type="submit" variant="primary" size="md" disabled={busy}>
              Create role
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Invitations</h2>

          <ul className="mt-4 flex flex-col gap-2">
            {invitations.length === 0 && (
              <li className="text-sm text-ink-muted">No invitations sent yet.</li>
            )}
            {invitations.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{invite.name}</p>
                  <p className="text-xs text-ink-muted">{invite.email}</p>
                </div>
                <Badge tone={invite.status === "accepted" ? "success" : "warning"}>
                  {invite.status || "pending"}
                </Badge>
              </li>
            ))}
          </ul>

          <form onSubmit={handleInvite} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            <div>
              <label htmlFor="invite-name" className="text-sm font-medium text-ink">Full name</label>
              <input id="invite-name" name="name" required className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-400" placeholder="Team Member" />
            </div>
            <div>
              <label htmlFor="invite-email" className="text-sm font-medium text-ink">Email</label>
              <input id="invite-email" name="email" type="email" required className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-400" placeholder="member@example.com" />
            </div>
            <div>
              <label htmlFor="invite-role" className="text-sm font-medium text-ink">Role</label>
              <select id="invite-role" name="roleId" className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-navy-400">
                <option value="">No specific role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="accent" size="md" disabled={busy}>
              Send invitation
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
