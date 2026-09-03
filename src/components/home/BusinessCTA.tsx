import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

const audiences = [
  {
    title: "Bus operators",
    body: "List routes, manage your fleet, and get paid out automatically.",
    href: "/business/bus-operators",
  },
  {
    title: "Courier operators",
    body: "Register parcels, assign drivers, and track deliveries end to end.",
    href: "/business/couriers",
  },
  {
    title: "Event organizers",
    body: "Create events, set ticket types, and validate entry at the gate.",
    href: "/business/organizers",
  },
  {
    title: "Retail & POS agents",
    body: "Sell tickets and register parcels on Lumiticket's behalf, in person.",
    href: "/business/agents",
  },
];

export function BusinessCTA() {
  return (
    <section className="bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Grow your business on Lumiticket
            </h2>
            <p className="mt-3 text-navy-200">
              Join operators, couriers, organizers, and agents across the
              region. Onboarding includes identity and business verification
              (KYC) to keep the platform trustworthy for everyone.
            </p>
          </div>
          <LinkButton href="/business" variant="accent" size="lg" className="shrink-0">
            Start onboarding
          </LinkButton>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="rounded-2xl border border-navy-700 p-5 transition-colors hover:border-gold-500"
            >
              <h3 className="text-base font-bold text-white">{a.title}</h3>
              <p className="mt-2 text-sm text-navy-300">{a.body}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-gold-400">
                Apply now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
