// Customer ticket checkout against the Lumticket API (OneKhusa behind it).
//
//   POST /api/checkout/tickets        { ticketTypeId, quantity, method, phone? } -> pending payment
//   GET  /api/checkout/tickets/:id    -> { status, booking? | problem? }
//
// The server prices the order and issues the booking only after OneKhusa's signed
// webhook confirms payment, so a 201 or a card redirect is never proof of payment.
import { apiRequest, ApiError, publicApiRequest, type PaymentMethod } from "@/lib/auth";
import type { ApiBooking } from "@/lib/operations";

export type { PaymentMethod };

export interface TicketCheckoutStarted {
  paymentId: number | string;
  status: "pending";
  amount: number;
  currency: string;
  /** Mobile money: amount the payer will actually be asked to approve (incl. charges). */
  amountToPay?: number;
  totalCharges?: number;
  /** Card only: OneKhusa hosted checkout page (valid ~10 minutes). */
  checkoutUrl?: string;
}

export interface CheckoutConfig {
  provider: "onekhusa" | "paychangu";
  /** Hosted checkout: the customer picks mobile money or card on the provider's page. */
  hosted: boolean;
}

/** How this deployment collects payment. Falls back to the mobile-money form if the API is older. */
export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  try {
    const result = await publicApiRequest<CheckoutConfig>("/api/checkout/config");
    if (result && typeof result.hosted === "boolean") return result;
  } catch {
    /* older API without the config route */
  }
  return { provider: "onekhusa", hosted: false };
}

export function startTicketCheckout(payload: {
  ticketTypeId: number | string;
  quantity: number;
  method?: PaymentMethod;
  phone?: string;
}) {
  return apiRequest<TicketCheckoutStarted>("/api/checkout/tickets", {
    method: "POST",
    body: JSON.stringify({ ...payload, ticketTypeId: Number(payload.ticketTypeId) }),
  });
}

export interface TicketCheckoutStatus {
  status: "pending" | "failed" | "succeeded" | "reversed";
  booking?: ApiBooking;
  /** Paid but the last tickets went first; the payment is flagged for refund. */
  problem?: "sold-out" | "not-ready";
}

export function getTicketCheckoutStatus(paymentId: number | string) {
  return apiRequest<TicketCheckoutStatus>(`/api/checkout/tickets/${encodeURIComponent(String(paymentId))}`);
}

export type TicketOutcome = TicketCheckoutStatus | { status: "timeout" };

/**
 * Polls until the payment settles or the timeout passes. A timeout is not a failure —
 * the payer may still be approving the prompt — so keep the payment id and check again
 * instead of starting (and charging) a second payment.
 */
export async function waitForTicketPayment(
  paymentId: number | string,
  { timeoutMs = 180_000, intervalMs = 3_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<TicketOutcome> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      const result = await getTicketCheckoutStatus(paymentId);
      if (result.status === "succeeded") {
        // Booking not issued yet (webhook landed, fulfilment retrying): keep polling unless sold out.
        if (result.booking || result.problem === "sold-out") return result;
      } else if (result.status === "failed" || result.status === "reversed") {
        return result;
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw error;
      /* transient error: keep polling */
    }
  }
  return { status: "timeout" };
}

/** OneKhusa's sandbox accepts only these payer wallets (PIN 1234). Live mode has no such limit. */
export const SANDBOX_WALLETS = [
  { provider: "TNM Mpamba", method: "tnm" as const, phone: "231100000101" },
  { provider: "Airtel Money", method: "airtel" as const, phone: "221100000101" },
] as const;

const MALAWI_MOBILE = /^(?:\+?265|0)?[89]\d{8}$/;

export function isValidMobileMoneyNumber(value: string) {
  const compact = value.replace(/[\s-]/g, "");
  return MALAWI_MOBILE.test(compact) || SANDBOX_WALLETS.some((w) => w.phone === compact);
}
