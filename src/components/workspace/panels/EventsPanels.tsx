"use client";

import { getCheckoutConfig } from "@/lib/checkout";
import { PaymentChoice } from "@/components/checkout/PaymentChoice";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ApiError,
  createEventListing,
  deleteEventListing,
  extendEventDate,
  getEvent,
  getPublishingFee,
  listEvents,
  startPublishingPayment,
  republishEvent,
  waitForPayment,
  type EventSummary,
  type PaymentMethod,
  type TicketTierInput,
  type EventTicketTypeRow,
} from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { workspaceHref } from "@/lib/workspace-nav";
import { Card, PageHeader, inputClass } from "../ui";
import { ProfileGate } from "../shared";
import { PosterEditor, PosterUpload } from "../PosterUpload";
import { PayoutAccountCard } from "../PayoutAccountCard";
import { useWorkspace } from "../WorkspaceContext";

type Category = "event" | "bus" | "flight" | "tourism";

const emptyTier: TicketTierInput = { name: "", price: 0, currency: "MWK", capacity: 50, perks: [] };

// Online payments (PayChangu) and customer checkout only support MWK today, so tickets are priced in MWK.
const CURRENCY_OPTIONS = ["MWK"];

function defaultCurrencyFor(_countryCode: string | undefined) {
  return "MWK";
}

// Same rule the API applies to mobile money numbers.
const MOBILE_MONEY = /^(\+?265|0)?[89]\d{8}$/;

function isMobileMoneyNumber(value: string) {
  return MOBILE_MONEY.test(value);
}

/** The PayChangu payment started for the listing being drafted. */
type FeePayment = {
  id: number | string;
  method: PaymentMethod;
  status: "pending" | "succeeded";
  /** Set when the payer finishes on PayChangu's secure page (card, or hosted mobile money). */
  checkoutUrl?: string;
};

export function EventsPanel({
  title,
  description,
  category,
  createSlug,
  createLabel,
  emptyLabel,
}: {
  title: string;
  description: string;
  /** Only list items of this category (bus trips are stored as category "bus"). */
  category?: Category;
  createSlug: string;
  createLabel: string;
  emptyLabel: string;
}) {
  const { role, token } = useWorkspace();

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <LinkButton href={workspaceHref(role, createSlug)} variant="accent" size="sm">
            {createLabel}
          </LinkButton>
        }
      />
      <div className="mt-8">
        <ProfileGate feature={title}>
          {(profile) => <EventList token={token} profileId={profile.id} category={category} emptyLabel={emptyLabel} createHref={workspaceHref(role, createSlug)} />}
        </ProfileGate>
      </div>
    </div>
  );
}

