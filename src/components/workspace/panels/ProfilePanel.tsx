"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { countries } from "@/lib/data";
import { updateBusinessProfile } from "@/lib/operations";
import { getRegistrationStatus, registerBusiness } from "@/lib/auth-flow";
import { fetchBusinessTypes, type BusinessType } from "@/lib/business-types";
import { ROLES, clearSignupDraft, getSignupDraft } from "@/lib/roles";
import { Card, PageHeader, inputClass } from "../ui";
import { useWorkspace } from "../WorkspaceContext";

export function BusinessProfilePanel() {
  const { role, token, user, profile, profileError, reloadProfile } = useWorkspace();
  const config = ROLES[role];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  // Sign-up captured the business name and individual/company choice; use them as the starting point.
  const [draftName] = useState(() => getSignupDraft()?.businessName ?? "");
  const [draftAccountType] = useState(() => getSignupDraft()?.accountType ?? "company");
  // GET /api/business/register is the authoritative onboarding state: it reports
  // whether a business exists and which KYB fields are still empty.
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [typesFailed, setTypesFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRegistrationStatus().then((status) => {
      if (!cancelled) setMissingFields(status.missingFields);
    });
    fetchBusinessTypes()
      .then((types) => {
        if (!cancelled) setBusinessTypes(types);
      })
      .catch(() => {
        if (!cancelled) setTypesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = event.currentTarget;
    setError("");
    setBusy(true);

    try {
      const data = new FormData(form);
      await updateBusinessProfile(token, profile.id, {
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
      setEditing(false);
      await reloadProfile();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update your business profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setBusy(true);

    try {
      const data = new FormData(form);
      // The API's intended first step is deliberately minimal: only the
      // business type and name are required. Everything else is collected by
      // the details form below, so onboarding never stalls on a long form.
      const result = await registerBusiness({
        businessType: String(data.get("businessType") || ""),
        businessName: String(data.get("businessName") || "").trim(),
        type: String(data.get("type") || "company") as "individual" | "company",
        country: String(data.get("country") || ""),
        phone: String(data.get("phone") || ""),
        email: String(data.get("email") || ""),
      });
      setMissingFields(result.missingFields ?? []);
      clearSignupDraft();
      await reloadProfile();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create your business profile.");
    } finally {
      setBusy(false);
    }
  }

  // The business type recorded on the account is the safe default, so the
  // select is never left with nothing to submit if the list fails to load.
  const storedTypeSlug = typeof user?.businessType === "object" && user.businessType !== null
    ? (user.businessType as { slug?: string }).slug
    : undefined;

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
          <h2 className="text-lg font-bold text-navy-950">Register your business</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Two details get you set up. The API creates the profile with an empty KYB form, and you finish
            the remaining details from this same screen straight after.
          </p>

          <form onSubmit={handleCreate} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="businessName" className="text-sm font-medium text-ink">Business name</label>
              <input id="businessName" name="businessName" required defaultValue={draftName} className={`mt-1.5 ${inputClass} h-12`} placeholder="Nyasa Express Ltd" />
            </div>
            <div>
              <label htmlFor="businessType" className="text-sm font-medium text-ink">Business type</label>
              <select
                id="businessType"
                name="businessType"
                required
                defaultValue={storedTypeSlug ?? businessTypes[0]?.slug}
                className={`mt-1.5 ${inputClass} h-12`}
              >
                {businessTypes.length === 0 && (
                  <option value={storedTypeSlug ?? ""}>
                    {typesFailed ? "Could not load types — use your saved selection" : "Loading business types…"}
                  </option>
                )}
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.slug}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className="text-sm font-medium text-ink">Legal structure</label>
              <select id="type" name="type" defaultValue={draftAccountType} className={`mt-1.5 ${inputClass} h-12`}>
                <option value="company">Registered company</option>
                <option value="individual">Individual / sole trader</option>
              </select>
            </div>
            <div>
              <label htmlFor="business-email" className="text-sm font-medium text-ink">Business email (optional)</label>
              <input id="business-email" name="email" type="email" defaultValue={user?.email?.includes("@") ? user.email : ""} className={`mt-1.5 ${inputClass} h-12`} placeholder="business@example.com" />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">Phone (optional)</label>
              <input id="phone" name="phone" className={`mt-1.5 ${inputClass} h-12`} placeholder="+265 999 000 000" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium text-ink">Address (optional)</label>
              <input id="address" name="address" className={`mt-1.5 ${inputClass} h-12`} placeholder="123 Main Street" />
            </div>
            <div>
              <label htmlFor="city" className="text-sm font-medium text-ink">City (optional)</label>
              <input id="city" name="city" className={`mt-1.5 ${inputClass} h-12`} placeholder="Lilongwe" />
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
              {busy ? "Registering…" : "Register business"}
            </Button>
          </form>
        </Card>
      )}

      {profile && missingFields.length > 0 && (
        <p role="status" className="mt-6 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
          <strong>Finish your business details.</strong> The API still needs{" "}
          {missingFields.join(", ")} before this profile is complete — payouts and
          publishing stay limited until then.
        </p>
      )}

      {profile && (
        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-950">{profile.businessName}</h2>
            <div className="flex items-center gap-2">
              {profile.isVerified === true ? (
                <Badge tone="success">Verified</Badge>
              ) : (
                <Badge tone="warning">In KYC review</Badge>
              )}
              <Badge tone="success">Profile created</Badge>
            </div>
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

          {editing ? (
            <form onSubmit={handleUpdate} className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-businessName" className="text-sm font-medium text-ink">Business name</label>
                <input id="edit-businessName" name="businessName" required defaultValue={profile.businessName} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div>
                <label htmlFor="edit-type" className="text-sm font-medium text-ink">Business type</label>
                <select id="edit-type" name="type" defaultValue={String(profile.type || "company")} className={`mt-1.5 ${inputClass} h-12`}>
                  <option value="company">Registered company</option>
                  <option value="individual">Individual / sole trader</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-email" className="text-sm font-medium text-ink">Business email</label>
                <input id="edit-email" name="email" type="email" required defaultValue={profile.email} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div>
                <label htmlFor="edit-phone" className="text-sm font-medium text-ink">Phone</label>
                <input id="edit-phone" name="phone" required defaultValue={profile.phone} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-address" className="text-sm font-medium text-ink">Address</label>
                <input id="edit-address" name="address" required defaultValue={profile.address} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div>
                <label htmlFor="edit-city" className="text-sm font-medium text-ink">City</label>
                <input id="edit-city" name="city" required defaultValue={profile.city} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div>
                <label htmlFor="edit-country" className="text-sm font-medium text-ink">Country</label>
                <select id="edit-country" name="country" required defaultValue={profile.country} className={`mt-1.5 ${inputClass} h-12`}>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-website" className="text-sm font-medium text-ink">Website</label>
                <input id="edit-website" name="website" defaultValue={profile.website || ""} className={`mt-1.5 ${inputClass} h-12`} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-ink">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  defaultValue={profile.description || ""}
                  className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-navy-400"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error sm:col-span-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" variant="accent" size="lg" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="md"
              className="mt-6"
              onClick={() => {
                setError("");
                setEditing(true);
              }}
            >
              {missingFields.length > 0 ? "Complete business details" : "Edit business details"}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
