import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthDivider, SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

export const metadata = {
  title: "Log in — Lumiticket",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Log in</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Access your bookings, tickets, and parcel tracking.
      </p>

      <div className="mt-8">
        <SocialAuthButtons label="Log in" />
      </div>

      <div className="mt-6">
        <AuthDivider>or with email</AuthDivider>
      </div>

      <form className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email or mobile number
          </label>
          <input
            id="email"
            type="text"
            autoComplete="username"
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="checkbox" className="h-4 w-4 accent-navy-950" />
            Keep me signed in
          </label>
          <Link href="/help" className="font-medium text-navy-950 hover:text-gold-600">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to Lumiticket?{" "}
        <Link href="/signup" className="font-semibold text-navy-950 hover:text-gold-600">
          Create an account
        </Link>
      </p>

      <p className="mt-2 text-center text-sm text-ink-muted">
        Bus operator, courier, organizer, or agent?{" "}
        <Link href="/business" className="font-semibold text-navy-950 hover:text-gold-600">
          Partner login
        </Link>
      </p>
    </div>
  );
}
