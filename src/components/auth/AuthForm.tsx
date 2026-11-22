"use client";

import { type FormEvent, useCallback, useState } from "react";
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
  resolveRole,
  roleLanding,
  saveRole,
  saveSignupDraft,
  staffAccess,
} from "@/lib/roles";
import { signIn, type TwoFactorChallenge } from "@/lib/auth-flow";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

type AuthMode = "login" | "signup";

const inputClasses =
  "mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400";

/**
 * Where a freshly authenticated account goes. The account of record decides:
 * a stored business type routes to its workspace; without one the account is
 * sent to the venture-selection screen (it continues to the dashboard from
 * there). A `next` query parameter wins when the caller asked for a specific
 * destination.
 */
function landingFor(
  user: AuthUser | null,
  nextStep: NextStep | undefined,
  next: string | null,
): string {
  if (next) return next;
  if (nextStep === "register-business" || nextStep === "complete-profile") {
    return "/onboarding/business-type";
  }
  const workspace = resolveRole(user);
  return workspace ? roleLanding(workspace) : "/onboarding/business-type";
}

export function AuthForm({
  mode,
  portal,
  next,
}: {
  mode: AuthMode;
  portal?: "staff";
  next?: string | null;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const isStaffPortal = portal === "staff" && !isSignup;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);
  // Individual vs. company, asked up front for business accounts (only a
  // company can invite staff — see TeamPanel). Carried to the KYB form via
  // the signup draft, the same way businessName already is.
  const [accountType, setAccountType] = useState<"individual" | "company">("company");
  const [businessName, setBusinessName] = useState("");
  // Set when the password check passes but the API wants the emailed 6-digit
  // code first. 2FA is on by default, so this is the normal login path.
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

  const finish = useCallback(
    async (session: AuthSession, keep: boolean, nextStep?: NextStep) => {
      saveAuthSession(session, keep);

      let user: AuthUser | null = null;
      try {
        user = await getCurrentUser(session.token);
      } catch {
        user = null;
      }

      if (isStaffPortal && staffAccess(user) === "denied") {
        clearAuthSession();
        throw new Error("This account isn't provisioned for staff access. Ask an administrator to enable it.");
      }

      if (user) saveAuthUser(user, keep);
      const workspace = resolveRole(user);
      if (workspace) saveRole(workspace, keep);

      router.push(landingFor(user, nextStep, next ?? null));
      router.refresh();
    },
    [isStaffPortal, next, router],
  );

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setError("");
      setBusy(true);

      try {
        const profile = decodeJwtPayload(idToken);
        if (!profile.email) throw new Error("No email found in Google account.");

        const session = await googleAuth(
          idToken,
          profile.email,
          profile.name || profile.given_name || "",
          profile.picture || "",
        );
        await finish(session, true, session.nextStep);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Google sign-in failed.");
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const formData = new FormData(event.currentTarget);
      const identifier = String(formData.get("identifier") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (isSignup) {
        const session = await authRequest<SessionPayload>("/api/auth/signup", {
          email: identifier,
          password,
          name: formData.get("name"),
          country: formData.get("country"),
        });

        saveSignupDraft({
          role: "customer",
          businessName: businessName.trim() || undefined,
          accountType,
        });
        await finish(session, true, session.nextStep);
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

      await finish(result, remember, result.nextStep);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
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
        onVerified={(session) => finish(session, remember, session.nextStep)}
      />
    );
  }

  return (
    <>
      {isStaffPortal && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-surface-alt p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z" />
              <path d="M9 12l2.2 2.2L15.5 10" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-navy-950">Lumina staff console</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-muted">
              Internal access for system administration and customer support. Staff accounts are
              provisioned by an administrator.
            </p>
          </div>
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

        {isSignup && (
          <div>
            <label htmlFor="businessName" className="text-sm font-medium text-ink">
              Business or trading name{" "}
              <span className="font-normal text-ink-faint">(optional — pick later)</span>
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              className={inputClasses}
              placeholder="Nyasa Express Ltd"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </div>
        )}

        {isSignup && (
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
          {busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>
    </>
  );
}
