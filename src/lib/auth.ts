import { clearStoredRole } from "@/lib/roles";
import type { BusinessType } from "@/lib/business-types";

export interface AuthSession {
  token: string;
  refreshToken: string;
  sessionId?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
}

export interface AuthUser {
  id: number | string;
  email: string;
  name?: string;
  country?: string;
  /** Linked business type from the API's business_types table (signup / Google first sign-in). */
  businessType?: BusinessType | null;
  [key: string]: unknown;
}

export interface BusinessProfile {
  id: number | string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  type?: string;
  website?: string;
  description?: string;
  [key: string]: unknown;
}

const SESSION_KEY = "lumiticket.auth";
const USER_KEY = "lumiticket.user";

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "https://api-gamma-mocha-qn31xem8po.vercel.app").replace(/\/$/, "");
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(SESSION_KEY) ||
    window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  clearStoredRole();
}

/**
 * Caches the authenticated user (including their linked businessType) beside the
 * session so the workspace shell and header can route from the account of record
 * without waiting on another /api/auth/me round-trip.
 */
export function saveAuthUser(user: AuthUser, remember = true) {
  if (typeof window === "undefined") return;
  (remember ? window.localStorage : window.sessionStorage).setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Thrown for any non-2xx API response; `status` lets callers tell an expired session (401) from other failures. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  }).catch(() => null);
  if (!response || !response.ok) return null;

  const refreshed = (await response.json().catch(() => null)) as AuthSession | null;
  if (!refreshed?.token) return null;
  saveAuthSession(refreshed, Boolean(window.localStorage.getItem(SESSION_KEY)));
  return refreshed;
}

async function authorizedRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T | null> {
  const send = (bearer: string) =>
    fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${bearer}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });

  // Prefer the freshest stored token; on a 401 rotate the refresh token once and retry.
  const session = getAuthSession();
  let response = await send(session?.token ?? token);
  if (response.status === 401 && session?.refreshToken) {
    const refreshed = await refreshSession(session);
    if (refreshed) response = await send(refreshed.token);
  }

  if (response.status === 404) return null;

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null;

  if (!response.ok) {
    throw new ApiError(payload?.message || payload?.error || "Request failed.", response.status);
  }

  return payload as T;
}

export function getCurrentUser(token: string) {
  return authorizedRequest<AuthUser>("/api/auth/me", token);
}

export function getBusinessProfile(token: string) {
  return authorizedRequest<BusinessProfile>("/api/kyb", token);
}

