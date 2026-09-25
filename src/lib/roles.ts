// Account roles and the workspace each one lands in after signing in.
//
// The API currently returns no explicit account type, so the role chosen at
// sign-up / sign-in is remembered in the browser and used to route people to
// the right workspace. This is navigation, not authorization: every privileged
// action must still be enforced by the API. If the API starts returning a role
// (`role`, `roles[]` or `accountType` on /api/auth/me) it takes precedence —
// see `resolveRole`.

export type AccountRole =
  | "customer"
  | "bus-operator"
  | "courier"
  | "organizer"
  | "agent"
  | "staff";

export interface RoleConfig {
  id: AccountRole;
  label: string;
  workspace: string;
  blurb: string;
  landing: string;
  /** Business roles complete KYC/KYB verification before going live. */
  business: boolean;
}

export const ROLES: Record<AccountRole, RoleConfig> = {
  customer: {
    id: "customer",
    label: "Customer",
    workspace: "My account",
    blurb: "Book bus and event tickets, send and track parcels.",
    landing: "/account",
    business: false,
  },
  "bus-operator": {
    id: "bus-operator",
    label: "Bus operator",
    workspace: "Bus operator workspace",
    blurb: "Publish routes and schedules, manage your fleet, seats and settlements.",
    landing: "/bus-operator",
    business: true,
  },
  courier: {
    id: "courier",
    label: "Courier operator",
    workspace: "Courier workspace",
    blurb: "Run your parcel queue, dispatch couriers and confirm deliveries.",
    landing: "/courier",
    business: true,
  },
  organizer: {
    id: "organizer",
    label: "Event organizer",
    workspace: "Organizer workspace",
    blurb: "Create events and ticket types, and validate entry at the gate.",
    landing: "/organizer",
    business: true,
  },
  agent: {
    id: "agent",
    label: "Retail / POS agent",
    workspace: "Agent workspace",
    blurb: "Sell tickets and register parcels in person, and reconcile your till.",
    landing: "/agent",
    business: true,
  },
  staff: {
    id: "staff",
    label: "Lumina staff",
    workspace: "Staff console",
    blurb: "System administration and customer support for Lumina Holdings.",
    landing: "/admin",
    business: false,
  },
};

/** Roles anyone can register for. Staff accounts are provisioned, never self-registered. */
export const PUBLIC_ROLES: AccountRole[] = ["customer", "bus-operator", "courier", "organizer", "agent"];

export const WORKSPACE_PREFIXES = ["/bus-operator", "/courier", "/organizer", "/agent", "/admin"] as const;

export function isAccountRole(value: unknown): value is AccountRole {
  return typeof value === "string" && value in ROLES;
}

export function isWorkspacePath(pathname: string) {
  return WORKSPACE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function roleLanding(role: AccountRole | null | undefined) {
  return ROLES[role ?? "customer"].landing;
}

// ---------------------------------------------------------------------------
// Browser storage
// ---------------------------------------------------------------------------
const ROLE_KEY = "lumiticket.role";
const LAST_ROLE_KEY = "lumiticket.lastRole";
const DRAFT_KEY = "lumiticket.signupDraft";

export function getStoredRole(): AccountRole | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ROLE_KEY) ?? window.sessionStorage.getItem(ROLE_KEY);
  return isAccountRole(raw) ? raw : null;
}

/** Stores the role beside the session (same lifetime) and remembers it for the next sign-in. */
export function saveRole(role: AccountRole, remember = true) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_KEY);
  window.sessionStorage.removeItem(ROLE_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(ROLE_KEY, role);
  window.localStorage.setItem(LAST_ROLE_KEY, role);
}

export function clearStoredRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_KEY);
  window.sessionStorage.removeItem(ROLE_KEY);
}

export function getLastRole(): AccountRole | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_ROLE_KEY);
  return isAccountRole(raw) && raw !== "staff" ? raw : null;
}

export interface SignupDraft {
  role: AccountRole;
  businessName?: string;
}

/** Details captured at sign-up that pre-fill the business verification form. */
export function saveSignupDraft(draft: SignupDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function getSignupDraft(): SignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null");
    return parsed && isAccountRole(parsed.role) ? (parsed as SignupDraft) : null;
  } catch {
    return null;
  }
}

export function clearSignupDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

// ---------------------------------------------------------------------------
// Server-provided roles (used when the API starts returning them)
// ---------------------------------------------------------------------------
import { workspaceForBusinessType } from "@/lib/business-types";
type MaybeUser = { email?: unknown; role?: unknown; roles?: unknown; accountType?: unknown } | null | undefined;

const SERVER_ROLE_ALIASES: Record<string, AccountRole> = {
  admin: "staff",
  administrator: "staff",
  staff: "staff",
  "kyc-reviewer": "staff",
  support: "staff",
  "customer-support": "staff",
  customer: "customer",
  "bus-operator": "bus-operator",
  bus: "bus-operator",
  courier: "courier",
  "courier-operator": "courier",
  organizer: "organizer",
  "event-organizer": "organizer",
  agent: "agent",
  "retail-agent": "agent",
  "pos-agent": "agent",
  retail: "agent",
};

export function roleFromServer(user: MaybeUser): AccountRole | null {
  if (!user) return null;
  const candidates: unknown[] = [user.role, user.accountType, ...(Array.isArray(user.roles) ? user.roles : [])];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const alias = SERVER_ROLE_ALIASES[candidate.trim().toLowerCase().replace(/[_\s]+/g, "-")];
    if (alias) return alias;
  }
  return null;
}

/**
 * A specific role reported by the server wins over the one selected on the form.
 * "customer" is the default for everyone, so it never overrides a workspace choice.
 */
export function resolveRole(selected: AccountRole, user: MaybeUser): AccountRole {
  const server = roleFromServer(user);
  if (server && server !== "customer") return server;

  // The API records the selected business type on the user (business_type_id) and
  // returns it as `user.businessType` — that's the account type of record.
  const workspace = workspaceForBusinessType(businessTypeFromServer(user));
  return workspace ?? selected;
}

/** The businessType object (or bare slug) the API returns on the user record, if any. */
export function businessTypeFromServer(user: MaybeUser) {
  const value = (user as { businessType?: unknown } | null | undefined)?.businessType;
  if (typeof value === "string" && value) return { slug: value };
  if (value && typeof value === "object" && typeof (value as { slug?: unknown }).slug === "string") {
    return value as { slug: string };
  }
  return null;
}

export type StaffAccess = "granted" | "preview" | "denied";

/**
 * Staff console access. Granted when the API says the account is staff, or when
 * the email domain is on NEXT_PUBLIC_STAFF_EMAIL_DOMAINS. With neither signal
 * available the console opens in clearly-labelled preview mode.
 */
export function staffAccess(user: MaybeUser): StaffAccess {
  const server = roleFromServer(user);
  if (server === "staff") return "granted";
  if (server) return "denied";

  const domains = (process.env.NEXT_PUBLIC_STAFF_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (domains.length > 0) {
    const email = String(user?.email ?? "").toLowerCase();
    return domains.some((domain) => email.endsWith(`@${domain}`)) ? "granted" : "denied";
  }
  return "preview";
}

/** Only same-site paths are honoured for post-login redirects (blocks open redirects). */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
