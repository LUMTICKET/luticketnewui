import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

function titleFromSlug(slug: string[]) {
  const last = slug[slug.length - 1] ?? "";
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function CatchAllPage(props: PageProps<"/[...slug]">) {
  const { slug } = await props.params;
  const title = titleFromSlug(slug);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-4 py-20 sm:px-6">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
        /{slug.join("/")}
      </span>
      <h1 className="mt-2 text-3xl font-bold text-navy-950">{title}</h1>
      <p className="mt-3 text-ink-muted">
        This page is part of the Lumiticket template and hasn&apos;t been
        built out yet — a good next stop when wiring up this route.
      </p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/" variant="primary" size="md">
          Back to home
        </LinkButton>
        <Link
          href="/help"
          className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-navy-950 hover:border-navy-400"
        >
          Visit help centre
        </Link>
      </div>
    </div>
  );
}
