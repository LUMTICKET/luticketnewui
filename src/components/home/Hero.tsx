import { SearchWidget } from "./SearchWidget";

export function Hero() {
  return (
    <section className="bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-navy-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-400">
            Bus travel · Parcels · Events — across SADC
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            One booking, wherever you&apos;re headed.
          </h1>
          <p className="mt-4 max-w-xl text-base text-navy-200 sm:text-lg">
            Compare bus operators, buy tickets to the region&apos;s biggest
            events, and send parcels door to door — all with a secure QR
            ticket and a receipt you can trust.
          </p>
        </div>

        <div className="mt-10">
          <SearchWidget />
        </div>
      </div>
    </section>
  );
}
