"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getPayoutDetails, listPayoutBanks, savePayoutDetails, type PayoutDetails, type PayoutMethod } from "@/lib/auth";
import { Card, inputClass } from "./ui";

const LABELS: Record<PayoutMethod, string> = { tnm: "TNM Mpamba", airtel: "Airtel Money", bank: "Bank account" };

/**
 * Where an organiser's ticket money goes. Lumticket keeps its commission (5% small, 7% standard,
 * 8% premium events) and the rest is sent here straight after each purchase.
 */
export function PayoutAccountCard({ onChange }: { onChange?: (configured: boolean) => void }) {
  const [details, setDetails] = useState<PayoutDetails | null | undefined>(undefined);
  const [method, setMethod] = useState<PayoutMethod>("tnm");
  const [banks, setBanks] = useState<{ uuid: string; name: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPayoutDetails()
      .then((d) => {
        if (cancelled) return;
        setDetails(d);
        if (d?.method) setMethod(d.method);
        onChange?.(Boolean(d?.configured));
      })
      .catch(() => !cancelled && setDetails(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (method !== "bank" || banks.length) return;
    listPayoutBanks().then(setBanks).catch(() => undefined);
  }, [method, banks.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      const saved = await savePayoutDetails({
        method,
        accountName: String(data.get("accountName") || "").trim(),
        accountNumber: String(data.get("accountNumber") || "").trim(),
        ...(method === "bank" ? { bankUuid: String(data.get("bankUuid") || "") } : {}),
      });
      setDetails(saved);
      setEditing(false);
      onChange?.(Boolean(saved?.configured));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your payout account.");
    } finally {
      setBusy(false);
    }
  }

  const configured = Boolean(details?.configured);
  const showForm = editing || (details !== undefined && !configured);

  return (
    <Card className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy-950">Payout account</h2>
        {details !== undefined && (configured ? <Badge tone="success">Ready to be paid</Badge> : <Badge tone="warning">Required to publish events</Badge>)}
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        When someone buys a ticket, you are paid your share straight to this account. Lumticket keeps 5% on small events, 7% on standard events and 8% on premium events.
      </p>

      {details === undefined && <p className="mt-4 text-sm text-ink-muted">Loading…</p>}

      {configured && !editing && details && (
        <div className="mt-4 text-sm">
          <p className="text-ink">
            <strong>{details.method ? LABELS[details.method] : ""}</strong> · {details.accountName} · {details.accountNumber}
          </p>
          <Button type="button" variant="outline" size="md" className="mt-4" onClick={() => setEditing(true)}>
            Change payout account
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="payout-method" className="text-sm font-medium text-ink">Receive money via</label>
            <select id="payout-method" value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)} className={`mt-1.5 ${inputClass} h-12`}>
              {(Object.keys(LABELS) as PayoutMethod[]).map((m) => (
                <option key={m} value={m}>{LABELS[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="payout-name" className="text-sm font-medium text-ink">Account name</label>
            <input id="payout-name" name="accountName" required defaultValue={details?.accountName ?? ""} className={`mt-1.5 ${inputClass} h-12`} placeholder="Name registered on the account" />
          </div>
          {method === "bank" && (
            <div>
              <label htmlFor="payout-bank" className="text-sm font-medium text-ink">Bank</label>
              <select id="payout-bank" name="bankUuid" required defaultValue={details?.bankUuid ?? ""} className={`mt-1.5 ${inputClass} h-12`}>
                <option value="" disabled>{banks.length ? "Choose your bank" : "Loading banks…"}</option>
                {banks.map((b) => (
                  <option key={b.uuid} value={b.uuid}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={method === "bank" ? "" : "sm:col-span-1"}>
            <label htmlFor="payout-number" className="text-sm font-medium text-ink">
              {method === "bank" ? "Account number" : "Mobile money number"}
            </label>
            <input
              id="payout-number"
              name="accountNumber"
              required
              inputMode="numeric"
              defaultValue={details?.accountNumber ?? ""}
              className={`mt-1.5 ${inputClass} h-12`}
              placeholder={method === "bank" ? "Account number" : "0999 123 456"}
            />
          </div>
          {error && <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" variant="accent" size="lg" disabled={busy}>{busy ? "Saving…" : "Save payout account"}</Button>
            {configured && (
              <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
