import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

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

      <AuthForm mode="login" />

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
