"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { EventListing, EventTicketType } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function TicketSelector({ event }: { event: EventListing }) {
  const ticketTypes = useMemo(() => event.ticketTypes ?? [], [event.ticketTypes]);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.name, 0])),
  );
  const [confirmed, setConfirmed] = useState(false);

  const soldOut = event.status === "sold-out" || ticketTypes.every((t) => t.remaining === 0);

  function setQty(name: string, qty: number, max: number) {
    setQuantities((prev) => ({ ...prev, [name]: Math.max(0, Math.min(qty, max, 10)) }));
  }

  const selection = useMemo(
    () => ticketTypes.filter((t) => (quantities[t.name] ?? 0) > 0),
    [ticketTypes, quantities],
  );
  const total = selection.reduce((sum, t) => sum + t.price * quantities[t.name], 0);
  const totalQty = selection.reduce((sum, t) => sum + quantities[t.name], 0);

  const reference = `LMT-EVT-${Math.abs(
    Array.from(event.id + totalQty).reduce((a, c) => a + c.charCodeAt(0), 11),
  )}`;

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-line p-8 text-center">
        <Badge tone="success">Tickets confirmed</Badge>
        <h2 className="mt-4 text-xl font-bold text-navy-950">{event.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {selection.map((t) => `${quantities[t.name]}× ${t.name}`).join(", ")}
        </p>

        <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            QR ticket
          </span>
        </div>

        <p className="mt-4 text-sm text-ink-muted">Reference: {reference}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Saved to your account and available offline at the gate.
        </p>
      </div>
    );
  }

  if (soldOut) {
    return (
      <div className="rounded-2xl border border-line p-6 text-center">
        <Badge tone="error">Sold out</Badge>
        <p className="mt-3 text-sm text-ink-muted">
          All ticket types for this event are currently sold out.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        {ticketTypes.map((t) => (
          <TicketRow
            key={t.name}
            ticket={t}
            currency={event.currency}
            quantity={quantities[t.name] ?? 0}
            onChange={(qty) => setQty(t.name, qty, t.remaining)}
          />
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-navy-950">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {selection.length === 0 ? (
            <p className="text-ink-muted">No tickets selected yet.</p>
          ) : (
            selection.map((t) => (
              <div key={t.name} className="flex justify-between">
                <dt className="text-ink-muted">{quantities[t.name]}× {t.name}</dt>
                <dd className="text-ink">{formatPrice(t.price * quantities[t.name], event.currency)}</dd>
              </div>
            ))
          )}
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4">
          <span className="font-semibold text-navy-950">Total</span>
          <span className="text-lg font-bold text-navy-950">
            {formatPrice(total, event.currency)}
          </span>
        </div>

        <Button
          type="button"
          variant="accent"
          size="lg"
          className="mt-6 w-full"
          disabled={totalQty === 0}
          onClick={() => setConfirmed(true)}
        >
          Confirm &amp; pay
        </Button>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  currency,
  quantity,
  onChange,
}: {
  ticket: EventTicketType;
  currency: string;
  quantity: number;
  onChange: (qty: number) => void;
}) {
  const soldOut = ticket.remaining === 0;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line p-5 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy-950">{ticket.name}</p>
          {soldOut && <Badge tone="error">Sold out</Badge>}
          {!soldOut && ticket.remaining <= 10 && (
            <Badge tone="warning">{ticket.remaining} left</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{ticket.perks.join(" · ")}</p>
        <p className="mt-1 text-sm font-semibold text-navy-950">
          {formatPrice(ticket.price, currency)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={soldOut || quantity === 0}
          onClick={() => onChange(quantity - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg font-semibold text-navy-950 disabled:opacity-40"
          aria-label={`Fewer ${ticket.name} tickets`}
        >
          −
        </button>
        <span className="w-6 text-center font-semibold text-navy-950">{quantity}</span>
        <button
          type="button"
          disabled={soldOut || quantity >= ticket.remaining}
          onClick={() => onChange(quantity + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg font-semibold text-navy-950 disabled:opacity-40"
          aria-label={`More ${ticket.name} tickets`}
        >
          +
        </button>
      </div>
    </div>
  );
}
