import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeNext } from "@/lib/roles";

export const metadata = {
  title: "Create a business account — Lumticket",
};

export default async function SignupPage(props: PageProps<"/signup">) {
  const params = await props.searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <AuthShell
      heading="Create your account"
      intro="Set up your Lumticket account, then choose the type of business you run."
      panelTitle="Start selling on Lumticket"
      panelText="Bus operators, organizers, couriers and agents all start here. Set up in minutes and pick your business type next."
      footer={
        <p>
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-navy-950 hover:text-gold-600">Log in</Link>
        </p>
      }
    >
      <AuthForm mode="signup" next={next} />
    </AuthShell>
  );
}
