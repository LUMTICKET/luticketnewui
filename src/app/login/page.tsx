import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeNext } from "@/lib/roles";

export const metadata = {
  title: "Sign in — Lumticket",
};

const linkClass = "font-semibold text-navy-950 hover:text-gold-600";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const staffPortal = params.portal === "staff";
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <AuthShell
      heading={staffPortal ? "Staff sign-in" : "Welcome back"}
      intro={
        staffPortal
          ? "Sign in to the Lumina Holdings staff console."
          : "Log in with your Business ID, email or mobile number."
      }
      panelTitle="Run every journey from one dashboard"
      panelText="Sell bus seats, event tickets and parcel deliveries across the SADC region with one business account."
      footer={
        staffPortal ? (
          <p>
            Not staff?{" "}
            <Link href="/login" className={linkClass}>Back to regular sign-in</Link>
          </p>
        ) : (
          <>
            <p>
              New to Lumticket?{" "}
              <Link href={signupHref} className={linkClass}>Create an account</Link>
            </p>
            <p>
              Lumina Holdings staff?{" "}
              <Link href="/login?portal=staff" className={linkClass}>Staff sign-in</Link>
            </p>
          </>
        )
      }
    >
      <AuthForm mode="login" portal={staffPortal ? "staff" : undefined} next={next} />
    </AuthShell>
  );
}
