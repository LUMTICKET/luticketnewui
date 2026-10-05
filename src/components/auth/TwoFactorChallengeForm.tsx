"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { resendTwoFactor, twoFactorErrorMessage, verifyTwoFactor } from "@/lib/auth-flow";
import type { SessionPayload } from "@/lib/auth";

/**
 * Second-factor step shown after a successful password check.
 *
 * The API never returns a session from `POST /api/auth/login` while 2FA is on
 * (the default), so this screen is mandatory rather than optional: without it
 * the app would store an undefined token and land the user in a workspace that
 * 401s on every call.
 */
export function TwoFactorChallengeForm({
  challengeToken,
  maskedDestination,
  expiresIn,
  onVerified,
  onCancel,
}: {
  challengeToken: string;
  maskedDestination: string;
  expiresIn: number;
  onVerified: (session: SessionPayload) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresIn);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown so the person knows when the code goes stale before they type it.
  // The starting value comes from props on mount; a resend resets it directly.
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      onVerified(await verifyTwoFactor(challengeToken, digits));
    } catch (verifyError) {
      setError(twoFactorErrorMessage(verifyError));
      setCode("");
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError("");
    setResending(true);
    try {
      await resendTwoFactor(challengeToken);
      setResent(true);
      setSecondsLeft(expiresIn);
      setTimeout(() => setResent(false), 6000);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not send a new code. Try again in a moment.",
      );
    } finally {
      setResending(false);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-line bg-surface-alt p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
          Two-factor check
        </p>
        <h2 className="mt-2 text-xl font-bold text-navy-950">Enter your 6-digit code</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          We emailed a one-time code to{" "}
          <span className="font-semibold text-navy-950">{maskedDestination}</span>. Enter it below
          to finish signing in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="two-factor-code" className="text-sm font-medium text-ink">
            Verification code
          </label>
          <input
            id="two-factor-code"
            ref={inputRef}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            aria-describedby={error ? "two-factor-error" : "two-factor-hint"}
            aria-invalid={Boolean(error)}
            className="mt-1.5 h-14 w-full rounded-xl border border-line bg-surface px-4 text-center text-2xl font-bold tracking-[0.5em] text-navy-950 focus:border-navy-400"
          />
          <p id="two-factor-hint" className="mt-2 text-xs text-ink-muted">
            {secondsLeft > 0 ? (
              <>
                This code expires in{" "}
                <span className="font-semibold text-navy-950">
                  {minutes}:{seconds}
                </span>
                .
              </>
            ) : (
              "This code has expired — send a new one to continue."
            )}
          </p>
        </div>

        {error && (
          <p
            id="two-factor-error"
            role="alert"
            className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error"
          >
            {error}
          </p>
        )}

        <Button type="submit" variant="accent" size="lg" disabled={busy || code.length !== 6}>
          {busy ? "Verifying…" : "Verify and sign in"}
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || busy}
            className="font-semibold text-navy-950 underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Send a new code"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-ink-muted underline-offset-4 hover:underline disabled:opacity-50"
          >
            Use a different account
          </button>
        </div>

        {resent && (
          <p role="status" className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
            A fresh code is on its way to {maskedDestination}.
          </p>
        )}
      </form>
    </div>
  );
}