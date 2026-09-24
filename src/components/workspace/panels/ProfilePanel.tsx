"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { countries } from "@/lib/data";
import { createBusinessProfile } from "@/lib/auth";
import { ROLES, clearSignupDraft, getSignupDraft } from "@/lib/roles";
import { Card, PageHeader, inputClass } from "../ui";
import { useWorkspace } from "../WorkspaceContext";

export function BusinessProfilePanel() {
  const { role, token, user, profile, profileError, reloadProfile } = useWorkspace();
  const config = ROLES[role];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Sign-up captured the business name; use it as the starting point.
  const [draftName] = useState(() => getSignupDraft()?.businessName ?? "");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setBusy(true);

    try {
      const data = new FormData(form);
      await createBusinessProfile(token, {
        businessName: String(data.get("businessName") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        address: String(data.get("address") || ""),
        city: String(data.get("city") || ""),
        country: String(data.get("country") || ""),
        type: String(data.get("type") || "company"),
        website: String(data.get("website") || ""),
        description: String(data.get("description") || ""),
      });
      clearSignupDraft();
      await reloadProfile();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create your business profile.");
    } finally {
      setBusy(false);
    }
  }

  const defaultCountry = countries.some((c) => c.code === user?.country) ? String(user?.country) : countries[0].code;

  return (
    <div>
      <PageHeader
        title="Business profile"
        description={`Your verified business details (KYC/KYB) — required before your ${config.label.toLowerCase()} account goes live and payouts are enabled.`}
      />

      {profileError && (
        <p role="alert" className="mt-6 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
          {profileError}
        </p>
      )}

      {profile === undefined && !profileError && <p className="mt-8 text-sm text-ink-muted">Loading…</p>}

      {profile === null && (
        <Card className="mt-8">
          <h2 className="text-lg font-bold text-navy-950">Create your business profile</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Settlement payouts are only enabled once the payout account name matches the verified business name.
          </p>

          <form onSubmit={handleCreate} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="businessName" className="text-sm font-medium text-ink">Business name</label>
              <input id="businessName" name="businessName" required defaultValue={draftName} className={`mt-1.5 ${inputClass} h-12`} placeholder="Nyasa Express Ltd" />
            </div>
            <div>
              <label htmlFor="type" className="text-sm font-medium text-ink">Business type</label>
              <select id="type" name="type" defaultValue="company" className={`mt-1.5 ${inputClass} h-12`}>
                <option value="company">Registered company</option>
                <option value="individual">Individual / sole trader</option>
              </select>
            </div>
            <div>
              <label htmlFor="business-email" className="text-sm font-medium text-ink">Business email</label>
              <input id="business-email" name="email" type="email" required defaultValue={user?.email?.includes("@") ? user.email : ""} className={`mt-1.5 ${inputClass} h-12`} placeholder="business@example.com" />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">Phone</label>
              <input id="phone" name="phone" required className={`mt-1.5 ${inputClass} h-12`} placeholder="+265 999 000 000" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium text-ink">Address</label>
              <input id="address" name="address" required className={`mt-1.5 ${inputClass} h-12`} placeholder="123 Main Street" />
            </div>
            <div>
              <label htmlFor="city" className="text-sm font-medium text-ink">City</label>
              <input id="city" name="city" required className={`mt-1.5 ${inputClass} h-12`} placeholder="Lilongwe" />
            </div>
            <div>
              <label htmlFor="profile-country" className="text-sm font-medium text-ink">Country</label>
              <select id="profile-country" name="country" required defaultValue={defaultCountry} className={`mt-1.5 ${inputClass} h-12`}>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="website" className="text-sm font-medium text-ink">Website (optional)</label>
              <input id="website" name="website" className={`mt-1.5 ${inputClass} h-12`} placeholder="https://example.com" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-ink">Description (optional)</label>
              <textarea id="description" name="description" rows={3} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-navy-400" placeholder="What does your business do?" />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error sm:col-span-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" size="lg" disabled={busy} className="sm:col-span-2">
              {busy ? "Creating…" : "Create business profile"}
            </Button>
          </form>
        </Card>
      )}

      {profile && (
        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-950">{profile.businessName}</h2>
            <Badge tone="success">Profile created</Badge>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {(
              [
                ["Type", profile.type || "—"],
                ["Email", profile.email],
                ["Phone", profile.phone],
                ["Location", `${profile.city}, ${profile.country}`],
                ["Address", profile.address],
                ["Website", profile.website || "—"],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="truncate text-right text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {profile.description && <p className="mt-4 text-sm text-ink-muted">{profile.description}</p>}
        </Card>
      )}
    </div>
  );
}
