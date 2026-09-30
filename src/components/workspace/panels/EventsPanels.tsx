"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  createEventListing,
  getEvent,
  listEvents,
  simulatePayment,
  type EventSummary,
  type TicketTierInput,
} from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { countries } from "@/lib/data";
import { workspaceHref } from "@/lib/workspace-nav";
import { Card, PageHeader, inputClass } from "../ui";
import { ProfileGate } from "../shared";
import { useWorkspace } from "../WorkspaceContext";

type Category = "event" | "bus" | "flight" | "tourism";

const emptyTier: TicketTierInput = { name: "", price: 0, currency: "MWK", capacity: 50, perks: [] };

// Supported currencies, from the country list — a dropdown instead of free
// text, so a price can't be posted with a typo'd or unsupported code.
const CURRENCY_OPTIONS = [...new Set(countries.map((c) => c.currency))];

function defaultCurrencyFor(countryCode: string | undefined) {
  return countries.find((c) => c.code === countryCode)?.currency ?? CURRENCY_OPTIONS[0];
}

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
  const [method, setMethod] = useState<"card" | "tnm" | "airtel">("tnm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bus-only route details (see formatRouteDetails above).
  const [arrivalTerminal, setArrivalTerminal] = useState("");
  const [direct, setDirect] = useState(true);
  const [stops, setStops] = useState<RouteStop[]>([{ name: "", eta: "" }]);
  const [estimatedArrival, setEstimatedArrival] = useState("");

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
        setBusy(true);

        try {
          const data = new FormData(form);
          const payment = await simulatePayment(token, {
            businessProfileId: profile.id,
            amount: Number(data.get("feeAmount") || 0),
            currency: String(data.get("feeCurrency") || defaultCurrency),
            method,
          });
          if (!payment) throw new Error("Payment simulation did not return a record.");

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
            startsAt: new Date(String(data.get("startsAt") || "")).toISOString(),
            maxPerUser: Number(data.get("maxPerUser") || 5),
            tags: String(data.get("tags") || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            tickets: tiers
              .filter((t) => t.name)
              .map((t) => ({ ...t, price: Number(t.price), capacity: Number(t.capacity) })),
          });

          setSuccess(`"${created?.title ?? "Listing"}" was published successfully.`);
          setTiers([{ ...emptyTier, currency: defaultCurrency }]);
          setArrivalTerminal("");
          setDirect(true);
          setStops([{ name: "", eta: "" }]);
          setEstimatedArrival("");
          form.reset();
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Could not publish this listing.");
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
        <h2 className="text-sm font-bold text-navy-950">Publishing fee (simulated payment)</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="feeAmount" className="text-sm font-medium text-ink">Amount</label>
            <input id="feeAmount" name="feeAmount" type="number" min={0} required defaultValue={10000} className={`mt-1.5 ${inputClass} h-12`} />
          </div>
          <div>
            <label htmlFor="feeCurrency" className="text-sm font-medium text-ink">Currency</label>
            <select id="feeCurrency" name="feeCurrency" defaultValue={defaultCurrency} className={`mt-1.5 ${inputClass} h-12`}>
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="method" className="text-sm font-medium text-ink">Method</label>
            <select id="method" value={method} onChange={(e) => setMethod(e.target.value as "card" | "tnm" | "airtel")} className={`mt-1.5 ${inputClass} h-12`}>
              <option value="tnm">TNM Mpamba</option>
              <option value="airtel">Airtel Money</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
      </Card>

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
        {busy ? "Publishing…" : submitLabel}
      </Button>
    </form>
  );
}
