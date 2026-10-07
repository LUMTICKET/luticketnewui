// Account roles and the workspace each one lands in after signing in.
//
// The workspace is resolved from the account of record: the business type
// stored on the user (`user.businessType`, the `business_types` table the API
// seeded) decides where a signed-in account lands. This is navigation, not
// authorization: every privileged action must still be enforced by the API.
// An account without a stored business type goes to the venture-selection
// screen (/onboarding/business-type) before it reaches a dashboard.
//
// Note: `user.role` from the API is the *team* role inside a business
// (owner / admin / operator / viewer) — never a workspace selector. Mapping
// it to the staff console here would hand every business admin a platform
// console, so it is deliberately ignored for routing.

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
const ROLE_KEY = "lumticket.role";
const LAST_ROLE_KEY = "lumticket.lastRole";
const DRAFT_KEY = "lumticket.signupDraft";

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
  /**
   * Individual/sole-trader vs. registered company, asked at sign-up. Pre-fills
   * the business profile (KYB) "type" field — the API's real, persisted
   * record of this. Only companies get a Team Management section; see
   * `WorkspaceShell` and `TeamPanel`.
   */
  accountType?: "individual" | "company";
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
// Account-of-record routing
// ---------------------------------------------------------------------------
import { workspaceForBusinessType } from "@/lib/business-types";
type MaybeUser = { email?: unknown; role?: unknown; roles?: unknown; accountType?: unknown } | null | undefined;

/**
 * The workspace the account itself belongs in, from the business type stored
 * on the user record. `null` means the account hasn't picked a venture yet —
 * the client should route it to /onboarding/business-type.
 */
export function resolveRole(user: MaybeUser): AccountRole | null {
  return workspaceForBusinessType(businessTypeFromServer(user));
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
 * Staff console access. Granted when the email domain is on
 * NEXT_PUBLIC_STAFF_EMAIL_DOMAINS (the API's platform roles aren't exposed on
 * /api/auth/me yet). With no domains configured the console opens in
 * clearly-labelled preview mode.
 */
export function staffAccess(user: MaybeUser): StaffAccess {
  // The API doesn't expose platform roles on /api/auth/me (they live in
  // user_platform_roles), so provisioning is recognised by email domain only;
  // with no domains configured the console opens in labelled preview mode.
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
