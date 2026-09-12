"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface GuestDetails {
  name: string;
  contact: string;
}

export function GuestDetailsStep({
  onSubmit,
  onBack,
}: {
  onSubmit: (details: GuestDetails) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, contact });
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line p-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-navy-950 hover:text-gold-600"
      >
        ← Back
      </button>
      <h2 className="mt-3 text-lg font-bold text-navy-950">Your details</h2>
      <p className="mt-1 text-sm text-ink-muted">
        No account needed — we just need somewhere to send your ticket.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="guest-name" className="text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="guest-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="Chikondi Banda"
          />
        </div>
        <div>
          <label htmlFor="guest-contact" className="text-sm font-medium text-ink">
            Email or mobile number
          </label>
          <input
            id="guest-contact"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full">
          Continue to payment
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-faint">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-navy-950 underline">
          Log in
        </Link>{" "}
        to skip this step next time and keep every booking in one place.
      </p>
    </div>
  );
}

export function AccountNudge({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) {
    return (
      <p className="mt-4 text-xs text-ink-faint">
        Saved to your account — find it under Manage my bookings.
      </p>
    );
  }

  return (
    <p className="mt-4 text-xs text-ink-faint">
      Want this saved for next time?{" "}
      <Link href="/signup" className="font-medium text-navy-950 underline">
        Create a free account
      </Link>{" "}
      — totally optional.
    </p>
  );
}
