import { howItWorks } from "@/lib/data";

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
        How Lumiticket works
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((item) => (
          <div key={item.step}>
            <span className="text-sm font-bold text-gold-600">
              {item.step}
            </span>
            <h3 className="mt-2 text-lg font-bold text-navy-950">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
