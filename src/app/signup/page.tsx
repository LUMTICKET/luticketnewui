import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PUBLIC_ROLES, isAccountRole, safeNext } from "@/lib/roles";

export const metadata = {
  title: "Create an account — Lumiticket",
};

export default async function SignupPage(props: PageProps<"/signup">) {
  const params = await props.searchParams;
  const roleParam = typeof params.role === "string" ? params.role : undefined;
  const initialRole =
    roleParam && isAccountRole(roleParam) && PUBLIC_ROLES.includes(roleParam) ? roleParam : undefined;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const loginHref = initialRole ? `/login?role=${initialRole}` : "/login";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tell us how you&apos;ll use Lumiticket so we can set up the right workspace for you.
      </p>

      <AuthForm mode="signup" initialRole={initialRole} next={next} />

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-navy-950 hover:text-gold-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
