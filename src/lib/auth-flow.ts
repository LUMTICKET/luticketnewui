// The authentication and onboarding flow as the deployed Lumticket API actually
// implements it.
//
// The API enables two-factor authentication by default, so a correct password
// does NOT produce a session: POST /api/auth/login answers 200 with
// `{ requires2FA: true, challengeToken, maskedDestination, expiresIn }` and no
// token. The session only arrives from POST /api/auth/2fa. Callers must branch
// on `requires2FA` rather than on the HTTP status.
//
// Every session-producing endpoint also returns `nextStep`, which is the
// authoritative answer to "where should this account go now?".
import {
  ApiError,
  apiRequest,
  authRequest,
  publicApiRequest,
  type NextStep,
  type SessionPayload,
  type AuthUser,
  type BusinessProfile,
} from "@/lib/auth";

/** The challenge returned by login when the account has 2FA switched on. */
export interface TwoFactorChallenge {
  challengeToken: string;
  /** Masked delivery target, e.g. `o***@example.com`, for the UI copy. */
  maskedDestination: string;
  /** Seconds the code stays valid (600 = 10 minutes). */
  expiresIn: number;
}

export type SignInResult =
  | ({ status: "needs2FA" } & TwoFactorChallenge)
  | ({ status: "authenticated" } & SessionPayload);

/**
 * POST /api/auth/login. `identifier` accepts a Business ID, an email address,
 * or a phone number — the API resolves all three identically.
 */
export async function signIn(identifier: string, password: string): Promise<SignInResult> {
  const data = await authRequest<Record<string, unknown>>("/api/auth/login", {
    identifier,
    password,
  });

  // Branch on the flag, not the status: a 200 here may still carry no token.
  if (data.requires2FA) {
    return {
      status: "needs2FA",
      challengeToken: String(data.challengeToken ?? ""),
      maskedDestination: String(data.maskedDestination ?? "your email"),
      expiresIn: Number(data.expiresIn ?? 600),
    };
  }

  return {
    status: "authenticated",
    token: String(data.token ?? ""),
    refreshToken: String(data.refreshToken ?? ""),
    sessionId: data.sessionId as string | undefined,
    expiresAt: data.expiresAt as string | undefined,
    refreshExpiresAt: data.refreshExpiresAt as string | undefined,
    user: data.user as AuthUser | undefined,
    nextStep: data.nextStep as NextStep | undefined,
  };
}

/**
 * Exchanges the emailed 6-digit code for a session. Errors the UI must
 * distinguish: 401 wrong code, 429 five failed attempts, 410 expired
 * challenge, 502 the email could not be delivered.
 */
export function verifyTwoFactor(challengeToken: string, code: string) {
  return authRequest<SessionPayload>("/api/auth/2fa", { challengeToken, code });
}

/** Emails a fresh code and keeps the same challenge token. */
export function resendTwoFactor(challengeToken: string) {
  return authRequest<{ sent?: boolean }>("/api/auth/2fa/resend", { challengeToken });
}

/** Turns the documented 2FA status codes into something worth showing a user. */
export function twoFactorErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError) && !(error instanceof Error)) {
    return "Could not verify the code. Try again.";
  }
  const status = error instanceof ApiError ? error.status : 0;
  switch (status) {
    case 401:
      return "That code isn't right. Check the digits and try again.";
    case 410:
      return "That code has expired. Sign in again to get a new one.";
    case 429:
      return "Too many incorrect codes. Sign in again to restart the check.";
    case 502:
      return "We couldn't email the code. Check your inbox or try again in a moment.";
    default:
      return error.message || "Could not verify the code. Try again.";
  }
}

export interface RegistrationStatus {
  registered: boolean;
  /** Business profile fields the API still wants before the account is complete. */
  missingFields: string[];
  nextStep: NextStep;
  user?: AuthUser;
}

/**
 * GET /api/business/register — the cheapest way to decide where an account
 * belongs without re-running login. Returns 404-safe empty status when the
 * account cannot register at all.
 */
export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  try {
    const data = await apiRequest<Partial<RegistrationStatus>>("/api/business/register");
    return {
      registered: Boolean(data.registered),
      missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
      nextStep: (data.nextStep as NextStep | undefined) ?? "register-business",
      user: data.user,
    };
  } catch {
    return { registered: false, missingFields: [], nextStep: "register-business" };
  }
}

export interface RegisterBusinessInput {
  businessType: string | number;
  businessName: string;
  type?: "individual" | "company";
  country?: string;
  phone?: string;
  email?: string;
}

/**
 * POST /api/business/register — the minimal first step. Only the business type
 * and name are required; every other KYB field is completed later from the
 * workspace profile panel. Answers 409 when a business already exists.
 */
export function registerBusiness(input: RegisterBusinessInput) {
  // Answers with the created profile flat at the top level, alongside the
  // onboarding state (`missingFields` / `nextStep`) and the updated user.
  return apiRequest<BusinessProfile & {
    missingFields?: string[];
    nextStep?: NextStep;
    user?: AuthUser;
  }>("/api/business/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Resolves the workspace-relative destination for an account. `nextStep` is
 * authoritative from the API; `profileHref` is where this app collects the
 * business details it is still missing.
 */
export function onboardingDestination(
  nextStep: NextStep | undefined,
  profileHref: string,
): string | null {
  if (nextStep === "register-business" || nextStep === "complete-profile") {
    return profileHref;
  }
  return null;
}

/** Public catalog event detail for the checkout flow (GET /api/catalog/events/:id is owner-only). */
export function listPublicEvents(params: { country?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, String(value));
  const query = search.toString();
  return publicApiRequest<unknown>(`/api/catalog/events${query ? `?${query}` : ""}`);
}