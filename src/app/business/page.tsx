import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "For business — Lumiticket",
};

const roles = [
  {
    title: "Bus operator",
    href: "/business/bus-operators",
    requirements: [
      "Transport operator license & TPIN",
      "Vehicle registration & roadworthiness",
      "Signed settlement agreement",
    ],
  },
  {
    title: "Courier operator",
    href: "/business/couriers",
    requirements: [
      "National ID or courier operating license",
      "Vehicle/rider registration & operating zones",
      "Goods-in-transit insurance (above threshold)",
    ],
  },
  {
    title: "Event organizer",
    href: "/business/organizers",
    requirements: [
      "National ID or business registration",
      "Venue/council approval per event",
      "Refund & cancellation policy on file",
    ],
  },
  {
    title: "Retail / POS agent",
    href: "/business/agents",
    requirements: [
      "Business or sole-trader registration",
      "ID verification with photo capture",
      "POS device registration & daily limits",
    ],
  },
];

export default function BusinessPage() {
  return (
    <div>
      <section className="bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
            Partner with Lumiticket
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Reach more customers across the SADC region
          </h1>
          <p className="mt-4 max-w-xl text-navy-200">
            Every operator, courier, organizer, and agent completes a
            verification (KYC) step before going live — it keeps payouts and
            tickets trustworthy for everyone on the platform.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role.title} className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-bold text-navy-950">{role.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {role.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {req}
                  </li>
                ))}
              </ul>
              <Link
                href={role.href}
                className="mt-5 inline-flex text-sm font-semibold text-navy-950 hover:text-gold-600"
              >
                View requirements →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-surface-alt p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-950">
              Ready to submit your documents?
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Onboarding takes about 15 minutes; verification typically
              completes within 1–3 business days.
            </p>
          </div>
          <LinkButton href="/signup" variant="accent" size="lg" className="shrink-0">
            Start onboarding
          </LinkButton>
        </div>
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Already verified?</h2>
            <p className="mt-1 text-sm text-ink-muted">Manage roles and invite your business team from the API-backed workspace.</p>
          </div>
          <LinkButton href="/team" variant="outline" size="md" className="shrink-0">
            Open team workspace
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
