import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

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

      <AuthForm mode="signup" />

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
