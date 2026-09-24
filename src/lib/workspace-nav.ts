import { ROLES, type AccountRole } from "@/lib/roles";

export type WorkspaceRole = Exclude<AccountRole, "customer">;

export interface NavItem {
  /** Path below the workspace root; "" is the landing page. */
  slug: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const team: NavItem = { slug: "team", label: "Team" };
const audit: NavItem = { slug: "audit", label: "Audit log" };
const finance: NavItem = { slug: "finance", label: "Finance & settlements" };
const profile: NavItem = { slug: "profile", label: "Business profile" };

export const WORKSPACE_NAV: Record<WorkspaceRole, NavGroup[]> = {
  "bus-operator": [
    { label: "Workspace", items: [{ slug: "", label: "Overview" }, profile] },
    {
      label: "Operations",
      items: [
        { slug: "schedules", label: "Schedules & fleet" },
        { slug: "bookings", label: "Bookings" },
        { slug: "dispatch", label: "Dispatch & drivers" },
        { slug: "scanning", label: "Ticket scanning" },
        { slug: "compliance", label: "Compliance" },
      ],
    },
    {
      label: "Published trips",
      items: [
        { slug: "trips", label: "My trips" },
        { slug: "trips/new", label: "Publish a trip" },
      ],
    },
    { label: "Business", items: [finance, team, audit] },
  ],
  courier: [
    { label: "Workspace", items: [{ slug: "", label: "Overview" }, profile] },
    {
      label: "Operations",
      items: [
        { slug: "parcels", label: "Parcel queue" },
        { slug: "dispatch", label: "Couriers & dispatch" },
        { slug: "scanning", label: "Delivery scanning" },
        { slug: "compliance", label: "Compliance" },
      ],
    },
    { label: "Business", items: [finance, team, audit] },
  ],
  organizer: [
    { label: "Workspace", items: [{ slug: "", label: "Overview" }, profile] },
    {
      label: "Events",
      items: [
        { slug: "events", label: "My events" },
        { slug: "events/new", label: "Create event" },
        { slug: "scanning", label: "Entry scanning" },
        { slug: "reports", label: "Sales & attendance" },
      ],
    },
    { label: "Business", items: [finance, team, audit] },
  ],
  agent: [
    { label: "Workspace", items: [{ slug: "", label: "Today's till" }, profile] },
    {
      label: "Point of sale",
      items: [
        { slug: "sell", label: "Sell & register" },
        { slug: "transactions", label: "Transactions" },
        { slug: "reconciliation", label: "End of day" },
      ],
    },
    { label: "Business", items: [team, audit] },
  ],
  staff: [
    {
      label: "System administration",
      items: [
        { slug: "", label: "Overview" },
        { slug: "kyc", label: "KYC review" },
        { slug: "operators", label: "Operators & agents" },
        { slug: "commission", label: "Commission & settlement" },
        { slug: "roles", label: "Roles & permissions" },
        { slug: "reconciliation", label: "Payment reconciliation" },
        { slug: "audit", label: "Platform audit log" },
      ],
    },
    { label: "Support", items: [{ slug: "support", label: "Support console" }] },
  ],
};

export function workspaceHref(role: WorkspaceRole, slug: string) {
  return slug ? `${ROLES[role].landing}/${slug}` : ROLES[role].landing;
}

export function workspaceHasPage(role: WorkspaceRole, slug: string) {
  return WORKSPACE_NAV[role].some((group) => group.items.some((item) => item.slug === slug));
}

export function isWorkspaceRole(role: AccountRole | null | undefined): role is WorkspaceRole {
  return !!role && role !== "customer";
}
