"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchBusinessTypes, workspaceForBusinessType, type BusinessType } from "@/lib/business-types";
import { persistBusinessType } from "@/lib/onboarding";
import { getAuthSession, getAuthUser, saveAuthUser } from "@/lib/auth";
import { ROLES, getStoredRole, resolveRole, roleLanding, safeNext, saveRole } from "@/lib/roles";

/**
 * The one place a business type is chosen.
 *
 * It is deliberately its own page rather than a field on the sign-up form:
 * account creation stays short, and every entry point (signup, password login
 * after 2FA, and Google sign-in) lands here until the account has a type on
 * record. The choice is written to the database with PATCH /api/auth/signup.
 */
export function BusinessTypeStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [types, setTypes] = useState<BusinessType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBusinessTypes()
      .then((loaded) => {
        if (cancelled) return;
        setTypes(loaded);
        // Pre-select the type already on the account, so revisiting this page
        // never silently changes an existing choice.
        const stored = getAuthUser()?.businessType;
        const storedSlug = typeof stored === "object" && stored !== null ? stored?.slug : undefined;
        setSelected(storedSlug ?? loaded[0]?.slug ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load business types. Check your connection and try again.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    router.push(next ?? roleLanding(getStoredRole()));
    router.refresh();
  }, [next, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Choose the type of business you run to continue.");
      return;
    }

    const session = getAuthSession();
    if (!session?.token) {
      setSessionMissing(true);
      return;
    }

    setError("");
    setBusy(true);
    try {
      const result = await persistBusinessType(session.token, selected);

      // Keep the cached user in step so the dashboard and workspace shell read
      // the type without another /api/auth/me round-trip.
      const previous = getAuthUser();
      if (previous) saveAuthUser({ ...previous, ...(result.user ?? {}) }, true);

      // The chosen type decides the workspace for accounts that have one.
      const role = resolveRole(getStoredRole() ?? "customer", result.user ?? previous);
      saveRole(role, true);

      // Best-effort welcome email carrying the Business ID. A mail failure must
      // never block onboarding — the ID is shown on the dashboard regardless.
      try {
        await fetch("/api/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: result.user?.businessId,
            businessType: selected,
          }),
        });
      } catch {
        // Ignore: the dashboard is the source of truth for the Business ID.
      }

      setNotice("Saved. Taking you to your dashboard…");
      setTimeout(finish, 600);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your business type.");
    } finally {
      setBusy(false);
    }
  }

  if (sessionMissing) {
    return (
      <div className="rounded-2xl border border-line bg-surface-alt p-6">
        <h1 className="text-xl font-bold text-navy-950">Your session has expired</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in again and we&apos;ll bring you straight back here to pick your business type.
        </p>
        <Button variant="accent" size="lg" className="mt-6" onClick={() => router.push("/login")}>
          Go to sign in
        </Button>
      </div>
    );
  }

  const selectedType = types.find((type) => type.slug === selected);

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Step 2 of 3</p>
      <h1 className="mt-2 text-2xl font-bold text-navy-950">What kind of business do you run?</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This decides the workspace you land in and which tools you see. You can change it later,
        and it never affects your Business ID or password.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">Business type</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {types.length === 0 && (
            <p className="text-sm text-ink-muted">
              {error ? error : "Loading business types…"}
            </p>
          )}
          {types.map((type) => {
            const active = selected === type.slug;
            return (
              <label
                key={type.id}
                className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition-colors ${
                  active
                    ? "border-navy-950 bg-surface-alt ring-1 ring-navy-950"
                    : "border-line bg-surface hover:border-navy-300"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy-950">{type.name}</span>
                  {active && <Badge tone="success">Selected</Badge>}
                </span>
                {type.description && (
                  <span className="mt-1 text-xs leading-relaxed text-ink-muted">{type.description}</span>
                )}
                <input
                  type="radio"
                  name="businessType"
                  value={type.slug}
                  checked={active}
                  onChange={() => setSelected(type.slug)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      {selectedType && workspaceForBusinessType(selectedType) && (
        <p className="mt-4 text-xs text-ink-muted">
          You&apos;ll open the{" "}
          <strong className="text-navy-950">
            {ROLES[workspaceForBusinessType(selectedType) as "bus-operator" | "organizer"].workspace}
          </strong>{" "}
          with this choice.
        </p>
      )}

      {error && types.length > 0 && (
        <p role="alert" className="mt-4 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
          {notice}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={busy || types.length === 0}
        className="mt-6 w-full"
      >
        {busy ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}