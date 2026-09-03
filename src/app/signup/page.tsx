import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { countries } from "@/lib/data";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

export const metadata = {
  title: "Sign up — Lumiticket",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Book bus tickets, buy event tickets, and send parcels in minutes.
      </p>

      <div className="mt-8">
        <SocialAuthButtons label="Sign up" />
      </div>

      <div className="mt-6">
        <AuthDivider>or with email</AuthDivider>
      </div>

      <form className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="Chikondi Banda"
          />
        </div>

        <div>
          <label htmlFor="country" className="text-sm font-medium text-ink">
            Country
          </label>
          <select
            id="country"
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400"
            defaultValue={countries[0].code}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="signup-email" className="text-sm font-medium text-ink">
            Email or mobile number
          </label>
          <input
            id="signup-email"
            type="text"
            autoComplete="username"
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="At least 8 characters"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-950" />
          I agree to the{" "}
          <Link href="/legal/terms" className="font-medium text-navy-950">
            Terms of service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="font-medium text-navy-950">
            Privacy policy
          </Link>
        </label>

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy-950 hover:text-gold-600">
          Log in
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-surface-alt p-4 text-sm text-ink-muted">
        Signing up as a bus operator, courier, event organizer, or retail
        agent instead? That path includes identity and business verification
        (KYC).{" "}
        <Link href="/business" className="font-semibold text-navy-950">
          Start business onboarding →
        </Link>
      </div>
    </div>
  );
}