function toLocalDateTime(value: string | Date | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function EventList({
  token,
  profileId,
  category,
  emptyLabel,
  createHref,
}: {
  token: string;
  profileId: number | string;
  category?: Category;
  emptyLabel: string;
  createHref: string;
}) {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [details, setDetails] = useState<Record<string, Awaited<ReturnType<typeof getEvent>>>>({});
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTickets, setEditTickets] = useState<(TicketTierInput & { id?: number | string })[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("tnm");
  const [phone, setPhone] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState<number | string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [publishingFee, setPublishingFee] = useState<{ amount: number; currency: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listEvents(token, profileId)
      .then(async (all) => {
        const filtered = category ? all.filter((e) => e.category === category) : all;
        if (!cancelled) setEvents(filtered);

        // Pull each listing's ticket rows for real sold/remaining counts.
        const loaded: Record<string, Awaited<ReturnType<typeof getEvent>>> = {};
        await Promise.all(
          filtered.map(async (event) => {
            try {
              const detail = await getEvent(token, event.id);
              if (detail) loaded[String(event.id)] = detail;
            } catch {
              // Missing detail just hides the per-ticket stats for that listing.
            }
          }),
        );
        if (!cancelled) setDetails(loaded);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load your listings.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, profileId, category]);

  async function openEditor(item: EventSummary) {
    setEditingId(item.id);
    setActionMessage("");
    setPendingPaymentId(null);
    setCheckoutUrl("");
    setEditTitle(item.title);
    setEditLocation(item.location);
    setEditDescription(String(item.description ?? details[String(item.id)]?.description ?? ""));
    setEditDate(toLocalDateTime(item.startsAt));
    const current = details[String(item.id)]?.tickets ?? [];
    setEditTickets(current.map((t: EventTicketTypeRow) => ({ id: t.id, name: t.name, price: t.price, currency: t.currency, capacity: t.capacity, perks: t.perks ?? [] })));
    try { setPublishingFee(await getPublishingFee()); } catch { setPublishingFee(null); }
  }

  async function removeEvent(item: EventSummary) {
    if (!window.confirm(`Delete "${item.title}"? Events with paid tickets will be cancelled to protect customer and financial records.`)) return;
    setSaving(true); setActionMessage("");
    try {
      const result = await deleteEventListing(token, item.id);
      if (!result) throw new Error("This event could not be found. It may already have been removed; refresh the page to see your latest listings.");
      setActionMessage(result.message ?? (result.deleted ? "Event deleted." : "Event updated."));
      setEvents((prev) => prev?.filter((e) => e.id !== item.id) ?? null);
    } catch (e) { setActionMessage(e instanceof Error ? e.message : "Could not delete this event."); }
    finally { setSaving(false); }
  }

  async function extendDate(item: EventSummary) {
    if (!editDate) { setActionMessage("Choose the new event date first."); return; }
    setSaving(true); setActionMessage("");
    try {
      await extendEventDate(token, item.id, { startsAt: new Date(editDate).toISOString() });
      setEvents((prev) => prev?.map((e) => e.id === item.id ? { ...e, startsAt: new Date(editDate).toISOString() } : e) ?? null);
      setActionMessage("Event date extended successfully. No publishing fee was charged.");
    } catch (e) { setActionMessage(e instanceof Error ? e.message : "Could not extend the date."); }
    finally { setSaving(false); }
  }

  async function payAndRepublish(item: EventSummary) {
    if (!editTitle.trim() || !editLocation.trim() || !editDate) { setActionMessage("Title, location and event date are required."); return; }
    if (method !== "card" && !phone.trim() && !pendingPaymentId) { setActionMessage("Enter the mobile money number for the selected payment method."); return; }
    setSaving(true); setActionMessage("");
    try {
      let paymentId = pendingPaymentId;
      let hostedCheckout = Boolean(checkoutUrl);
      if (!paymentId) {
        const payment = await startPublishingPayment(token, { businessProfileId: profileId, method, phone: method === "card" ? undefined : phone, description: `Republish event: ${editTitle}` });
        if (!payment) throw new Error("PayChangu could not start the payment right now. You have not been charged. Please try again in a moment.");
        paymentId = payment.id;
        setPendingPaymentId(payment.id);
        if (payment.checkoutUrl) {
          hostedCheckout = true;
          setCheckoutUrl(payment.checkoutUrl);
          // Open PayChangu's secure page; if the browser blocks the pop-up the link below the button still works.
          if (typeof window !== "undefined") window.open(payment.checkoutUrl, "_blank", "noopener,noreferrer");
          setActionMessage("Complete the payment on the secure PayChangu page, then come back and select Verify payment & republish.");
          setSaving(false);
          return;
        }
        setActionMessage("Approve the payment prompt on your phone. We will republish the event as soon as PayChangu confirms it.");
      }
      // Mobile money: wait for the PIN approval. Hosted page: the payer has already been there, so only a short check is needed.
      const status = await waitForPayment(token, profileId, paymentId, { timeoutMs: hostedCheckout ? 30000 : 180000, intervalMs: hostedCheckout ? 2000 : 3000 });
      if (status !== "succeeded") {
        if (status === "timeout") { setActionMessage(hostedCheckout ? "PayChangu has not confirmed the payment yet. If you have just paid, wait a few seconds and select Verify payment & republish again. You will not be charged twice." : "Still waiting for PayChangu to confirm the payment. Select Verify payment & republish to check again. You will not be charged twice."); return; }
        setActionMessage(`The payment ${status === "failed" ? "did not go through" : "was reversed"}. Select Pay publishing fee & republish to try again.`);
        setPendingPaymentId(null); setCheckoutUrl("");
        return;
      }
      const updated = await republishEvent(token, item.id, {
        paymentId,
        title: editTitle.trim(),
        location: editLocation.trim(),
        description: editDescription,
        startsAt: new Date(editDate).toISOString(),
        tickets: editTickets.map((t) => ({ ...t, price: Number(t.price), capacity: Number(t.capacity) })),
      });
      // The API only answers "not found" here when the event itself is gone; the fee stays valid for this business.
      if (!updated) throw new Error("This event could not be found any more, so nothing was republished. Your publishing-fee payment is safe: refresh the page and try again.");
      setEvents((prev) => prev?.map((e) => e.id === item.id ? { ...e, title: updated.title, location: updated.location, startsAt: updated.startsAt, status: updated.status } : e) ?? null);
      setDetails((prev) => ({ ...prev, [String(item.id)]: updated }));
      setActionMessage("Publishing fee confirmed by PayChangu. Your event and ticket information are live again.");
      setPendingPaymentId(null); setCheckoutUrl("");
      setEditingId(null);
    } catch (e) { setActionMessage(e instanceof Error ? e.message : "Could not republish this event. Your payment is safe; select Verify payment & republish to try again."); }
    finally { setSaving(false); }
  }

  if (error) return <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>;
  if (!events) return <p className="text-sm text-ink-muted">Loading…</p>;

  if (events.length === 0) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">{emptyLabel}</p>
        <Link href={createHref} className="mt-3 inline-block text-sm font-semibold text-navy-950 hover:text-gold-600">
          Get started →
        </Link>
      </Card>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {events.map((item) => {
        const tickets = details[String(item.id)]?.tickets ?? [];
        const sold = tickets.reduce((sum, t) => sum + Math.max(t.capacity - t.remaining, 0), 0);
        const capacity = tickets.reduce((sum, t) => sum + t.capacity, 0);
        const minPrice = tickets.length > 0 ? Math.min(...tickets.map((t) => t.price)) : null;
        return (
          <li key={item.id} className="rounded-2xl border border-line bg-surface p-5">
            <PosterEditor
              token={token}
              eventId={item.id}
              title={item.title}
              image={item.image}
              onSaved={(image) => setEvents((prev) => prev && prev.map((e) => (e.id === item.id ? { ...e, image } : e)))}
            />
            <div className="mb-3 flex flex-wrap gap-3 text-sm font-semibold">
              <button type="button" onClick={() => void openEditor(item)} className="text-navy-950 underline">Edit / republish</button>
              <button type="button" disabled={saving} onClick={() => void removeEvent(item)} className="text-error underline">Delete</button>
            </div>
            {editingId === item.id && (
              <div className="mb-4 rounded-xl border border-line bg-surface-alt p-4">
                <h3 className="font-semibold text-navy-950">Edit and republish listing</h3>
                <p className="mt-1 text-xs text-ink-muted">Changing listing or ticket information requires a publishing fee. Date-only extensions below are free.</p>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs font-medium text-ink">Event title<input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={`mt-1 ${inputClass} h-11 w-full`} /></label>
                  <label className="text-xs font-medium text-ink">Location<input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className={`mt-1 ${inputClass} h-11 w-full`} /></label>
                  <label className="text-xs font-medium text-ink">Description<textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-medium text-ink">Event date / time<input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={`mt-1 ${inputClass} h-11 w-full`} /></label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={saving} onClick={() => void extendDate(item)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy-950">Extend date only — free</button>
                  </div>
                  <div className="border-t border-line pt-3">
                    <div className="flex items-center justify-between"><span className="text-sm font-semibold">Ticket types</span><button type="button" onClick={() => setEditTickets((prev) => [...prev, { name: "", price: 0, currency: "MWK", capacity: 1, perks: [] }])} className="text-xs font-semibold underline">+ Add ticket</button></div>
                    {editTickets.map((ticket, index) => (
                      <div key={String(ticket.id ?? `new-${index}`)} className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface p-2 sm:grid-cols-4">
                        <input aria-label="Ticket name" value={ticket.name} onChange={(e) => setEditTickets((prev) => prev.map((t, i) => i === index ? { ...t, name: e.target.value } : t))} placeholder="Ticket name" className={inputClass} />
                        <input aria-label="Ticket price" type="number" min={0} value={ticket.price} onChange={(e) => setEditTickets((prev) => prev.map((t, i) => i === index ? { ...t, price: Number(e.target.value) } : t))} className={inputClass} />
                        <input aria-label="Ticket capacity" type="number" min={1} value={ticket.capacity} onChange={(e) => setEditTickets((prev) => prev.map((t, i) => i === index ? { ...t, capacity: Number(e.target.value) } : t))} className={inputClass} />
                        <button type="button" onClick={() => setEditTickets((prev) => prev.filter((_, i) => i !== index))} className="text-xs text-error underline">Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <p className="text-sm font-semibold">Publishing fee {publishingFee ? `· ${formatPrice(publishingFee.amount, publishingFee.currency)}` : "· loading…"}</p>
                    <PaymentChoice idPrefix={`republish-${item.id}`} method={method} onMethodChange={setMethod} phone={phone} onPhoneChange={setPhone} />
                    {checkoutUrl && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold underline">Continue to secure checkout</a>}
                    <button type="button" disabled={saving} onClick={() => void payAndRepublish(item)} className="mt-3 w-full rounded-lg bg-navy-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Verifying / saving…" : pendingPaymentId ? "Verify payment & republish" : "Pay publishing fee & republish"}</button>
                  </div>
                  {actionMessage && <p role="status" className="text-xs text-ink-muted">{actionMessage}</p>}
                  <button type="button" onClick={() => setEditingId(null)} className="text-left text-xs font-semibold underline">Close editor</button>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-navy-950">{item.title}</p>
              <Badge tone="neutral">{item.category}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{item.location}</p>
            <p className="mt-1 text-xs text-ink-faint">{item.startsAt ? new Date(item.startsAt).toLocaleString() : "—"}</p>
            {item.category === "bus" && typeof details[String(item.id)]?.description === "string" && (
              <p className="mt-2 whitespace-pre-line rounded-lg bg-surface-alt p-2.5 text-xs text-ink-muted">
                {details[String(item.id)]!.description as string}
              </p>
            )}
            {tickets.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{sold} sold</span>
                  <span>{sold}/{capacity} ({capacity > 0 ? Math.round((sold / capacity) * 100) : 0}%)</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-alt">
                  <div className="h-2 rounded-full bg-navy-950" style={{ width: `${capacity > 0 ? Math.round((sold / capacity) * 100) : 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  {tickets.length} ticket type{tickets.length === 1 ? "" : "s"}
                  {minPrice !== null && ` · from ${formatPrice(minPrice, tickets[0].currency)}`}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface RouteStop {
  name: string;
  eta: string;
}

/**
 * The API has no columns yet for arrival terminal / stops / ETA (see
 * DATABASE-REQUIREMENTS.md — bus routes are event listings with one
 * "location" + "startsAt"). Until it does, this composes them into the
 * `description` field it already stores and returns, so the transparency
 * the feedback asks for ("departure, stops, arrival should appear clearly")
 * at least reaches the operator's own listing. It's a stand-in, not a fix —
 * the public search/detail pages only show this once the catalog endpoint
 * passes `description` through.
 */
function formatRouteDetails(input: { arrivalTerminal: string; direct: boolean; stops: RouteStop[]; estimatedArrival: string; notes: string }) {
  const lines: string[] = [];
  if (input.arrivalTerminal) lines.push(`Arrival terminal: ${input.arrivalTerminal}`);
  lines.push(input.direct ? "Direct — no stops" : "With stops");
  if (!input.direct && input.stops.length > 0) {
    lines.push("Stops:");
    for (const stop of input.stops) {
      if (!stop.name) continue;
      lines.push(`- ${stop.name}${stop.eta ? ` (est. ${stop.eta})` : ""}`);
    }
  }
  if (input.estimatedArrival) lines.push(`Estimated arrival: ${new Date(input.estimatedArrival).toLocaleString()}`);
  return [lines.join("\n"), input.notes.trim()].filter(Boolean).join("\n\n");
}

export function CreateEventPanel({
  title,
  description,
  categories,
  submitLabel,
  listSlug,
}: {
  title: string;
  description: string;
  categories: Category[];
  submitLabel: string;
  listSlug: string;
}) {
  return (
    <div className="max-w-3xl">
      <PageHeader title={title} description={description} />
      <div className="mt-8">
        <ProfileGate feature={title}>
          {(profile) => (
            <CreateEventForm profile={profile} categories={categories} submitLabel={submitLabel} listSlug={listSlug} />
          )}
        </ProfileGate>
      </div>
    </div>
  );
}

function CreateEventForm({
  profile,
  categories,
  submitLabel,
  listSlug,
}: {
  profile: import("@/lib/auth").BusinessProfile;
  categories: Category[];
  submitLabel: string;
  listSlug: string;
}) {
  const { role, token } = useWorkspace();
  const isBus = categories.length === 1 && categories[0] === "bus";
  const defaultCurrency = defaultCurrencyFor(profile.country);

  const [tiers, setTiers] = useState<TicketTierInput[]>([{ ...emptyTier, currency: defaultCurrency }]);
  const [method, setMethod] = useState<PaymentMethod>("tnm");
  const [payPhone, setPayPhone] = useState(() => {
    const saved = (profile.phone ?? "").replace(/\s/g, "");
    return isMobileMoneyNumber(saved) ? saved : "";
  });
  const [fee, setFee] = useState<{ amount: number; currency: string } | null>(null);
  const [payNote, setPayNote] = useState("");
  // Kept (and persisted) until the listing is published, so a slow prompt, a refresh
  // or a failed publish reuses or re-checks the same payment instead of charging twice.
  const [feePayment, setFeePayment] = useState<FeePayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Poster / flyer image (resized data URL) shown to customers on the website.
  const [poster, setPoster] = useState<string | null>(null);
  // Hosted checkout (PayChangu): the payer chooses mobile money or card on the provider's page,
  // so the form skips the method/number fields and uses the existing hosted ("card") flow.
  const [hosted, setHosted] = useState(false);
  // Ticket money is paid straight to the organiser after each sale, so non-bus listings need a payout account first.
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const needsPayout = !isBus && payoutReady === false;

  // Bus-only route details (see formatRouteDetails above).
  const [arrivalTerminal, setArrivalTerminal] = useState("");
  const [direct, setDirect] = useState(true);
  const [stops, setStops] = useState<RouteStop[]>([{ name: "", eta: "" }]);
  const [estimatedArrival, setEstimatedArrival] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublishingFee()
      .then((f) => !cancelled && setFee(f))
      .catch(() => !cancelled && setError("Couldn't load the publishing fee. Refresh the page to try again."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getCheckoutConfig().then((c) => {
      if (cancelled || !c.hosted) return;
      setHosted(true);
      setMethod("card");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const paymentKey = `lumticket.publishing-fee.${profile.id}`;

  // Restore a payment started before a refresh so the business can finish
  // publishing (or re-check its status) without paying the fee a second time.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(paymentKey);
      const stored = raw ? (JSON.parse(raw) as FeePayment) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored?.id) setFeePayment(stored);
    } catch {
      // Unreadable storage: the business can simply start a new payment.
    }
  }, [paymentKey]);

  function rememberPayment(next: FeePayment | null) {
    setFeePayment(next);
    try {
      if (next) window.localStorage.setItem(paymentKey, JSON.stringify(next));
      else window.localStorage.removeItem(paymentKey);
    } catch {
      // Storage is best-effort; the in-memory payment still prevents a double charge this session.
    }
  }

  // Switching provider while a payment is still pending abandons that payment and starts clean with the
  // new provider. A succeeded fee is never discarded: it stays paid and is reused to publish.
  function changeMethod(next: PaymentMethod) {
    if (next === method) return;
    setMethod(next);
    setError("");
    if (feePayment && feePayment.status !== "succeeded") {
      rememberPayment(null);
      setPayNote("Provider changed. Press the button to pay with " + (next === "tnm" ? "TNM Mpamba" : next === "airtel" ? "Airtel Money" : "your bank card") + ".");
    } else {
      setPayNote("");
    }
  }

  function updateTier(index: number, patch: Partial<TicketTierInput>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function updateStop(index: number, patch: Partial<RouteStop>) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError("");
        setSuccess("");
        setPayNote("");
        const data = new FormData(form);

        // Validate everything BEFORE charging anyone.
        if (needsPayout) return setError("Add your payout account first, so ticket money can be sent to you.");
        const startsAt = new Date(String(data.get("startsAt") || ""));
        if (Number.isNaN(startsAt.getTime())) return setError("Choose a valid start date and time.");
        if (startsAt.getTime() <= Date.now()) return setError("The start time must be in the future, otherwise customers won't see the listing.");
        const cleanTiers = tiers
          .filter((t) => t.name.trim())
          .map((t) => ({ ...t, name: t.name.trim(), price: Number(t.price), capacity: Number(t.capacity), currency: "MWK" }));
        if (!cleanTiers.length) return setError(isBus ? "Add at least one seat class with a name." : "Add at least one ticket type with a name.");
        if (cleanTiers.some((t) => !Number.isInteger(t.price) || t.price <= 0)) {
          return setError("Prices must be whole MWK amounts above 0. Free tickets can't be sold online yet.");
        }
        if (cleanTiers.some((t) => !Number.isInteger(t.capacity) || t.capacity <= 0)) {
          return setError("Capacity must be a whole number above 0.");
        }
        if (!fee) return setError("The publishing fee hasn't loaded yet. Refresh the page and try again.");
        const phone = payPhone.replace(/\s/g, "");
        if (!feePayment && method !== "card" && !isMobileMoneyNumber(phone)) {
          return setError("Enter a valid mobile money number for the payment prompt.");
        }

        const checkoutTab =
          method === "card" && feePayment?.status !== "succeeded" && (!feePayment || feePayment.checkoutUrl)
            ? window.open("about:blank", "_blank")
            : null;
        if (checkoutTab) checkoutTab.opener = null;
        setBusy(true);
        // Reuse the payment already started for this listing instead of creating another.
        let payment = feePayment;
        let checkoutTabOpened = false;

        try {
          if (!payment) {
            setPayNote(method === "card" ? "Opening the secure payment page…" : "Check your phone and approve the payment prompt…");
            const started = await startPublishingPayment(token, {
              businessProfileId: profile.id,
              amount: fee.amount,
              method,
              ...(method !== "card" ? { phone } : {}),
              description: "Listing publishing fee",
            });
            if (!started?.id) throw new Error("The payment could not be started.");
            payment = {
              id: started.id,
              method,
              status: started.status === "succeeded" ? "succeeded" : "pending",
              checkoutUrl: started.checkoutUrl,
            };
            rememberPayment(payment);
          }

          if (checkoutTab && !checkoutTab.closed) {
            if (payment.checkoutUrl && payment.status !== "succeeded") {
              checkoutTab.location.replace(payment.checkoutUrl);
              checkoutTabOpened = true;
            } else {
              checkoutTab.close();
            }
          }

          if (payment.status !== "succeeded") {
            setPayNote(
              payment.checkoutUrl
                ? checkoutTabOpened
                  ? "Complete payment in the secure checkout tab. We'll confirm it here automatically."
                  : "Use the secure checkout link below. We'll confirm payment here automatically."
                : payment.method === "card"
                  ? "Waiting for the secure checkout link…"
                : "Waiting for you to approve the prompt on your phone…",
            );
            const outcome = await waitForPayment(token, profile.id, payment.id, {
              // The secure payment page can take a few minutes to finish, so give the payer room.
              timeoutMs: payment.checkoutUrl || payment.method === "card" ? 300_000 : 180_000,
            });
            if (outcome === "succeeded") {
              payment = { ...payment, status: "succeeded" };
              rememberPayment(payment);
            } else if (outcome === "failed" || outcome === "reversed") {
              rememberPayment(null);
              payment = null;
              throw new Error(
                outcome === "reversed"
                  ? "This payment was reversed. Nothing was published — start a new payment to try again."
                  : "The payment was declined or cancelled. Nothing was published and you have not been charged.",
              );
            } else {
              throw new Error(
                `We haven't received confirmation of payment #${payment.id} yet. If you approved it, press the button again to check that same payment — you will not be charged twice.`,
              );
            }
          }
          setPayNote("Payment received. Publishing your listing…");

          const userNotes = String(data.get("description") || "");
          const finalDescription = isBus
            ? formatRouteDetails({ arrivalTerminal, direct, stops, estimatedArrival, notes: userNotes })
            : userNotes;

          const created = await createEventListing(token, {
            businessProfileId: profile.id,
            paymentId: payment.id,
            title: String(data.get("title") || ""),
            subtitle: String(data.get("subtitle") || ""),
            category: (categories.length === 1 ? categories[0] : data.get("category")) as Category,
            organizer: profile.businessName,
            description: finalDescription,
            location: String(data.get("location") || ""),
            startsAt: startsAt.toISOString(),
            maxPerUser: Number(data.get("maxPerUser") || 5),
            ...(poster ? { image: poster } : {}),
            tags: String(data.get("tags") || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            tickets: cleanTiers,
          });

          setSuccess(`"${created?.title ?? "Listing"}" was published successfully.`);
          rememberPayment(null);
          setPayNote("");
          setTiers([{ ...emptyTier, currency: defaultCurrency }]);
          setArrivalTerminal("");
          setDirect(true);
          setStops([{ name: "", eta: "" }]);
          setEstimatedArrival("");
          setPoster(null);
          form.reset();
        } catch (submitError) {
          const base = submitError instanceof Error ? submitError.message : "Could not publish this listing.";
          if (checkoutTab && !checkoutTab.closed && !checkoutTabOpened) checkoutTab.close();
          setPayNote("");
          // A 409 from POST /api/events means this fee payment can't back another listing
          // (for example it was already used elsewhere), so let the business pay again.
          const paymentSpent = submitError instanceof ApiError && submitError.status === 409 && Boolean(payment);
          if (paymentSpent) rememberPayment(null);
          // If the fee already went through, say so: pressing publish again will not charge twice.
          const message = paymentSpent
            ? `${base} Start a new publishing-fee payment to publish this listing.`
            : payment
              ? `${base} Your publishing-fee payment (#${payment.id}) is saved, so pressing the button again will not charge you twice.`
              : base;
          setError(message);
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-6"
    >
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="text-sm font-medium text-ink">Title</label>
            <input id="title" name="title" required className={`mt-1.5 ${inputClass} h-12`} placeholder={isBus ? "Lilongwe → Blantyre, 06:00" : "Lilongwe Food Fest"} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="subtitle" className="text-sm font-medium text-ink">Subtitle</label>
            <input id="subtitle" name="subtitle" className={`mt-1.5 ${inputClass} h-12`} placeholder="Short tagline" />
          </div>
          {categories.length > 1 && (
            <div>
              <label htmlFor="category" className="text-sm font-medium text-ink">Category</label>
              <select id="category" name="category" defaultValue={categories[0]} className={`mt-1.5 ${inputClass} h-12`}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-ink">{isBus ? "Operator" : "Organizer"}</span>
            <p className="mt-1.5 flex h-12 items-center rounded-xl border border-line bg-surface-alt px-3.5 text-sm text-ink-muted" title="Set automatically from your verified business — it can't be edited here.">
              {profile.businessName}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="location" className="text-sm font-medium text-ink">{isBus ? "Departure terminal" : "Location"}</label>
            <input id="location" name="location" required className={`mt-1.5 ${inputClass} h-12`} placeholder={isBus ? "Lilongwe Bus Terminal" : "Lilongwe Civic Centre"} />
          </div>
          {isBus && (
            <div className="sm:col-span-2">
              <label htmlFor="arrivalTerminal" className="text-sm font-medium text-ink">Arrival terminal</label>
              <input
                id="arrivalTerminal"
                required
                value={arrivalTerminal}
                onChange={(e) => setArrivalTerminal(e.target.value)}
                className={`mt-1.5 ${inputClass} h-12`}
                placeholder="Blantyre Bus Terminal"
              />
            </div>
          )}
          <div>
            <label htmlFor="startsAt" className="text-sm font-medium text-ink">{isBus ? "Departs at" : "Starts at"}</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required className={`mt-1.5 ${inputClass} h-12`} />
          </div>
          {isBus && (
            <div>
              <label htmlFor="estimatedArrival" className="text-sm font-medium text-ink">Estimated arrival</label>
              <input
                id="estimatedArrival"
                type="datetime-local"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className={`mt-1.5 ${inputClass} h-12`}
              />
            </div>
          )}
          {isBus && (
            <div className="sm:col-span-2">
              <span className="text-sm font-medium text-ink">Route</span>
              <div role="radiogroup" aria-label="Route" className="mt-1.5 flex gap-2.5">
                {([true, false] as const).map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    role="radio"
                    aria-checked={direct === value}
                    onClick={() => setDirect(value)}
                    className={`h-10 rounded-full border px-4 text-sm font-medium ${
                      direct === value ? "border-navy-950 bg-navy-950 text-white" : "border-line text-ink hover:border-navy-300"
                    }`}
                  >
                    {value ? "Direct" : "With stops"}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isBus && !direct && (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Stops</span>
                <button type="button" onClick={() => setStops((prev) => [...prev, { name: "", eta: "" }])} className="text-sm font-semibold text-navy-950 hover:text-gold-600">
                  + Add stop
                </button>
              </div>
              <div className="mt-1.5 flex flex-col gap-2">
                {stops.map((stop, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input aria-label="Stop name" value={stop.name} onChange={(e) => updateStop(index, { name: e.target.value })} placeholder="Dedza" className={inputClass} />
                    <input aria-label="Estimated time at stop" value={stop.eta} onChange={(e) => updateStop(index, { eta: e.target.value })} placeholder="08:45" className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="maxPerUser" className="text-sm font-medium text-ink">Max tickets per customer</label>
            <input id="maxPerUser" name="maxPerUser" type="number" min={1} defaultValue={5} className={`mt-1.5 ${inputClass} h-12`} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tags" className="text-sm font-medium text-ink">Tags (comma separated)</label>
            <input id="tags" name="tags" className={`mt-1.5 ${inputClass} h-12`} placeholder="express, overnight" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="text-sm font-medium text-ink">{isBus ? "Notes (optional)" : "Description"}</label>
            <textarea id="description" name="description" rows={3} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-navy-400" placeholder={isBus ? "Anything else passengers should know" : "What should people expect?"} />
          </div>
        </div>
      </Card>

      <Card>
        <PosterUpload value={poster} onChange={setPoster} disabled={busy} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-950">{isBus ? "Seat classes" : "Ticket types"}</h2>
          <button type="button" onClick={() => setTiers((prev) => [...prev, { ...emptyTier, currency: defaultCurrency }])} className="text-sm font-semibold text-navy-950 hover:text-gold-600">
            + Add
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 sm:grid-cols-5">
              <input aria-label="Name" value={tier.name} onChange={(e) => updateTier(index, { name: e.target.value })} placeholder={isBus ? "Standard seat" : "General admission"} className={`col-span-2 sm:col-span-1 ${inputClass}`} />
              <input aria-label="Price" type="number" min={0} value={tier.price} onChange={(e) => updateTier(index, { price: Number(e.target.value) })} className={inputClass} />
              <select aria-label="Currency" value={tier.currency} onChange={(e) => updateTier(index, { currency: e.target.value })} className={inputClass}>
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              <input aria-label="Capacity" type="number" min={1} value={tier.capacity} onChange={(e) => updateTier(index, { capacity: Number(e.target.value) })} className={inputClass} />
              <input aria-label="Perks" value={tier.perks.join(", ")} onChange={(e) => updateTier(index, { perks: e.target.value.split(",").map((p) => p.trim()).filter(Boolean) })} placeholder="Perks" className={inputClass} />
            </div>
          ))}
        </div>
      </Card>

      {!isBus && (
        <div className="-mt-8">
          <PayoutAccountCard onChange={setPayoutReady} />
        </div>
      )}

      <Card>
        <h2 className="text-sm font-bold text-navy-950">Publishing fee</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {fee ? `Publishing a listing costs ${formatPrice(fee.amount, fee.currency)}, paid securely online.` : "Loading the publishing fee…"}
        </p>
        {feePayment && (
          <div className={`mt-2 text-sm ${feePayment.status === "succeeded" ? "text-success" : "text-navy-950"}`}>
            <p className="font-semibold">
              {feePayment.status === "succeeded" ? "Fee paid" : "Payment pending"} · payment #{feePayment.id}
            </p>
            {feePayment.status !== "succeeded" && (
              <div className="mt-2">
                <p className="text-xs text-ink-muted">
                  Want to pay another way? Pick a different provider below and we&apos;ll start a fresh payment. This does not cancel a prompt already sent to your phone, so decline it there.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    rememberPayment(null);
                    setPayNote("");
                    setError("");
                  }}
                  className="mt-1 font-semibold text-ink-muted underline hover:text-navy-950"
                >
                  Clear this pending payment
                </button>
              </div>
            )}
          </div>
        )}
        <div className="mt-4">
          <PaymentChoice
            idPrefix="fee"
            method={method}
            onMethodChange={changeMethod}
            phone={payPhone}
            onPhoneChange={setPayPhone}
            hosted={hosted}
            disabled={busy || feePayment?.status === "succeeded"}
          />
        </div>
      </Card>

      {payNote && <p role="status" className="rounded-lg bg-surface-alt px-3 py-2 text-sm text-ink">{payNote}</p>}
      {feePayment?.checkoutUrl && feePayment.status !== "succeeded" && (
        <a href={feePayment.checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-navy-950 underline">
          Continue to secure checkout
        </a>
      )}
      {error && <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}
      {success && (
        <p role="status" className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
          {success}{" "}
          <Link href={workspaceHref(role, listSlug)} className="font-semibold underline">
            View listings
          </Link>
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" disabled={busy || needsPayout} className="w-full sm:w-auto">
        {busy
          ? "Processing…"
          : feePayment
            ? feePayment.status === "succeeded"
              ? "Publish listing"
              : "Check payment & publish"
            : submitLabel}
      </Button>
    </form>
  );
}
