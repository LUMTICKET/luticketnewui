"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { EventListing, EventTicketType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ApiError, getAuthSession } from "@/lib/auth";
import type { ApiBooking } from "@/lib/operations";
import {
  isValidMobileMoneyNumber,
  SANDBOX_WALLETS,
  startTicketCheckout,
  waitForTicketPayment,
  type PaymentMethod,
  type TicketCheckoutStarted,
} from "@/lib/checkout";
import { AccountNudge } from "@/components/checkout/GuestDetailsStep";

type Step = "select" | "pay" | "waiting" | "confirmed" | "failed" | "soldOut" | "timeout";

const inputClass = "w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400";

export function TicketSelector({ event }: { event: EventListing }) {
  const ticketTypes = useMemo(() => event.ticketTypes ?? [], [event.ticketTypes]);
  const pathname = usePathname();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.name, 0])),
  );
  const [step, setStep] = useState<Step>("select");
  const [method, setMethod] = useState<PaymentMethod>("tnm");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState<TicketCheckoutStarted | null>(null);
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [error, setError] = useState("");
  const [sandboxHelp, setSandboxHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const mounted = useRef(true);

  // Session lives in browser storage, so read it after mount to keep server/client markup identical.
  useEffect(() => {
    mounted.current = true;
    setLoggedIn(Boolean(getAuthSession()));
    return () => {
      mounted.current = false;
    };
  }, []);

  const purchasable = event.purchasable !== false;
  const soldOut = event.status === "sold-out" || ticketTypes.every((t) => t.remaining === 0);
  const maxPerOrder = Math.min(10, event.maxPerUser ?? 10);

  const selected = useMemo(
    () => ticketTypes.find((t) => (quantities[t.name] ?? 0) > 0) ?? null,
    [ticketTypes, quantities],
  );
  const quantity = selected ? quantities[selected.name] : 0;
  const total = selected ? selected.price * quantity : 0;

  // The API prices one ticket type per payment, so choosing a tier clears the others.
  function setQty(ticket: EventTicketType, qty: number) {
    const next = Math.max(0, Math.min(qty, ticket.remaining, maxPerOrder));
    setQuantities(Object.fromEntries(ticketTypes.map((t) => [t.name, t.name === ticket.name ? next : 0])));
  }

  function describeError(err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    const hint = err instanceof ApiError ? err.hint?.trim() : "";
    const sandboxRejection = err instanceof ApiError && /test phone number|test wallet/i.test(`${message} ${hint}`);
    if (hint || sandboxRejection) setSandboxHelp(true);
    return hint && !message.includes(hint) ? `${message} ${hint}` : message;
  }

  async function settle(paymentId: number | string) {
    setStep("waiting");
    try {
      const outcome = await waitForTicketPayment(paymentId);
      if (!mounted.current) return;
      if (outcome.status === "succeeded" && outcome.booking) {
        setBooking(outcome.booking);
        setStep("confirmed");
      } else if (outcome.status === "succeeded") {
        setStep("soldOut");
      } else if (outcome.status === "timeout") {
        setStep("timeout");
      } else {
        setStep("failed");
      }
    } catch (err) {
      if (!mounted.current) return;
      setError(describeError(err));
      setStep("timeout");
    }
  }

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!selected || selected.id === undefined) return;
    setError("");
    if (method !== "card" && !isValidMobileMoneyNumber(phone)) {
      setError("Enter a valid TNM or Airtel mobile money number, e.g. 0999 123 456.");
      return;
    }
    setBusy(true);
    try {
      const result = await startTicketCheckout({
        ticketTypeId: selected.id,
        quantity,
        method,
        phone: method === "card" ? undefined : phone.replace(/[\s-]/g, ""),
      });
      setStarted(result);
      if (method === "card" && result.checkoutUrl) window.open(result.checkoutUrl, "_blank", "noopener");
      void settle(result.paymentId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoggedIn(false);
        setStep("select");
      }
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!purchasable) {
    return (
      <div className="rounded-2xl border border-line p-6 text-center">
        <Badge tone="warning">Sample event</Badge>
        <p className="mt-3 text-sm text-ink-muted">
          This is a sample listing, so tickets can&apos;t be bought. Live events can be purchased here.
        </p>
      </div>
    );
  }

  if (step === "confirmed" && booking) {
    return (
      <div className="rounded-2xl border border-line p-8 text-center">
        <Badge tone="success">Payment received — tickets confirmed</Badge>
        <h2 className="mt-4 text-xl font-bold text-navy-950">{event.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{booking.detail ?? `${quantity}× ${selected?.name ?? "ticket"}`}</p>
        <div className="mx-auto mt-6 max-w-xs rounded-2xl border-2 border-dashed border-line px-4 py-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Ticket code</span>
          <p className="mt-2 break-all font-mono text-lg font-bold text-navy-950">{booking.reference}</p>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Show this code at the gate. A booking for {Number(booking.quantity) || quantity} ticket(s) scans valid that many times.
        </p>
        <Link href="/bookings" className="mt-4 inline-block text-sm font-semibold text-navy-950 underline">
          View my bookings
        </Link>
        <AccountNudge loggedIn />
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="rounded-2xl border border-line p-8 text-center" role="status" aria-live="polite">
        <Badge tone="warning">Waiting for payment</Badge>
        <h2 className="mt-4 text-lg font-bold text-navy-950">
          {method === "card" ? "Complete your card payment" : "Approve the payment on your phone"}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {method === "card"
            ? "Finish paying in the secure checkout tab we opened. This page updates by itself."
            : `We sent a PIN prompt to ${phone}. Enter your PIN to pay${
                started?.amountToPay ? ` ${formatPrice(started.amountToPay, event.currency)} (includes charges)` : ""
              }.`}
        </p>
        {method === "card" && started?.checkoutUrl && (
          <a href={started.checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-navy-950 underline">
            Checkout didn&apos;t open? Open it here
          </a>
        )}
        <p className="mt-4 text-xs text-ink-faint">Don&apos;t pay twice — your tickets appear here as soon as payment is confirmed.</p>
      </div>
    );
  }

  if (step === "timeout") {
    return (
      <div className="rounded-2xl border border-line p-8 text-center">
        <Badge tone="warning">Still waiting</Badge>
        <p className="mt-3 text-sm text-ink-muted">
          We haven&apos;t heard back from your mobile money provider yet. If you approved the prompt, your ticket will appear
          shortly. Please don&apos;t pay again.
        </p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          {started && (
            <Button type="button" variant="accent" onClick={() => { setError(""); void settle(started.paymentId); }}>
              Check again
            </Button>
          )}
          <Link href="/bookings" className="inline-flex h-11 items-center justify-center rounded-full border border-navy-950 px-5 text-sm font-semibold text-navy-950">
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  if (step === "failed" || step === "soldOut") {
    const isSoldOut = step === "soldOut";
    return (
      <div className="rounded-2xl border border-line p-8 text-center">
        <Badge tone="error">{isSoldOut ? "Paid, but sold out" : "Payment not completed"}</Badge>
        <p className="mt-3 text-sm text-ink-muted">
          {isSoldOut
            ? "Your payment went through, but the last tickets were taken first. We've flagged it for a refund — contact support with your payment reference."
            : "The payment was declined, cancelled or reversed, and no ticket was issued. You have not been charged for a ticket."}
        </p>
        {isSoldOut && started && <p className="mt-2 font-mono text-xs text-ink-muted">Payment #{started.paymentId}</p>}
        {!isSoldOut && (
          <Button
            type="button"
            variant="accent"
            className="mt-5"
            onClick={() => { setStarted(null); setError(""); setStep("pay"); }}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (soldOut) {
    return (
      <div className="rounded-2xl border border-line p-6 text-center">
        <Badge tone="error">Sold out</Badge>
        <p className="mt-3 text-sm text-ink-muted">All ticket types for this event are currently sold out.</p>
      </div>
    );
  }

  if (step === "pay" && selected) {
    return (
      <form onSubmit={handlePay} className="mx-auto max-w-md rounded-2xl border border-line p-6">
        <button type="button" onClick={() => { setError(""); setStep("select"); }} className="text-sm font-semibold text-navy-950 hover:text-gold-600">
          ← Back
        </button>
        <h2 className="mt-3 text-lg font-bold text-navy-950">Pay for your tickets</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {quantity}× {selected.name} · <strong className="text-navy-950">{formatPrice(total, event.currency)}</strong>
        </p>

        <div className="mt-5">
          <label htmlFor="pay-method" className="text-sm font-medium text-ink">Pay with</label>
          <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={`mt-1.5 h-12 ${inputClass}`}>
            <option value="tnm">TNM Mpamba</option>
            <option value="airtel">Airtel Money</option>
            <option value="card">Bank card</option>
          </select>
        </div>

        {method !== "card" && (
          <div className="mt-4">
            <label htmlFor="pay-phone" className="text-sm font-medium text-ink">Mobile money number</label>
            <input
              id="pay-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0999 123 456"
              className={`mt-1.5 h-12 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-ink-muted">You&apos;ll get a PIN prompt on this number.</p>
          </div>
        )}

        {sandboxHelp && (
          <div className="mt-4 rounded-xl bg-surface-alt p-3 text-xs text-ink-muted">
            <p>Test mode accepts only these wallets (PIN <strong className="text-navy-950">1234</strong>):</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              {SANDBOX_WALLETS.map((w) => (
                <button
                  key={w.phone}
                  type="button"
                  onClick={() => { setMethod(w.method); setPhone(w.phone); setError(""); }}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-left font-semibold text-navy-950"
                >
                  Use {w.provider}
                  <span className="mt-0.5 block font-mono font-normal text-ink-muted">{w.phone}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}

        <Button type="submit" variant="accent" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? "Starting payment…" : `Pay ${formatPrice(total, event.currency)}`}
        </Button>
      </form>
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
            onChange={(qty) => setQty(t, qty)}
          />
        ))}
        <p className="text-xs text-ink-faint">One ticket type per purchase · up to {maxPerOrder} tickets.</p>
      </div>

      <div className="h-fit rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-navy-950">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {!selected ? (
            <p className="text-ink-muted">No tickets selected yet.</p>
          ) : (
            <div className="flex justify-between">
              <dt className="text-ink-muted">{quantity}× {selected.name}</dt>
              <dd className="text-ink">{formatPrice(total, event.currency)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4">
          <span className="font-semibold text-navy-950">Total</span>
          <span className="text-lg font-bold text-navy-950">{formatPrice(total, event.currency)}</span>
        </div>

        {loggedIn ? (
          <Button type="button" variant="accent" size="lg" className="mt-6 w-full" disabled={!selected} onClick={() => { setError(""); setStep("pay"); }}>
            Continue to payment
          </Button>
        ) : (
          <>
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-full bg-gold-500 px-6 text-base font-semibold text-navy-950 hover:bg-gold-400"
            >
              Log in to buy tickets
            </Link>
            <p className="mt-3 text-center text-xs text-ink-faint">
              No account?{" "}
              <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className="font-medium text-navy-950 underline">
                Sign up free
              </Link>
            </p>
          </>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}
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
          {!soldOut && ticket.remaining <= 10 && <Badge tone="warning">{ticket.remaining} left</Badge>}
        </div>
        {ticket.perks.length > 0 && <p className="mt-1 text-sm text-ink-muted">{ticket.perks.join(" · ")}</p>}
        <p className="mt-1 text-sm font-semibold text-navy-950">{formatPrice(ticket.price, currency)}</p>
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
