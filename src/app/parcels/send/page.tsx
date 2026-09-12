"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import { getAuthSession } from "@/lib/auth";
import { AccountNudge } from "@/components/checkout/GuestDetailsStep";

const BASE_FEE = 3000;
const PER_KG = 1500;

function estimateCost(weightKg: number) {
  return Math.round(BASE_FEE + Math.max(0, weightKg) * PER_KG);
}

export default function SendParcelPage() {
  const [weight, setWeight] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [reference, setReference] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const loggedIn = Boolean(getAuthSession());

  const cost = estimateCost(weight);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ref = `LMT-PCL-${Math.floor(10000 + Math.random() * 90000)}`;
    setReference(ref);
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <Badge tone="success">Parcel registered</Badge>
        <h1 className="mt-4 text-2xl font-bold text-navy-950">
          {pickup || "Pickup"} → {delivery || "Delivery"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Recipient: {recipientName || "—"} · {weight}kg
        </p>

        <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            QR label
          </span>
        </div>

        <p className="mt-4 text-sm text-ink-muted">Tracking reference: {reference}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Estimated cost: {formatPrice(cost, "MWK")} · pay online or at pickup
        </p>
        <AccountNudge loggedIn={loggedIn} />

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton href={`/parcels?ref=${reference}`} variant="primary" size="md">
            Track this parcel
          </LinkButton>
          <Link
            href="/parcels/send"
            onClick={() => setConfirmed(false)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-navy-950 hover:border-navy-400"
          >
            Send another parcel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy-950">Send a parcel</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Register sender and recipient details to get an instant quote and a
        trackable QR label.{" "}
        <Link href="/parcels" className="font-semibold text-navy-950 hover:text-gold-600">
          Tracking an existing parcel instead? →
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="rounded-2xl border border-line p-5">
          <h2 className="text-sm font-bold text-navy-950">Sender</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sender-name" className="text-sm font-medium text-ink">Full name</label>
              <input id="sender-name" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Chikondi Banda" />
            </div>
            <div>
              <label htmlFor="sender-phone" className="text-sm font-medium text-ink">Phone</label>
              <input id="sender-phone" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="+265 999 000 000" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pickup" className="text-sm font-medium text-ink">Pickup location</label>
              <input
                id="pickup"
                required
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="Lilongwe"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <h2 className="text-sm font-bold text-navy-950">Recipient</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="recipient-name" className="text-sm font-medium text-ink">Full name</label>
              <input
                id="recipient-name"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="Grace Mvula"
              />
            </div>
            <div>
              <label htmlFor="recipient-phone" className="text-sm font-medium text-ink">Phone</label>
              <input id="recipient-phone" required className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="+265 888 000 000" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="delivery" className="text-sm font-medium text-ink">Delivery location</label>
              <input
                id="delivery"
                required
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="Blantyre"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <h2 className="text-sm font-bold text-navy-950">Parcel details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="weight" className="text-sm font-medium text-ink">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                min={0.1}
                step={0.1}
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
              />
            </div>
            <div>
              <label htmlFor="declared-value" className="text-sm font-medium text-ink">Declared value (optional)</label>
              <input id="declared-value" type="number" min={0} className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="MWK" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-ink">What&apos;s inside? (optional)</label>
              <input id="description" className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400" placeholder="Documents, clothing, electronics…" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-line p-5">
          <div>
            <p className="text-xs text-ink-faint">Estimated cost</p>
            <p className="text-xl font-bold text-navy-950">{formatPrice(cost, "MWK")}</p>
          </div>
          <Button type="submit" variant="accent" size="lg">
            Register parcel
          </Button>
        </div>
      </form>
    </div>
  );
}
