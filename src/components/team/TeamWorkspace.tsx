"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type Role = { id: number; name: string; description?: string; permissions?: string[] };
type Invitation = { id: number; email: string; name: string; role?: Role | string | null; status?: string; expiresAt?: string; createdAt?: string };
type Profile = { id: number; businessName: string; country?: string; status?: string };
type AuditEvent = { id: number; action: string; resource?: string; createdAt?: string; details?: string };

function listPayload<T>(payload: unknown, key: string) {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>)[key])) {
    return (payload as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function getRoleName(role: Invitation["role"]) {
  if (!role) return "No role";
  return typeof role === "string" ? role : role.name;
}

export function TeamWorkspace() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadWorkspace() {
    setError("");
    const currentProfile = await apiRequest<Profile | null>("/api/kyb");
    if (!currentProfile) throw new Error("Create a business profile before managing a team.");
    setProfile(currentProfile);
    const query = `?businessProfileId=${currentProfile.id}`;
    const [rolePayload, invitationPayload, auditPayload] = await Promise.all([
      apiRequest<unknown>(`/api/team/roles${query}`),
      apiRequest<unknown>(`/api/team/invitations${query}`),
      apiRequest<unknown>(`/api/audit${query}`),
    ]);
    setRoles(listPayload<Role>(rolePayload, "roles"));
    setInvitations(listPayload<Invitation>(invitationPayload, "invitations"));
    setAudit(listPayload<AuditEvent>(auditPayload, "events"));
  }

  useEffect(() => {
    if (!getAuthSession()) {
      router.replace("/login");
      return;
    }
    queueMicrotask(() => {
      loadWorkspace().catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load team data."));
    });
  }, [router]);

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      await apiRequest<Role>("/api/team/roles", {
        method: "POST",
        body: JSON.stringify({
          businessProfileId: profile.id,
          name: form.get("name"),
          description: form.get("description"),
          permissions: String(form.get("permissions") || "read").split(",").map((permission) => permission.trim()).filter(Boolean),
        }),
      });
      event.currentTarget.reset();
      await loadWorkspace();
      setNotice("Role created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create role.");
    } finally {
      setBusy(false);
    }
  }

  async function sendInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const roleId = form.get("roleId");
      await apiRequest<Invitation>("/api/team/invitations", {
        method: "POST",
        body: JSON.stringify({
          businessProfileId: profile.id,
          email: form.get("email"),
          name: form.get("name"),
          ...(roleId ? { roleId: Number(roleId) } : {}),
          expiresInDays: Number(form.get("expiresInDays") || 7),
        }),
      });
      event.currentTarget.reset();
      await loadWorkspace();
      setNotice("Invitation created and queued for email delivery.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Business workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-navy-950">{profile?.businessName || "Team management"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">Create roles and invite accepted team members to your verified business profile.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => loadWorkspace().catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Refresh failed."))}>Refresh</Button>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-6 rounded-lg bg-success-surface px-4 py-3 text-sm text-success">{notice}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={createRole} className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Create a role</h2>
          <p className="mt-1 text-sm text-ink-muted">Only the business owner can create roles.</p>
          <div className="mt-5 grid gap-4">
            <input name="name" required placeholder="Role name" className="h-11 rounded-xl border px-3 text-sm" />
            <input name="description" placeholder="Description" className="h-11 rounded-xl border px-3 text-sm" />
            <input name="permissions" defaultValue="read,write" placeholder="Permissions, comma separated" className="h-11 rounded-xl border px-3 text-sm" />
            <Button type="submit" disabled={busy}>Create role</Button>
          </div>
        </form>

        <form onSubmit={sendInvitation} className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Invite a team member</h2>
          <p className="mt-1 text-sm text-ink-muted">Invitations remain pending for seven days by default.</p>
          <div className="mt-5 grid gap-4">
            <input name="name" required placeholder="Full name" className="h-11 rounded-xl border px-3 text-sm" />
            <input name="email" required type="email" placeholder="Email address" className="h-11 rounded-xl border px-3 text-sm" />
            <select name="roleId" defaultValue="" className="h-11 rounded-xl border bg-surface px-3 text-sm">
              <option value="">No custom role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <Button type="submit" variant="accent" disabled={busy}>Send invitation</Button>
          </div>
        </form>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Roles</h2>
          <div className="mt-4 divide-y divide-line">
            {roles.length === 0 && <p className="py-3 text-sm text-ink-muted">No custom roles yet.</p>}
            {roles.map((role) => <div key={role.id} className="py-3"><p className="font-semibold text-navy-950">{role.name}</p><p className="text-sm text-ink-muted">{role.description || "No description"} · {(role.permissions || []).join(", ") || "No permissions"}</p></div>)}
          </div>
        </div>
        <div className="rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">Invitations</h2>
          <div className="mt-4 divide-y divide-line">
            {invitations.length === 0 && <p className="py-3 text-sm text-ink-muted">No invitations yet.</p>}
            {invitations.map((invitation) => <div key={invitation.id} className="py-3"><div className="flex justify-between gap-3"><p className="font-semibold text-navy-950">{invitation.name}</p><span className="text-xs uppercase text-ink-faint">{invitation.status || "pending"}</span></div><p className="text-sm text-ink-muted">{invitation.email} · {getRoleName(invitation.role)}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-navy-950">Recent activity</h2>
        <div className="mt-4 divide-y divide-line">
          {audit.slice(0, 8).map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium text-navy-950">{event.action}</span><span className="text-ink-muted">{event.resource || "Team"}{event.createdAt ? ` · ${new Date(event.createdAt).toLocaleDateString()}` : ""}</span></div>)}
          {audit.length === 0 && <p className="py-3 text-sm text-ink-muted">No audit activity yet.</p>}
        </div>
      </section>
    </div>
  );
}