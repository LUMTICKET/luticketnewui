"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ApiError,
  createEventListing,
  getEvent,
  getPublishingFee,
  listEvents,
  startPublishingPayment,
  waitForPayment,
  type EventSummary,
  type PaymentMethod,
  type TicketTierInput,
} from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { workspaceHref } from "@/lib/workspace-nav";
import { Card, PageHeader, inputClass } from "../ui";
import { ProfileGate } from "../shared";
import { useWorkspace } from "../WorkspaceContext";

type Category = "event" | "bus" | "flight" | "tourism";

const emptyTier: TicketTierInput = { name: "", price: 0, currency: "MWK", capacity: 50, perks: [] };

// Online payments (OneKhusa) and customer checkout only support MWK today, so tickets are priced in MWK.
const CURRENCY_OPTIONS = ["MWK"];

function defaultCurrencyFor(_countryCode: string | undefined) {
  return "MWK";
}

// Same rule the API applies to mobile money numbers.
const MOBILE_MONEY = /^(\+?265|0)?[89]\d{8}$/;

/**
 * OneKhusa's sandbox accepts only these two predefined payer wallets, whatever
 * number is sent. They are 12 digits and fail the Malawian rule above, so the
 * client accepts them explicitly — otherwise the form would block sandbox testing.
 */
const SANDBOX_WALLETS = [
  { provider: "TNM Mpamba", method: "tnm" as PaymentMethod, phone: "231100000101", pin: "1234" },
  { provider: "Airtel Money", method: "airtel" as PaymentMethod, phone: "221100000101", pin: "1234" },
] as const;

function isMobileMoneyNumber(value: string) {
  return MOBILE_MONEY.test(value) || SANDBOX_WALLETS.some((wallet) => wallet.phone === value);
}

/**
 * While OneKhusa points at its sandbox, initiation fails for any wallet that is not one of
 * the two test numbers above: "<phone> is not a correct test phone number". The API does not
 * always attach a `hint` to that response, so match the detail as well.
 */
function isSandboxWalletRejection(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 400) return false;
  return /test phone number|test wallet/i.test(`${error.message} ${error.hint ?? ""}`);
}

