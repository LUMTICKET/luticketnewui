const points = [
  {
    title: "Secure QR tickets",
    body: "Every ticket is uniquely coded and validated on scan — forgery-resistant, one use only.",
  },
  {
    title: "Works offline",
    body: "Validation and driver apps keep working without signal, syncing automatically once reconnected.",
  },
  {
    title: "Licensed payments",
    body: "Payments run through licensed gateways and mobile money partners — Lumiticket never holds your funds.",
  },
  {
    title: "Built for the region",
    body: "Multiple currencies, languages, and payment methods, adapted to each SADC market.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700"
              >
                <CheckIcon />
              </span>
              <div>
                <h3 className="text-sm font-bold text-navy-950">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
