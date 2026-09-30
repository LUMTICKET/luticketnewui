// Standard team roles and the permissions available to each.
//
// The feedback was clear: business admins should pick from Lumticket's
// predefined roles and permissions, not invent their own free-text ones. The
// API (`POST /api/team/roles`) still only stores a plain `name`, `description`
// and `permissions: string[]`, so this list is enforced here on the client —
// it's what "we create what we know for now, then refine while piloting"
// looks like until the API has its own role/permission catalog (see
// DATABASE-REQUIREMENTS.md §7.3, which is the platform-scope version of this
// same idea). "Custom role" is kept as an escape hatch because the API itself
// doesn't restrict the values yet.

export interface TeamPermission {
  key: string;
  label: string;
}

/** The full permission vocabulary a role can be built from. */
export const TEAM_PERMISSIONS: TeamPermission[] = [
  { key: "manage-business", label: "Manage business profile & settings" },
  { key: "manage-team", label: "Invite staff & manage roles" },
  { key: "manage-fleet", label: "Manage vehicles, routes & schedules" },
  { key: "manage-listings", label: "Create & edit trips/events" },
  { key: "view-bookings", label: "View bookings" },
  { key: "process-bookings", label: "Sell tickets / register bookings" },
  { key: "dispatch", label: "Assign drivers/couriers & dispatch" },
  { key: "validate-tickets", label: "Scan & validate tickets" },
  { key: "view-finance", label: "View finance & settlements" },
  { key: "manage-compliance", label: "Manage compliance documents" },
  { key: "view-reports", label: "View sales & attendance reports" },
];

export interface TeamRoleTemplate {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
}

/** Predefined roles a business admin can assign, standardized across every operator type. */
export const STANDARD_TEAM_ROLES: TeamRoleTemplate[] = [
  {
    slug: "business-admin",
    name: "Business Admin",
    description: "Full access: business settings, team, finance and all operations.",
    permissions: ["manage-business", "manage-team", "manage-fleet", "manage-listings", "view-bookings", "process-bookings", "dispatch", "validate-tickets", "view-finance", "manage-compliance", "view-reports"],
  },
  {
    slug: "operations-officer",
    name: "Operations Officer",
    description: "Runs day-to-day operations — fleet, schedules, dispatch and compliance.",
    permissions: ["manage-fleet", "manage-listings", "dispatch", "manage-compliance", "view-bookings"],
  },
  {
    slug: "booking-officer",
    name: "Booking / Ticket Officer",
    description: "Sells tickets and manages bookings at the counter or online.",
    permissions: ["view-bookings", "process-bookings"],
  },
  {
    slug: "finance-officer",
    name: "Finance Officer",
    description: "Views settlements, reconciliation and sales reports.",
    permissions: ["view-finance", "view-reports"],
  },
  {
    slug: "scanner-officer",
    name: "Scanner / Validation Officer",
    description: "Validates tickets and parcels at the gate or on delivery — no other access.",
    permissions: ["validate-tickets"],
  },
  {
    slug: "custom",
    name: "Custom role",
    description: "",
    permissions: [],
  },
];

export function permissionLabel(key: string) {
  return TEAM_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}
