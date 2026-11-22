"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { BusinessTypeSelector } from "@/components/auth/RoleSelector";
import { fetchBusinessTypes, type BusinessType } from "@/lib/business-types";
import {
  ApiError,
  clearAuthSession,
  getAuthSession,
  getAuthUser,
  getCurrentUser,
  saveAuthUser,
  updateBusinessType,
  type AuthUser,
} from "@/lib/auth";
import { getSignupDraft, resolveRole, roleLanding, saveRole } from "@/lib/roles";

/**
 * Venture selection — the step between authenticating and the dashboard.
 * Reached after signup (the API returns nextStep "register-business") and after
 * a Google sign-in for an account without a stored business type. The chosen
 * type is stored on the account (PATCH /api/auth/signup, bearer-protected) and
 * from then on decides which workspace the account routes into.
 */
export function BusinessTypeOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready">("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [typesError, setTypesError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const session = getAuthSession();
    if (!session) {
      router.replace("/login?next=/onboarding/business-type");
      return;
    }

    (async () => {
      // The cached user is the fallback; /api/auth/me is the source of truth.
      let me = getAuthUser();
      try {
        me = (await getCurrentUser(session.token)) ?? me;
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          clearAuthSession();
          if (!cancelled) router.replace("/login?next=/onboarding/business-type");
          return;
        }
        // A transient /me failure keeps the cached user — the PATCH below
        // re-syncs the account of record anyway.
      }
      if (cancelled) return;

      // An account that already picked a venture goes straight to its workspace.
      const existing = resolveRole(me);
      if (existing) {
        router.replace(roleLanding(existing));
        return;
      }

      setUser(me);
      setDraftName(getSignupDraft()?.businessName ?? null);
      setSelected(me?.businessType?.slug ?? null);

      try {
        const loaded = await fetchBusinessTypes();
        if (!cancelled) setTypes(loaded);
      } catch (typesRequestError) {
        if (!cancelled) {
          setTypesError(
            typesRequestError instanceof Error
              ? typesRequestError.message
              : "Could not load business types.",
          );
        }
      }
      if (!cancelled) setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleContinue() {
    const session = getAuthSession();
    if (!session || !selected) return;

    setError("");
    setBusy(true);
    try {
      const { user: updated } = await updateBusinessType(session.token, selected);
      if (!updated) throw new Error("Could not save your selection. Please try again.");

      // Mirror the session's own storage lifetime for the saved user/role
      // (same pattern apiRequest uses to keep sessions consistent).
      const remember =
        typeof window !== "undefined" && window.localStorage.getItem("lumticket.auth") !== null;
      saveAuthUser(updated, remember);
      const workspace = resolveRole(updated);
      if (workspace) saveRole(workspace, remember);

      // Types that don't map to a workspace still continue to the personal
      // account area rather than bouncing back to this screen.
      router.push(workspace ? roleLanding(workspace) : "/account");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save your selection. Please try again.",
      );
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <LogoMark size={48} className="animate-pulse" />
        <p className="text-sm text-ink-muted">Preparing your workspace…</p>
      </div>
    );
  }

  const ventureHint = draftName ?? user?.businessName ?? null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Last step</p>
      <h1 className="mt-2 text-3xl font-bold text-navy-950">What venture are you running?</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Pick the business type to operate{ventureHint ? ` as ${ventureHint}` : ""} — this sets up
        your workspace. You can complete the business profile and verification afterwards.
      </p>

      <div className="mt-8">
        {typesError ? (
          <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
            {typesError}
          </p>
        ) : types.length === 0 ? (
          <p className="text-sm text-ink-muted">Loading options…</p>
        ) : (
          <BusinessTypeSelector
            types={types}
            value={selected}
            onChange={setSelected}
            label="Business type"
          />
        )}

        {error && (
          <p id="venture-error" role="alert" className="mt-4 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          disabled={!selected || busy || types.length === 0}
          onClick={handleContinue}
        >
          {busy ? "Setting up your workspace…" : "Continue to dashboard"}
        </Button>

        <p className="mt-4 text-center text-xs text-ink-faint">
          Signed in as {user?.email ?? user?.businessId ?? "your account"} ·{" "}
          <Link href="/" className="font-medium text-navy-950 hover:text-gold-600">
            Lumticket home
          </Link>
        </p>
      </div>
    </div>
  );
}
