import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/roles";

export const metadata = {
  title: "Create an account — Lumticket",
};

export default async function SignupPage(props: PageProps<"/signup">) {
  const params = await props.searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        One account for everything Lumticket. You&apos;ll pick the venture you want to run right
        after this.
      </p>

      <AuthForm mode="signup" next={next} />

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-navy-950 hover:text-gold-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
