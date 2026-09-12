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

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
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
}

async function authorizedRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T | null> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (response.status === 404) return null;

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Request failed.");
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

export async function authRequest<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export function googleAuth(idToken: string, email: string, name: string, avatar: string) {
  return authRequest<AuthSession>("/api/auth/google", {
    idToken,
    email,
    name,
    avatar,
  });
}

export function saveAuthSession(session: AuthSession, remember = true) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}
