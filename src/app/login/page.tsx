import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PUBLIC_ROLES, isAccountRole, safeNext } from "@/lib/roles";

export const metadata = {
  title: "Sign in — Lumiticket",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const staffPortal = params.portal === "staff";
  const roleParam = typeof params.role === "string" ? params.role : undefined;
  const initialRole =
    roleParam && isAccountRole(roleParam) && PUBLIC_ROLES.includes(roleParam) ? roleParam : undefined;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const signupHref = initialRole ? `/signup?role=${initialRole}` : "/signup";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">
        {staffPortal ? "Staff sign-in" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {staffPortal
          ? "Sign in to the Lumina Holdings staff console."
          : "Choose how you use Lumiticket — we'll take you straight to your workspace."}
      </p>

      <AuthForm mode="login" initialRole={initialRole} portal={staffPortal ? "staff" : undefined} next={next} />

      {staffPortal ? (
        <p className="mt-6 text-center text-sm text-ink-muted">
          Not staff?{" "}
          <Link href="/login" className="font-semibold text-navy-950 hover:text-gold-600">
            Back to regular sign-in
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-6 text-center text-sm text-ink-muted">
            New to Lumiticket?{" "}
            <Link href={signupHref} className="font-semibold text-navy-950 hover:text-gold-600">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-ink-muted">
            Lumina Holdings staff?{" "}
            <Link href="/login?portal=staff" className="font-semibold text-navy-950 hover:text-gold-600">
              Staff sign-in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
