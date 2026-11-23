"use client";

import Image from "next/image";
import type { PaymentMethod } from "@/lib/checkout";

const OPTIONS: { value: PaymentMethod; label: string; note: string; icon: string }[] = [
  { value: "tnm", label: "TNM Mpamba", note: "PIN prompt on your phone", icon: "/icons/tnm-mpamba.jpg" },
  { value: "airtel", label: "Airtel Money", note: "PIN prompt on your phone", icon: "/icons/airtelmoney.png" },
  { value: "card", label: "Bank card", note: "Secure PayChangu page", icon: "/icons/bank-icon.jpg" },
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
        <div className="mt-2 grid grid-cols-3 gap-2">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              onClick={() => {
                if (!disabled) onMethodChange(option.value);
              }}
              className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
            >
              <input
                type="radio"
                name={`${idPrefix}-method`}
                value={option.value}
                checked={method === option.value}
                onChange={() => onMethodChange(option.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-line px-1.5 py-3 text-center transition-colors peer-checked:border-navy-950 peer-checked:bg-navy-950/5 peer-checked:ring-1 peer-checked:ring-navy-950 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-400 peer-disabled:opacity-60">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
                  <Image src={option.icon} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
                </span>
                <span className="text-xs font-semibold leading-tight text-navy-950 sm:text-sm">{option.label}</span>
                <span className="hidden text-xs text-ink-muted sm:block">{option.note}</span>
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
