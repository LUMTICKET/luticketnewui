import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export interface BusinessRoleContent {
  eyebrow: string;
  title: string;
  intro: string;
  benefits: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  requirements: string[];
  payout: string;
  faqs: { question: string; answer: string }[];
}

export function BusinessRolePage({ content }: { content: BusinessRoleContent }) {
  const { eyebrow, title, intro, benefits, steps, requirements, payout, faqs } =
    content;

  return (
    <div>
      <section className="bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/business"
            className="text-xs font-semibold uppercase tracking-wide text-navy-300 hover:text-gold-400"
          >
            ← Partner with us
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gold-400">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-navy-200">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/signup" variant="accent" size="lg">
              Start onboarding
            </LinkButton>
            <Link
              href="#requirements"
              className="inline-flex h-13 items-center justify-center rounded-full border border-navy-700 px-6 text-base font-semibold text-white hover:border-gold-500"
            >
              View requirements
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
          Why partner with Lumiticket
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title}>
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-gold-700"
              >
                <CheckIcon />
              </span>
              <h3 className="mt-3 text-base font-bold text-navy-950">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title}>
                <span className="text-sm font-bold text-gold-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-bold text-navy-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements + payout */}
      <section
        id="requirements"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-line p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy-950">
              What you&apos;ll need to verify
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Every partner completes identity and business verification
              (KYC) before going live — it keeps payouts and tickets
              trustworthy for everyone on the platform.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-navy-950">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                  />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-surface-alt p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy-950">Getting paid</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {payout}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Onboarding takes about 15 minutes; verification typically
              completes within 1–3 business days.
            </p>
            <LinkButton
              href="/signup"
              variant="accent"
              size="md"
              className="mt-6"
            >
              Start onboarding
            </LinkButton>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-base font-bold text-navy-950">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-navy-950 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Ready to submit your documents?
            </h2>
            <p className="mt-1 text-sm text-navy-300">
              Have questions first? Our{" "}
              <Link href="/help" className="font-semibold text-gold-400 hover:text-gold-300">
                help centre
              </Link>{" "}
              covers onboarding, payouts, and verification.
            </p>
          </div>
          <LinkButton href="/signup" variant="accent" size="lg" className="shrink-0">
            Start onboarding
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
