import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { countries } from "@/lib/data";

export const metadata = {
  title: "About Lumina Holdings — Lumiticket",
  description:
    "Lumiticket is built by Lumina Holdings — a modular, API-first platform for bus ticketing, parcel logistics, and event ticketing across the SADC region.",
};

const modules = [
  {
    title: "Bus ticketing",
    body: "Search and compare operators, hold a seat while you pay, and board with a secure QR ticket that works even offline.",
  },
  {
    title: "Parcel logistics",
    body: "Register a parcel with sender and recipient details, track it through every handling stage, and confirm delivery digitally.",
  },
  {
    title: "Event ticketing",
    body: "Organizers create events and ticket types; entry staff validate tickets at the gate, online or off, with duplicates always flagged.",
  },
];

const principles = [
  {
    title: "Verified operators, by default",
    body: "Every bus operator, courier, retail agent, and event organizer completes identity and business verification before going live.",
  },
  {
    title: "Licensed payments, no held funds",
    body: "Payments run through licensed gateways and mobile money partners. Lumiticket never holds customer funds directly.",
  },
  {
    title: "Built to work offline",
    body: "Validation and driver apps keep accepting scans without a connection, syncing and reconciling automatically once reconnected.",
  },
  {
    title: "Accountable by design",
    body: "Every staff account is individually attributable, and every validation, payment, and settlement action is logged for audit.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-navy-950">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
            Lumina Holdings Ltd
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            One platform for bus travel, parcels, and event tickets across
            the SADC region
          </h1>
          <p className="mt-4 max-w-xl text-navy-200">
            Lumiticket is a modular, API-first platform: each service —
            buses, parcels, events — operates independently while staying
            fully connected, so new operators, agents, and countries can be
            added without rebuilding the core.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-navy-950">What we do</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {modules.map((m) => (
            <div key={m.title} className="rounded-2xl border border-line p-5">
              <h3 className="font-bold text-navy-950">{m.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-alt">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-navy-950">How we work</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                />
                <div>
                  <h3 className="font-semibold text-navy-950">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-navy-950">Where we operate</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Live in Malawi, Zambia, and Zimbabwe today, with more SADC markets
          on the way.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {countries.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink"
            >
              <span aria-hidden>{c.flag}</span>
              {c.name}
              {!c.live && <span className="text-ink-faint">· coming soon</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="text-lg font-bold text-navy-950">
              Booking a trip, or running one?
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Search routes and events as a customer, or bring your business
              onto the platform.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <LinkButton href="/" variant="outline" size="md">
              Start searching
            </LinkButton>
            <LinkButton href="/business" variant="accent" size="md">
              For business
            </LinkButton>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-5xl px-4 pb-14 text-xs text-ink-faint sm:px-6 lg:px-8">
        Have a question we haven&apos;t answered?{" "}
        <Link href="/contact" className="font-medium text-navy-950 underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
