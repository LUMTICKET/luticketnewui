import Link from "next/link";

export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm font-semibold text-navy-950 hover:text-gold-600">
        ← Back to Lumiticket
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-navy-950">{title}</h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated {updated}</p>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-navy-950">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}
