"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useDashboardSession } from "@/lib/useDashboardSession";
import {
  createEventListing,
  getBusinessProfile,
  simulatePayment,
  type BusinessProfile,
  type TicketTierInput,
} from "@/lib/auth";

const emptyTier: TicketTierInput = {
  name: "",
  price: 0,
  currency: "MWK",
  capacity: 50,
  perks: [],
};

export default function CreateEventPage() {
  const { token, ready } = useDashboardSession();
  const [profile, setProfile] = useState<BusinessProfile | null | undefined>(undefined);
  const [tiers, setTiers] = useState<TicketTierInput[]>([{ ...emptyTier }]);
  const [method, setMethod] = useState<"card" | "tnm" | "airtel">("tnm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    getBusinessProfile(token).then(setProfile);
  }, [ready, token]);

  function updateTier(index: number, patch: Partial<TicketTierInput>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profile) return;
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const formData = new FormData(event.currentTarget);
      const feeAmount = Number(formData.get("feeAmount") || 0);
      const feeCurrency = String(formData.get("feeCurrency") || "MWK");

      const payment = await simulatePayment(token, {
        businessProfileId: profile.id,
        amount: feeAmount,
        currency: feeCurrency,
        method,
      });
      if (!payment) throw new Error("Payment simulation did not return a record.");

      const tags = String(formData.get("tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createEventListing(token, {
        businessProfileId: profile.id,
        paymentId: payment.id,
        title: String(formData.get("title") || ""),
        subtitle: String(formData.get("subtitle") || ""),
        category: formData.get("category") as "event" | "bus" | "flight" | "tourism",
        organizer: String(formData.get("organizer") || ""),
        description: String(formData.get("description") || ""),
        location: String(formData.get("location") || ""),
        startsAt: new Date(String(formData.get("startsAt") || "")).toISOString(),
        maxPerUser: Number(formData.get("maxPerUser") || 5),
        tags,
        tickets: tiers
          .filter((t) => t.name)
          .map((t) => ({ ...t, price: Number(t.price), capacity: Number(t.capacity) })),
      });

      setSuccess(`"${created?.title ?? "Event"}" was published successfully.`);
      setTiers([{ ...emptyTier }]);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not publish this event.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready || profile === undefined) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-line p-6">
        <h1 className="text-lg font-bold text-navy-950">Create your business profile first</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Events are published under a verified business profile.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-navy-950">
          ← Back to overview
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {profile.businessName}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-navy-950">Create an event</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Publishing requires a payment step. In this environment the payment
        provider is a simulation, matching the API&apos;s current integration
        state.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="text-sm font-medium text-ink">Title</label>
            <input id="title" name="title" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Lilongwe Food Fest" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="subtitle" className="text-sm font-medium text-ink">Subtitle</label>
            <input id="subtitle" name="subtitle" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Food, music, and local makers" />
          </div>

          <div>
            <label htmlFor="category" className="text-sm font-medium text-ink">Category</label>
            <select id="category" name="category" required className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400" defaultValue="event">
              <option value="event">Event</option>
              <option value="bus">Bus</option>
              <option value="flight">Flight</option>
              <option value="tourism">Tourism</option>
            </select>
          </div>

          <div>
            <label htmlFor="organizer" className="text-sm font-medium text-ink">Organizer</label>
            <input id="organizer" name="organizer" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Lum Events" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="location" className="text-sm font-medium text-ink">Location</label>
            <input id="location" name="location" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Lilongwe Civic Centre" />
          </div>

          <div>
            <label htmlFor="startsAt" className="text-sm font-medium text-ink">Starts at</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" />
          </div>

          <div>
            <label htmlFor="maxPerUser" className="text-sm font-medium text-ink">Max tickets per user</label>
            <input id="maxPerUser" name="maxPerUser" type="number" min={1} defaultValue={5} className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tags" className="text-sm font-medium text-ink">Tags (comma separated)</label>
            <input id="tags" name="tags" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="food, music" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="text-sm font-medium text-ink">Description</label>
            <textarea id="description" name="description" rows={3} className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-navy-400" placeholder="An open-air food festival." />
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-950">Ticket types</h2>
            <button
              type="button"
              onClick={() => setTiers((prev) => [...prev, { ...emptyTier }])}
              className="text-sm font-semibold text-navy-950 hover:text-gold-600"
            >
              + Add ticket type
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {tiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 sm:grid-cols-5">
                <input
                  aria-label="Ticket name"
                  value={tier.name}
                  onChange={(e) => updateTier(index, { name: e.target.value })}
                  placeholder="General Admission"
                  className="col-span-2 h-11 rounded-lg border border-line px-3 text-sm focus:border-navy-400 sm:col-span-1"
                />
                <input
                  aria-label="Price"
                  type="number"
                  min={0}
                  value={tier.price}
                  onChange={(e) => updateTier(index, { price: Number(e.target.value) })}
                  placeholder="Price"
                  className="h-11 rounded-lg border border-line px-3 text-sm focus:border-navy-400"
                />
                <input
                  aria-label="Currency"
                  value={tier.currency}
                  onChange={(e) => updateTier(index, { currency: e.target.value })}
                  placeholder="MWK"
                  className="h-11 rounded-lg border border-line px-3 text-sm focus:border-navy-400"
                />
                <input
                  aria-label="Capacity"
                  type="number"
                  min={1}
                  value={tier.capacity}
                  onChange={(e) => updateTier(index, { capacity: Number(e.target.value) })}
                  placeholder="Capacity"
                  className="h-11 rounded-lg border border-line px-3 text-sm focus:border-navy-400"
                />
                <input
                  aria-label="Perks"
                  value={tier.perks.join(", ")}
                  onChange={(e) =>
                    updateTier(index, {
                      perks: e.target.value.split(",").map((p) => p.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Perks (comma separated)"
                  className="h-11 rounded-lg border border-line px-3 text-sm focus:border-navy-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <h2 className="text-sm font-bold text-navy-950">Payment (simulated)</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="feeAmount" className="text-sm font-medium text-ink">Amount</label>
              <input id="feeAmount" name="feeAmount" type="number" min={0} required defaultValue={10000} className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" />
            </div>
            <div>
              <label htmlFor="feeCurrency" className="text-sm font-medium text-ink">Currency</label>
              <input id="feeCurrency" name="feeCurrency" defaultValue="MWK" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" />
            </div>
            <div>
              <label htmlFor="method" className="text-sm font-medium text-ink">Method</label>
              <select
                id="method"
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400"
                value={method}
                onChange={(e) => setMethod(e.target.value as "card" | "tnm" | "airtel")}
              >
                <option value="tnm">TNM Mpamba</option>
                <option value="airtel">Airtel Money</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">{success}</p>}

        <Button type="submit" variant="accent" size="lg" disabled={busy} className="w-full sm:w-auto">
          {busy ? "Publishing…" : "Simulate payment & publish"}
        </Button>
      </form>
    </div>
  );
}
