export interface AuthSession {
  token: string;
  refreshToken: string;
  sessionId?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
}

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
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
  storage.setItem("lumiticket.auth", JSON.stringify(session));
}
