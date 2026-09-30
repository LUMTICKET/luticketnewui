import Link from "next/link";
import { listCatalogEvents, type CatalogEvent } from "@/lib/operations";
import { trendingEvents } from "@/lib/data";
import { formatEventDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { TicketSelector } from "@/components/events/TicketSelector";
import type { EventListing } from "@/lib/types";

const statusTone = {
  "on-sale": "success",
  "selling-fast": "warning",
  "sold-out": "error",
} as const;

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;

  // Live catalog lookup first; the sample listings fill in when the API has
  // no matching event (or is unreachable) so the page keeps working.
  let live: CatalogEvent | null = null;
  try {
    const catalog = await listCatalogEvents();
    live = catalog.find((e) => String(e.id) === id) ?? null;
  } catch {
    live = null;
  }

  const fallback: EventListing | null =
    trendingEvents.find((e) => String(e.id) === id) ?? null;

  if (!live && !fallback) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-navy-950">Event not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This event may no longer be listed. Try browsing all events.
        </p>
        <Link href="/events" className="mt-4 inline-block text-sm font-semibold text-navy-950">
          ← Back to events
        </Link>
      </div>
    );
  }

  // Normalize both sources into the display shape TicketSelector expects.
  const event: EventListing = live
    ? {
        id: String(live.id),
        title: live.title,
        category: live.category,
        venue: live.venue || live.location || "",
        city: live.city || "",
        countryCode: live.countryCode || "",
        date: live.startsAt,
        fromPrice: live.fromPrice,
        currency: live.currency,
        status: live.status,
        ticketTypes: [],
      }
    : fallback!;

  return (
    <div>
      <div className="bg-navy-950">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/events" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
            ← Back to events
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gold-400">
            {event.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{event.title}</h1>
          <p className="mt-2 text-navy-200">
            {event.venue}
            {event.city ? `, ${event.city}` : ""}
            {event.countryCode ? ` · ${event.countryCode}` : ""} · {formatEventDate(event.date)}
          </p>
          <div className="mt-4">
            <Badge tone={statusTone[event.status]}>{event.status.replace("-", " ")}</Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {event.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
            {event.description}
          </p>
        )}
        {live && (
          <p role="note" className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-sm text-ink-muted">
            Live listing published through the Lumticket platform.
          </p>
        )}
        {!live && (
          <p role="note" className="mt-4 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
            Showing a sample event — live listings appear here as organizers publish them.
          </p>
        )}

        <h2 className="mt-8 text-lg font-bold text-navy-950">Tickets</h2>
        <div className="mt-4">
          {event.ticketTypes && event.ticketTypes.length > 0 ? (
            <TicketSelector event={event} />
          ) : (
            <p className="text-sm text-ink-muted">
              Ticket details for this event haven&apos;t been published yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