export function createBusinessProfile(
  token: string,
  profile: Omit<BusinessProfile, "id">,
) {
  return authorizedRequest<BusinessProfile>("/api/kyb", token, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export interface EventSummary {
  id: number | string;
  title: string;
  category: string;
  location: string;
  startsAt: string;
  [key: string]: unknown;
}

export async function listEvents(token: string, businessProfileId: number | string) {
  const result = await authorizedRequest<EventSummary[]>(
    `/api/events?businessProfileId=${businessProfileId}`,
    token,
  );
  return result ?? [];
}

export interface EventTicketTypeRow {
  id: number | string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  remaining: number;
}

export interface EventDetail extends EventSummary {
  status?: string;
  tickets?: EventTicketTypeRow[];
}

/** Full event with its ticket types — the list endpoint omits the tickets. */
export function getEvent(token: string, id: number | string) {
  return authorizedRequest<EventDetail>(`/api/events/${id}`, token);
}

export interface PaymentRecord {
  id: number | string;
  method?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paidAt?: string;
  [key: string]: unknown;
}

export function simulatePayment(
  token: string,
  payload: {
    businessProfileId: number | string;
    amount: number;
    currency: string;
    method: "card" | "tnm" | "airtel";
  },
) {
  return authorizedRequest<PaymentRecord>("/api/payments/simulate", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPayments(token: string, businessProfileId: number | string) {
  const result = await authorizedRequest<PaymentRecord[]>(
    `/api/payments/simulate?businessProfileId=${businessProfileId}`,
    token,
  );
  return result ?? [];
}

export interface TicketTierInput {
  name: string;
  price: number;
  currency: string;
  capacity: number;
  perks: string[];
}

export interface CreateEventInput {
  businessProfileId: number | string;
  paymentId: number | string;
  title: string;
  subtitle?: string;
  category: "event" | "bus" | "flight" | "tourism";
  organizer?: string;
  description?: string;
  location: string;
  startsAt: string;
  maxPerUser?: number;
  tags?: string[];
  tickets: TicketTierInput[];
}

export function createEventListing(token: string, payload: CreateEventInput) {
  return authorizedRequest<EventSummary>("/api/events", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface TeamRole {
  id: number | string;
  name: string;
  description?: string;
  permissions: string[];
  [key: string]: unknown;
}

export async function listTeamRoles(token: string, businessProfileId: number | string) {
  const result = await authorizedRequest<TeamRole[]>(
    `/api/team/roles?businessProfileId=${businessProfileId}`,
    token,
  );
  return result ?? [];
}

export function createTeamRole(
  token: string,
  payload: {
    businessProfileId: number | string;
    name: string;
    description?: string;
    permissions: string[];
  },
) {
  return authorizedRequest<TeamRole>("/api/team/roles", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface TeamInvitation {
  id: number | string;
  email: string;
  name: string;
  status?: string;
  roleId?: number | string;
  [key: string]: unknown;
}

export async function listTeamInvitations(token: string, businessProfileId: number | string) {
  const result = await authorizedRequest<TeamInvitation[]>(
    `/api/team/invitations?businessProfileId=${businessProfileId}`,
    token,
  );
  return result ?? [];
}

export function createTeamInvitation(
  token: string,
  payload: {
    businessProfileId: number | string;
    email: string;
    name: string;
    roleId?: number | string;
    role?: string;
    expiresInDays?: number;
  },
) {
  return authorizedRequest<TeamInvitation>("/api/team/invitations", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface AuditEntry {
  id: number | string;
  action: string;
  createdAt?: string;
  [key: string]: unknown;
}

export async function listAuditLog(token: string, businessProfileId: number | string) {
  const result = await authorizedRequest<AuditEntry[]>(
    `/api/audit?businessProfileId=${businessProfileId}`,
    token,
  );
  return result ?? [];
}

export async function logoutSession(token: string) {
  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Best-effort — clearing the local session still logs the user out client-side.
  }
}

export function googleAuth(
  idToken: string,
  email: string,
  name: string,
  avatar: string,
  businessType?: string,
) {
  return authRequest<AuthSession>("/api/auth/google", {
    idToken,
    email,
    name,
    avatar,
    ...(businessType ? { businessType } : {}),
  });
}

/**
 * Auth POST/PATCH helper. A bearer token is only sent when supplied — signup and
 * login are anonymous, while the business-type PATCH endpoint is protected.
 */
export async function authRequest<T>(
  path: string,
  body: Record<string, unknown>,
  options: { method?: "POST" | "PATCH"; token?: string } = {},
) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Authentication failed. Please try again.");
  }

  return payload as T;
}

export function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Invalid Google token.");

  const decoded = decodeURIComponent(
    window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(""),
  );

  return JSON.parse(decoded) as {
    email?: string;
    name?: string;
    given_name?: string;
    picture?: string;
  };
}

export function saveAuthSession(session: AuthSession, remember = true) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Updates the signed-in user's recorded business type (id, slug, or name). */
export function updateBusinessType(token: string, businessType: string | number) {
  return authRequest<{ user: AuthUser }>("/api/auth/signup", { businessType }, {
    method: "PATCH",
    token,
  });
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const session = getAuthSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  let response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  if (response.status === 401 && session?.refreshToken) {
    const refreshResponse = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (refreshResponse.ok) {
      const refreshed = (await refreshResponse.json()) as AuthSession;
      saveAuthSession(refreshed, Boolean(window.localStorage.getItem("lumiticket.auth")));
      headers.set("Authorization", `Bearer ${refreshed.token}`);
      response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
    }
  }

  const payload = (await response.json().catch(() => null)) as (T & { message?: string; error?: string }) | null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status}).`);
  return payload as T;
}

export async function publicApiRequest<T>(path: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}`);
  const payload = (await response.json().catch(() => null)) as (T & { message?: string; error?: string }) | null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status}).`);
  return payload as T;
}
