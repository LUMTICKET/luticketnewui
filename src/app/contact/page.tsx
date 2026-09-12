"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const topics = [
  "General question",
  "Bookings & tickets",
  "Parcels",
  "Payments & refunds",
  "Business & verification (KYC)",
  "Report a safety concern",
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy-950">Contact us</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Have a question we haven&apos;t answered in the{" "}
        <Link href="/help" className="font-semibold text-navy-950 hover:text-gold-600">
          help centre
        </Link>
        ? Reach us here.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {sent ? (
          <div className="rounded-2xl border border-line p-8 text-center">
            <Badge tone="success">Message sent</Badge>
            <h2 className="mt-4 text-lg font-bold text-navy-950">
              Thanks — we&apos;ll get back to you
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Our team typically replies within one business day.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-semibold text-navy-950 hover:text-gold-600"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-ink">Full name</label>
                <input id="name" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Chikondi Banda" />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
                <input id="email" type="email" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="topic" className="text-sm font-medium text-ink">Topic</label>
              <select id="topic" required defaultValue="" className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400">
                <option value="" disabled>Choose a topic</option>
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reference" className="text-sm font-medium text-ink">Booking or tracking reference (optional)</label>
              <input id="reference" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="e.g. LMT-PCL-20481" />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-ink">Message</label>
              <textarea id="message" required rows={5} className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-navy-400" placeholder="How can we help?" />
            </div>

            <Button type="submit" variant="accent" size="lg" className="sm:w-auto">
              Send message
            </Button>
          </form>
        )}

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line p-5">
            <h2 className="text-sm font-bold text-navy-950">Customer support</h2>
            <p className="mt-1 text-sm text-ink-muted">Bookings, parcels, payments, refunds.</p>
            <p className="mt-2 text-sm font-medium text-navy-950">support@lumiticket.com</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <h2 className="text-sm font-bold text-navy-950">Business &amp; verification</h2>
            <p className="mt-1 text-sm text-ink-muted">Onboarding, KYC/KYB, settlement.</p>
            <p className="mt-2 text-sm font-medium text-navy-950">business@lumiticket.com</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <h2 className="text-sm font-bold text-navy-950">Trust &amp; safety</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Report a concern — see our{" "}
              <Link href="/help/safety" className="font-medium text-navy-950 underline">
                trust &amp; safety page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
