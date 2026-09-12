"use client";

import { type FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { countries } from "@/lib/data";
import { authRequest, decodeJwtPayload, googleAuth, saveAuthSession, type AuthSession } from "@/lib/auth";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleGoogleIdToken = useCallback(async (idToken: string) => {
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
      saveAuthSession(session);
      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const formData = new FormData(event.currentTarget);
      const session = await authRequest<AuthSession>(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        email: formData.get("email"),
        password: formData.get("password"),
        ...(isSignup && {
          name: formData.get("name"),
          country: formData.get("country"),
        }),
      });

      saveAuthSession(session, isSignup || remember);
      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-8">
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
            <input id="name" name="name" type="text" required autoComplete="name" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Chikondi Banda" />
          </div>
        )}

        {isSignup && (
          <div>
            <label htmlFor="country" className="text-sm font-medium text-ink">Country</label>
            <select id="country" name="country" required className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400" defaultValue={countries[0].code}>
              {countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">Email or mobile number</label>
          <input id="email" name="email" type="text" required autoComplete="username" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="you@example.com" />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder={isSignup ? "At least 8 characters" : "••••••••"} />
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

        {error && <p id="auth-error" role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </Button>
      </form>
    </>
  );
}
