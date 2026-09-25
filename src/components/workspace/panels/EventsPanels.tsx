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
import { workspaceHref } from "@/lib/workspace-nav";
import { Card, PageHeader, inputClass } from "../ui";
import { ProfileGate } from "../shared";
import { useWorkspace } from "../WorkspaceContext";

type Category = "event" | "bus" | "flight" | "tourism";

const emptyTier: TicketTierInput = { name: "", price: 0, currency: "MWK", capacity: 50, perks: [] };

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
  const { role, token } = useWorkspace();
  const [tiers, setTiers] = useState<TicketTierInput[]>([{ ...emptyTier }]);
  const [method, setMethod] = useState<"card" | "tnm" | "airtel">("tnm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateTier(index: number, patch: Partial<TicketTierInput>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={title} description={description} />

      <div className="mt-8">
        <ProfileGate feature={title}>
          {(profile) => (
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
                    currency: String(data.get("feeCurrency") || "MWK"),
                    method,
                  });
                  if (!payment) throw new Error("Payment simulation did not return a record.");

                  const created = await createEventListing(token, {
                    businessProfileId: profile.id,
                    paymentId: payment.id,
                    title: String(data.get("title") || ""),
                    subtitle: String(data.get("subtitle") || ""),
                    category: (categories.length === 1 ? categories[0] : data.get("category")) as Category,
                    organizer: String(data.get("organizer") || ""),
                    description: String(data.get("description") || ""),
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
                  setTiers([{ ...emptyTier }]);
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
                    <input id="title" name="title" required className={`mt-1.5 ${inputClass} h-12`} placeholder={categories[0] === "bus" ? "Lilongwe → Blantyre, 06:00" : "Lilongwe Food Fest"} />
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
                    <label htmlFor="organizer" className="text-sm font-medium text-ink">{categories[0] === "bus" ? "Operator" : "Organizer"}</label>
                    <input id="organizer" name="organizer" defaultValue={profile.businessName} className={`mt-1.5 ${inputClass} h-12`} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="location" className="text-sm font-medium text-ink">{categories[0] === "bus" ? "Departure terminal" : "Location"}</label>
                    <input id="location" name="location" required className={`mt-1.5 ${inputClass} h-12`} placeholder={categories[0] === "bus" ? "Lilongwe Bus Terminal" : "Lilongwe Civic Centre"} />
                  </div>
                  <div>
                    <label htmlFor="startsAt" className="text-sm font-medium text-ink">{categories[0] === "bus" ? "Departs at" : "Starts at"}</label>
                    <input id="startsAt" name="startsAt" type="datetime-local" required className={`mt-1.5 ${inputClass} h-12`} />
                  </div>
                  <div>
                    <label htmlFor="maxPerUser" className="text-sm font-medium text-ink">Max tickets per customer</label>
                    <input id="maxPerUser" name="maxPerUser" type="number" min={1} defaultValue={5} className={`mt-1.5 ${inputClass} h-12`} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="tags" className="text-sm font-medium text-ink">Tags (comma separated)</label>
                    <input id="tags" name="tags" className={`mt-1.5 ${inputClass} h-12`} placeholder="express, overnight" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="text-sm font-medium text-ink">Description</label>
                    <textarea id="description" name="description" rows={3} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-navy-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-navy-950">{categories[0] === "bus" ? "Seat classes" : "Ticket types"}</h2>
                  <button type="button" onClick={() => setTiers((prev) => [...prev, { ...emptyTier }])} className="text-sm font-semibold text-navy-950 hover:text-gold-600">
                    + Add
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  {tiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 sm:grid-cols-5">
                      <input aria-label="Name" value={tier.name} onChange={(e) => updateTier(index, { name: e.target.value })} placeholder={categories[0] === "bus" ? "Standard seat" : "General admission"} className={`col-span-2 sm:col-span-1 ${inputClass}`} />
                      <input aria-label="Price" type="number" min={0} value={tier.price} onChange={(e) => updateTier(index, { price: Number(e.target.value) })} className={inputClass} />
                      <input aria-label="Currency" value={tier.currency} onChange={(e) => updateTier(index, { currency: e.target.value })} className={inputClass} />
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
                    <input id="feeCurrency" name="feeCurrency" defaultValue="MWK" className={`mt-1.5 ${inputClass} h-12`} />
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
          )}
        </ProfileGate>
      </div>
    </div>
  );
}
