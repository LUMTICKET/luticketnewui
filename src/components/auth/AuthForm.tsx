"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { countries } from "@/lib/data";
import {
  authRequest,
  clearAuthSession,
  decodeJwtPayload,
  getCurrentUser,
  googleAuth,
  saveAuthSession,
  saveAuthUser,
  type AuthSession,
  type AuthUser,
  type NextStep,
  type SessionPayload,
} from "@/lib/auth";
import {
  PUBLIC_ROLES,
  ROLES,
  getLastRole,
  resolveRole,
  roleLanding,
  safeNext,
  saveRole,
  saveSignupDraft,
  staffAccess,
  type AccountRole,
} from "@/lib/roles";
import { fetchBusinessTypes, workspaceForBusinessType, type BusinessType } from "@/lib/business-types";
import { signIn, onboardingDestination, type TwoFactorChallenge } from "@/lib/auth-flow";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { RoleIcon, RoleSelector } from "@/components/auth/RoleSelector";

type AuthMode = "login" | "signup";

const inputClasses =
  "mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400";

export function AuthForm({
  mode,
  initialRole,
  portal,
  next,
}: {
  mode: AuthMode;
  /** Role pre-selected from `?role=`; when absent the last-used role is restored. */
  initialRole?: AccountRole;
  portal?: "staff";
  next?: string | null;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const isStaffPortal = portal === "staff" && !isSignup;
  const [role, setRole] = useState<AccountRole>(isStaffPortal ? "staff" : (initialRole ?? "customer"));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);
  // Individual vs. company, asked up front for business accounts (only a
  // company can invite staff — see TeamPanel). Carried to the KYB form via
  // the signup draft, the same way businessName already is.
  const [accountType, setAccountType] = useState<"individual" | "company">("company");

  // Business types come from the API database (GET /api/business-types). The
  // selection is sent as `businessType` on signup and Google first sign-in.
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [businessType, setBusinessType] = useState<string | null>(null);
  // Set when the password check passes but the API wants the emailed 6-digit
  // code first. 2FA is on by default, so this is the normal login path.
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

  useEffect(() => {
    if (initialRole || isStaffPortal || isSignup) return;
    const last = getLastRole();
    // Returning users see the workspace they used last; read after mount because it lives in localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) setRole(last);
  }, [initialRole, isStaffPortal, isSignup]);

  const finish = useCallback(
    async (session: AuthSession, keep: boolean, chosen: AccountRole, nextStep?: NextStep) => {
      saveAuthSession(session, keep);

      let user: AuthUser | null = null;
      try {
        user = await getCurrentUser(session.token);
      } catch {
        user = null;
      }

      if (chosen === "staff" && staffAccess(user) === "denied") {
        clearAuthSession();
        throw new Error("This account isn't provisioned for staff access. Ask an administrator to enable it.");
      }

      // Route by the business type recorded on the account (user.businessType);
      // the form choice is only a fallback for accounts without one.
      const finalRole = resolveRole(chosen, user);
      if (user) saveAuthUser(user, keep);
      saveRole(finalRole, keep);

      // `nextStep` from the API is authoritative for business accounts: one
      // with no business yet belongs in the business details form, not in a
      // workspace it can't use. The API returns `register-business` for every
      // new account including plain customers, who have no profile screen to
      // go to — so only business roles are redirected.
      const onboarding = ROLES[finalRole].business
        ? onboardingDestination(nextStep, `${ROLES[finalRole].landing}/profile`)
        : null;
      router.push(safeNext(next) ?? onboarding ?? roleLanding(finalRole));
      router.refresh();
    },
    [next, router],
  );

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setError("");
      setBusy(true);

      try {
        const profile = decodeJwtPayload(idToken);
        if (!profile.email) throw new Error("No email found in Google account.");

        // The business type is chosen on its own page after sign-in, so it is
        // never sent here — Google sign-in only establishes the account.
        const session = await googleAuth(
          idToken,
          profile.email,
          profile.name || profile.given_name || "",
          profile.picture || "",
        );
        await finish(session, true, role);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Google sign-in failed.");
      } finally {
        setBusy(false);
      }
    },
    [finish, role],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const formData = new FormData(event.currentTarget);

      const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (isSignup) {
        const session = await authRequest<SessionPayload>("/api/auth/signup", {
          email: identifier,
          password,
          name: formData.get("name"),
          country: formData.get("country"),
          // Optional for the API (business registration is its own step), but
          // storing it here drives which workspace the account opens.
          businessType: businessType,
        });

        if (ROLES[role].business) {
          saveSignupDraft({
            role,
            businessName: String(formData.get("businessName") || "").trim(),
            accountType,
          });
        }
        await finish(session, true, role, session.nextStep);
        return;
      }

      // Login: one identifier (Business ID, email or phone) plus the password.
      // 2FA is on by default, so this frequently stops at the emailed code
      // instead of returning a session.
      const result = await signIn(identifier, password);
      if (result.status === "needs2FA") {
        setChallenge({
          challengeToken: result.challengeToken,
          maskedDestination: result.maskedDestination,
          expiresIn: result.expiresIn,
        });
        return;
      }

      await finish(result, remember, role, result.nextStep);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  // On login the form's role choice is only a navigation hint; the workspace is
  // resolved from the account's stored businessType after sign-in (see finish()).
  const config = ROLES[role];

  // The password was accepted but the API wants the emailed code first, so the
  // whole form is replaced by the challenge until it is verified or cancelled.
  if (challenge) {
    return (
      <TwoFactorChallengeForm
        key={challenge.challengeToken}
        challengeToken={challenge.challengeToken}
        maskedDestination={challenge.maskedDestination}
        expiresIn={challenge.expiresIn}
        onCancel={() => {
          setChallenge(null);
          setError("");
        }}
        onVerified={(session) => finish(session, remember, role, session.nextStep)}
      />
    );
  }

  // The password was accepted but the API wants the emailed code first, so the
  // whole form is replaced by the challenge until it is verified or cancelled.
  if (challenge) {
    return (
      <TwoFactorChallengeForm
        key={challenge.challengeToken}
        challengeToken={challenge.challengeToken}
        maskedDestination={challenge.maskedDestination}
        expiresIn={challenge.expiresIn}
        onCancel={() => {
          setChallenge(null);
          setError("");
        }}
        onVerified={(session) => finish(session, remember, role, session.nextStep)}
      />
    );
  }

  return (
    <>
      {isStaffPortal ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-surface-alt p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white">
            <RoleIcon role="staff" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy-950">Lumina staff console</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-muted">
              Internal access for system administration and customer support. Staff accounts are
              provisioned by an administrator.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <RoleSelector
            value={role}
            onChange={setRole}
            roles={PUBLIC_ROLES}
            label={isSignup ? "I want to use Lumticket as a…" : "Sign in as…"}
          />
          <p className="mt-2.5 text-xs text-ink-muted">
            {isSignup
              ? config.business
                ? "You'll verify your business (KYC/KYB) after creating your account, before going live."
                : "Your account is free — you can also buy tickets as a guest without one."
              : `You'll land in: ${config.workspace}.`}
          </p>

        </div>
      )}

      <div className="mt-6">
        <SocialAuthButtons
          label={isSignup ? "Sign up" : "Log in"}
          onGoogle={handleGoogleIdToken}
          onGoogleError={setError}
        />
      </div>

      <div className="mt-6">
        <AuthDivider>or with email</AuthDivider>
      </div>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={handleSubmit}
        aria-describedby={error ? "auth-error" : undefined}
      >
        {isSignup && (
          <div>
            <label htmlFor="name" className="text-sm font-medium text-ink">Full name</label>
            <input id="name" name="name" type="text" required autoComplete="name" className={inputClasses} placeholder="Chikondi Banda" />
          </div>
        )}

        {isSignup && config.business && (
          <div>
            <label htmlFor="businessName" className="text-sm font-medium text-ink">
              Business or trading name
            </label>
            <input id="businessName" name="businessName" type="text" required autoComplete="organization" className={inputClasses} placeholder="Nyasa Express Ltd" />
          </div>
        )}

        {isSignup && config.business && (
          <div>
            <span className="text-sm font-medium text-ink">What type of account are you creating?</span>
            <div role="radiogroup" aria-label="Account type" className="mt-1.5 grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: "company" as const, label: "Company", hint: "Can invite and manage staff" },
                  { value: "individual" as const, label: "Individual", hint: "Sole trader, just you" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={accountType === option.value}
                  onClick={() => setAccountType(option.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    accountType === option.value
                      ? "border-navy-950 bg-navy-50 ring-1 ring-navy-950"
                      : "border-line bg-surface hover:border-navy-300"
                  }`}
                >
                  <span className="block text-sm font-semibold text-navy-950">{option.label}</span>
                  <span className="block text-xs leading-snug text-ink-muted">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSignup && (
          <div>
            <label htmlFor="country" className="text-sm font-medium text-ink">Country</label>
            <select id="country" name="country" required className={`${inputClasses} bg-surface`} defaultValue={countries[0].code}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="identifier" className="text-sm font-medium text-ink">
            {isSignup ? "Email address" : "Business ID, email or mobile number"}
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            className={inputClasses}
            placeholder={isSignup ? "you@example.com" : "LMT-8F3K2QZ4 or you@example.com"}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} className={inputClasses} placeholder={isSignup ? "At least 8 characters" : "••••••••"} />
        </div>

        {!isSignup && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-muted">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-navy-950" />
              Keep me signed in
            </label>
            <Link href="/help" className="font-medium text-navy-950 hover:text-gold-600">Forgot password?</Link>
          </div>
        )}

        {isSignup && (
          <label className="flex items-start gap-2 text-sm text-ink-muted">
            <input name="terms" type="checkbox" required className="mt-0.5 h-4 w-4 accent-navy-950" />
            I agree to the <Link href="/legal/terms" className="font-medium text-navy-950">Terms of service</Link> and <Link href="/legal/privacy" className="font-medium text-navy-950">Privacy policy</Link>
          </label>
        )}

        {error && <p id="auth-error" role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}

        <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "Please wait..." : isSignup ? `Create ${config.label.toLowerCase()} account` : `Sign in to ${config.workspace.toLowerCase()}`}
        </Button>
      </form>
    </>
  );
}
