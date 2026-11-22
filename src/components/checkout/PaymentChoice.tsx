"use client";

import type { PaymentMethod } from "@/lib/checkout";

const OPTIONS: { value: PaymentMethod; label: string; note: string }[] = [
  { value: "tnm", label: "TNM Mpamba", note: "PIN prompt on your phone" },
  { value: "airtel", label: "Airtel Money", note: "PIN prompt on your phone" },
  { value: "card", label: "Bank card", note: "Secure PayChangu page" },
];

/**
 * The one payment screen shared by ticket buyers and business owners paying the publishing fee:
 * pick TNM Mpamba, Airtel Money or card, and enter a mobile money number for the PIN prompt.
 * Payments are processed by PayChangu. When the API reports `hosted`, mobile money can't be charged
 * directly, so PayChangu's own secure page handles everything and there is nothing to choose here.
 */
export function PaymentChoice({
  idPrefix,
  method,
  onMethodChange,
  phone,
  onPhoneChange,
  hosted = false,
  disabled = false,
}: {
  idPrefix: string;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  hosted?: boolean;
  disabled?: boolean;
}) {
  if (hosted) {
    return (
      <p className="text-sm text-ink-muted">
        You&apos;ll continue to PayChangu&apos;s secure payment page where you can pay with TNM Mpamba, Airtel Money or a bank card.
      </p>
    );
  }

  return (
    <div>
      <fieldset disabled={disabled} className="min-w-0">
        <legend className="text-sm font-medium text-ink">Pay with</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {OPTIONS.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={method === option.value}
                onChange={() => onMethodChange(option.value)}
                className="peer sr-only"
              />
              <span className="block rounded-xl border border-line px-3 py-2.5 text-sm transition-colors peer-checked:border-navy-950 peer-checked:bg-navy-950/5 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-400 peer-disabled:opacity-60">
                <span className="block font-semibold text-navy-950">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {method !== "card" ? (
        <div className="mt-4">
          <label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium text-ink">
            {method === "tnm" ? "TNM Mpamba number" : "Airtel Money number"}
          </label>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={disabled}
            placeholder={method === "tnm" ? "0888 123 456" : "0999 123 456"}
            className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
          />
          <p className="mt-1 text-xs text-ink-muted">You&apos;ll get a PIN prompt on this number. Use the number registered for {method === "tnm" ? "TNM Mpamba" : "Airtel Money"}.</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">You&apos;ll enter your card details on PayChangu&apos;s secure page, which opens in a new tab.</p>
      )}

    </div>
  );
}