/** The OneKhusa payment started for the listing being drafted. */
type FeePayment = {
  id: number | string;
  method: PaymentMethod;
  status: "pending" | "succeeded";
  /** Card payments only: OneKhusa hosted checkout page. */
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
  // Revealed for OneKhusa sandbox wallets, or when the API returns its sandbox hint.
  const [sandboxHelp, setSandboxHelp] = useState(false);

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
        if (SANDBOX_WALLETS.some((wallet) => wallet.phone === phone)) setSandboxHelp(true);

        setBusy(true);
        // Reuse the payment already started for this listing instead of creating another.
        let payment = feePayment;

        try {
          if (!payment) {
            setPayNote(method === "card" ? "Opening secure card checkout…" : "Check your phone and approve the payment prompt…");
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
            if (payment.method === "card" && payment.checkoutUrl && payment.status !== "succeeded") {
              // A popup opened after an await can be blocked, so the card link is also rendered below.
              window.open(payment.checkoutUrl, "_blank", "noopener");
              setPayNote("Complete the card payment in the new tab. We'll confirm it here automatically.");
            }
          }

          if (payment.status !== "succeeded") {
            setPayNote(
              payment.method === "card"
                ? "Waiting for the card payment to be confirmed…"
                : "Waiting for you to approve the prompt on your phone…",
            );
            const outcome = await waitForPayment(token, profile.id, payment.id, {
              // Hosted card checkout is valid for ~10 minutes, so give the payer room.
              timeoutMs: payment.method === "card" ? 300_000 : 180_000,
            });
            if (outcome === "succeeded") {
              payment = { ...payment, status: "succeeded" };
              rememberPayment(payment);
            } else if (outcome === "failed" || outcome === "reversed") {
              rememberPayment(null);
              payment = null;
              throw new Error(
                outcome === "reversed"
                  ? "OneKhusa reversed this payment. Nothing was published — start a new payment to try again."
                  : "The payment was declined or cancelled. Nothing was published and you have not been charged.",
              );
            } else {
              throw new Error(
                `OneKhusa hasn't confirmed payment #${payment.id} yet. If you approved it, press the button again to check that same payment — you will not be charged twice.`,
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
          form.reset();
        } catch (submitError) {
          const base = submitError instanceof Error ? submitError.message : "Could not publish this listing.";
          setPayNote("");
          // A 409 from POST /api/events means this fee payment can't back another listing
          // (for example it was already used elsewhere), so let the business pay again.
          const paymentSpent = submitError instanceof ApiError && submitError.status === 409 && Boolean(payment);
          if (paymentSpent) rememberPayment(null);
          // The API only sends `hint` while it points at the sandbox; either signal shows the test wallets.
          const hint = submitError instanceof ApiError ? submitError.hint?.trim() : "";
          const sandboxRejection = isSandboxWalletRejection(submitError);
          if (hint || sandboxRejection) setSandboxHelp(true);
          // If the fee already went through, say so: pressing publish again will not charge twice.
          const message = sandboxRejection
            ? `OneKhusa is in sandbox mode, which only accepts its two test wallets, so nothing was charged. Pick one below (PIN ${SANDBOX_WALLETS[0].pin}) and press the button again.`
            : paymentSpent
              ? `${base} Start a new publishing-fee payment to publish this listing.`
              : payment
                ? `${base} Your publishing-fee payment (#${payment.id}) is saved, so pressing the button again will not charge you twice.`
                : base;
          setError(hint && !message.includes(hint) ? `${message} ${hint}` : message);
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

      <Card>
        <h2 className="text-sm font-bold text-navy-950">Publishing fee</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {fee ? `Publishing a listing costs ${formatPrice(fee.amount, fee.currency)}, paid securely through OneKhusa.` : "Loading the publishing fee…"}
        </p>
        {feePayment && (
          <p className={`mt-2 text-sm font-semibold ${feePayment.status === "succeeded" ? "text-success" : "text-navy-950"}`}>
            {feePayment.status === "succeeded" ? "Fee paid" : "Payment pending"} · payment #{feePayment.id}
            {feePayment.status !== "succeeded" && (
              <>
                {" — "}
                <button
                  type="button"
                  onClick={() => {
                    rememberPayment(null);
                    setPayNote("");
                    setError("");
                  }}
                  className="font-semibold text-ink-muted underline hover:text-navy-950"
                >
                  start over with another number
                </button>
              </>
            )}
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="method" className="text-sm font-medium text-ink">Pay with</label>
            <select id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} disabled={Boolean(feePayment)} className={`mt-1.5 ${inputClass} h-12`}>
              <option value="tnm">TNM Mpamba</option>
              <option value="airtel">Airtel Money</option>
              <option value="card">Bank card</option>
            </select>
          </div>
          {method !== "card" && (
            <div>
              <label htmlFor="payPhone" className="text-sm font-medium text-ink">Mobile money number</label>
              <input id="payPhone" type="tel" inputMode="tel" autoComplete="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} disabled={Boolean(feePayment)} placeholder="0999 000 000" className={`mt-1.5 ${inputClass} h-12`} />
              <p className="mt-1 text-xs text-ink-muted">You&apos;ll get a PIN prompt on this number.</p>
            </div>
          )}
        </div>
      </Card>

      {sandboxHelp && (
        <Card>
          <h2 className="text-sm font-bold text-navy-950">OneKhusa sandbox wallets</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The sandbox ignores every other wallet number. Pick a wallet below, press the pay button again, then approve
            the prompt with PIN <strong className="text-navy-950">1234</strong>. Choose the result — success, timeout,
            failed auth or cancelled — under{" "}
            <span className="font-medium text-navy-950">Test Your Integration → Simulate Push Payment</span> in the
            OneKhusa portal. Only a signed <code>pushpayment.success</code> webhook publishes the listing.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {SANDBOX_WALLETS.map((wallet) => (
              <button
                key={wallet.phone}
                type="button"
                disabled={Boolean(feePayment)}
                onClick={() => {
                  setMethod(wallet.method);
                  setPayPhone(wallet.phone);
                  rememberPayment(null);
                  setError("");
                  setPayNote(`Sandbox ${wallet.provider} wallet selected. Approve the prompt with PIN ${wallet.pin}.`);
                }}
                className="rounded-lg border border-line px-3 py-2 text-left text-xs font-semibold text-navy-950 transition-colors hover:bg-surface-alt disabled:opacity-50"
              >
                Use {wallet.provider}
                <span className="mt-0.5 block font-mono font-normal text-ink-muted">
                  {wallet.phone} · PIN {wallet.pin}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {payNote && <p role="status" className="rounded-lg bg-surface-alt px-3 py-2 text-sm text-ink">{payNote}</p>}
      {feePayment?.checkoutUrl && feePayment.status !== "succeeded" && (
        <a href={feePayment.checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-navy-950 underline">
          Card page didn&apos;t open? Open the secure checkout here
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

      <Button type="submit" variant="accent" size="lg" disabled={busy} className="w-full sm:w-auto">
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
