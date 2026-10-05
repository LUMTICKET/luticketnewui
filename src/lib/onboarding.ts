// Post-sign-up onboarding: the single place a business type is chosen and
// written to the account.
import { authRequest, type AuthUser } from "@/lib/auth";

/**
 * Stores the chosen business type on the account.
 *
 * `PATCH /api/auth/signup` is the API's documented way to change the stored
 * business type, and it returns the updated user — including `businessId` and
 * the resolved `businessType` — which is what the dashboard renders.
 */
export async function persistBusinessType(token: string, businessType: string) {
  const payload = await authRequest<{ user: AuthUser }>(
    "/api/auth/signup",
    { businessType },
    { method: "PATCH", token },
  );

  if (!payload?.user) {
    throw new Error("Saved, but the server didn't return your account. Try again.");
  }
  return payload;
}

/** True when the account has no business type on record yet. */
export function needsBusinessType(user: AuthUser | null | undefined): boolean {
  return !user?.businessType;
}