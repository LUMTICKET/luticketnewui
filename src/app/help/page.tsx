"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  category: string;
  question: string;
  answer: React.ReactNode;
  keywords: string[];
}

const categories = [
  { label: "Bookings & tickets", href: "/bookings" },
  { label: "Parcels", href: "/parcels" },
  { label: "Refunds & cancellations", href: "/help/refunds" },
  { label: "Trust & safety", href: "/help/safety" },
];

const faqs: FaqItem[] = [
  {
    category: "Bookings & tickets",
    question: "How do I get my ticket after paying?",
    keywords: ["qr", "ticket", "payment", "confirm", "offline"],
    answer:
      "A secure QR-code ticket is issued to your account the moment payment is confirmed, whether you paid online or at a retail agent. It's also saved for offline access, so you can show it even without signal.",
  },
  {
    category: "Bookings & tickets",
    question: "What happens if I don't finish paying in time?",
    keywords: ["seat hold", "expire", "release", "timeout"],
    answer:
      "Selecting a seat holds it for a limited time (5 minutes by default). If payment isn't confirmed before the hold expires, the seat is automatically released back to availability.",
  },
  {
    category: "Bookings & tickets",
    question: "Can I change or cancel my booking?",
    keywords: ["refund", "cancel", "cancellation", "change booking"],
    answer: (
      <>
        Cancellation and refund terms are set by the operator or organizer
        for each trip or event, and shown before you pay. See{" "}
        <Link href="/help/refunds" className="font-medium text-navy-950 underline">
          Refunds &amp; cancellations
        </Link>{" "}
        for how the process works.
      </>
    ),
  },
  {
    category: "Parcels",
    question: "How do I track my parcel?",
    keywords: ["parcel", "track", "tracking", "delivery", "courier"],
    answer: (
      <>
        Enter your tracking reference on the{" "}
        <Link href="/parcels" className="font-medium text-navy-950 underline">
          parcel tracking page
        </Link>{" "}
        to see its current status and handling history.
      </>
    ),
  },
  {
    category: "Parcels",
    question: "What if my parcel is lost or damaged?",
    keywords: ["lost", "damaged", "insurance", "goods in transit", "refund"],
    answer: (
      <>
        Courier operators carry liability terms and, above a declared value
        threshold, Goods-in-Transit insurance. Contact us with your tracking
        reference and we&apos;ll help you raise it with the courier.
      </>
    ),
  },
  {
    category: "Payments",
    question: "What payment methods are supported?",
    keywords: ["card", "mobile money", "pos", "pay"],
    answer:
      "Card, mobile money, and pay-at-agent through a Lumiticket retail/POS location, depending on what's available in your country.",
  },
  {
    category: "Payments",
    question: "Is my payment information safe?",
    keywords: ["security", "card data", "gateway", "safe", "funds"],
    answer:
      "All payments run through licensed third-party payment gateways. Lumiticket never stores raw card data, and never holds your funds directly.",
  },
  {
    category: "Account & verification",
    question: "How do I become a bus operator, courier, agent, or organizer?",
    keywords: ["operator", "courier", "agent", "organizer", "kyc", "kyb", "business", "onboarding"],
    answer: (
      <>
        Start from{" "}
        <Link href="/business" className="font-medium text-navy-950 underline">
          our business page
        </Link>
        . Every operator, courier, agent, and organizer completes identity
        and business verification (KYC/KYB) before their account goes live.
      </>
    ),
  },
  {
    category: "Account & verification",
    question: "Why do you need my ID documents?",
    keywords: ["id", "document", "kyc", "verification", "identity"],
    answer: (
      <>
        Verification keeps payouts and tickets trustworthy for everyone on
        the platform. See our{" "}
        <Link href="/legal/kyc" className="font-medium text-navy-950 underline">
          Verification &amp; KYC policy
        </Link>{" "}
        for exactly what&apos;s required for each role.
      </>
    ),
  },
  {
    category: "Using the apps",
    question: "Does Lumiticket work without an internet connection?",
    keywords: ["offline", "no signal", "sync", "scanning", "driver app"],
    answer:
      "The Scanning & Validation and Driver apps keep accepting ticket and parcel scans offline, queuing them locally and syncing automatically once connectivity returns. Your most recent QR tickets and parcel status stay viewable offline too.",
  },
];

export default function HelpCentrePage() {
  const [query, setQuery] = useState("");

  const results = faqs.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.question.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.keywords.some((k) => k.includes(q) || q.includes(k))
    );
  });

  return (
    <div>
      <div className="bg-navy-950">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">How can we help?</h1>
          <p className="mt-2 text-navy-200">
            Search common questions, or browse a topic below.
          </p>
          <div className="mx-auto mt-6 max-w-lg">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:border-navy-400"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-navy-300"
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {results.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No help articles match &ldquo;{query}&rdquo;.{" "}
              <Link href="/contact" className="font-semibold text-navy-950">
                Contact us
              </Link>{" "}
              instead.
            </p>
          ) : (
            results.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-line p-5 open:bg-surface-alt"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-950">
                  {faq.question}
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-faint transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {faq.answer}
                </p>
              </details>
            ))
          )}
        </div>

        <p className="mt-10 text-sm text-ink-muted">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link href="/contact" className="font-semibold text-navy-950 hover:text-gold-600">
            Contact us →
          </Link>
        </p>
      </div>
    </div>
  );
}
