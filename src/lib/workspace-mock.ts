// Sample data for the role-workspace screens that have no backing API yet.
// (Business profile, events, team and audit screens use the real API — see src/lib/auth.ts.
// Older sample tables live in src/lib/dashboard-mock.ts.)

export interface BusBooking {
  id: string;
  ref: string;
  passenger: string;
  route: string;
  seats: string;
  amount: number;
  currency: string;
  channel: "online" | "pos";
  status: "confirmed" | "checked-in" | "cancelled";
}

export const busBookings: BusBooking[] = [
  { id: "b1", ref: "LMT-R1-2029", passenger: "Chikondi Banda", route: "Lilongwe → Blantyre", seats: "1A, 1B", amount: 36000, currency: "MWK", channel: "online", status: "confirmed" },
  { id: "b2", ref: "LMT-R1-2041", passenger: "Thoko Jere", route: "Lilongwe → Blantyre", seats: "4C", amount: 18000, currency: "MWK", channel: "pos", status: "checked-in" },
  { id: "b3", ref: "LMT-R2-1187", passenger: "Grace Mvula", route: "Blantyre → Mzuzu", seats: "12C", amount: 25000, currency: "MWK", channel: "online", status: "confirmed" },
  { id: "b4", ref: "LMT-R1-2050", passenger: "Frank Chirwa", route: "Lilongwe → Blantyre", seats: "9A", amount: 18000, currency: "MWK", channel: "online", status: "cancelled" },
];

export interface ComplianceItem {
  id: string;
  subject: string;
  kind: string;
  expires: string;
  /** Days until expiry as of the sample data; negative means already lapsed. */
  daysLeft: number;
}

export const busCompliance: ComplianceItem[] = [
  { id: "c1", subject: "Nyasa Express Ltd", kind: "Transport operator licence", expires: "2027-03-30", daysLeft: 187 },
  { id: "c2", subject: "BT 4521", kind: "Roadworthiness certificate", expires: "2027-01-15", daysLeft: 113 },
  { id: "c3", subject: "BT 7790", kind: "Public service vehicle insurance", expires: "2026-11-02", daysLeft: 39 },
  { id: "c4", subject: "LL 2201", kind: "Roadworthiness certificate", expires: "2026-10-08", daysLeft: 14 },
  { id: "c5", subject: "BT 4521", kind: "Public service vehicle insurance", expires: "2026-09-20", daysLeft: -4 },
];

export const courierCompliance: ComplianceItem[] = [
  { id: "cc1", subject: "Zola Couriers", kind: "MACRA courier operating licence", expires: "2027-02-01", daysLeft: 130 },
  { id: "cc2", subject: "Fleet", kind: "Goods-in-Transit insurance", expires: "2026-10-30", daysLeft: 36 },
  { id: "cc3", subject: "MZ 3310 (motorcycle)", kind: "Vehicle registration", expires: "2026-10-12", daysLeft: 18 },
  { id: "cc4", subject: "K. Mbewe", kind: "Rider's licence", expires: "2026-09-10", daysLeft: -14 },
];

export interface CourierPerson {
  id: string;
  name: string;
  zone: string;
  vehicle: string;
  activeParcels: number;
  status: "available" | "on-route" | "off-duty";
}

export const courierRoster: CourierPerson[] = [
  { id: "cp1", name: "D. Kachala", zone: "Lilongwe ↔ Blantyre", vehicle: "Van BT 1180", activeParcels: 6, status: "on-route" },
  { id: "cp2", name: "K. Mbewe", zone: "Blantyre city", vehicle: "Motorcycle MZ 3310", activeParcels: 0, status: "off-duty" },
  { id: "cp3", name: "P. Tembo", zone: "Mzuzu ↔ Karonga", vehicle: "Van MZ 7712", activeParcels: 2, status: "on-route" },
  { id: "cp4", name: "R. Nkhoma", zone: "Lilongwe city", vehicle: "Motorcycle LL 4402", activeParcels: 0, status: "available" },
];

export interface EventSalesRow {
  id: string;
  event: string;
  sold: number;
  capacity: number;
  gross: number;
  currency: string;
  checkedIn: number;
}

export const eventSales: EventSalesRow[] = [
  { id: "es1", event: "Lake of Stars Festival", sold: 412, capacity: 600, gross: 21400000, currency: "MWK", checkedIn: 0 },
  { id: "es2", event: "Blantyre Comedy Night", sold: 236, capacity: 250, gross: 3300000, currency: "MWK", checkedIn: 0 },
  { id: "es3", event: "Harare Business Summit", sold: 300, capacity: 300, gross: 27000, currency: "USD", checkedIn: 284 },
];

export const posFloat = { limit: 100000, opening: 20000, currency: "MWK" } as const;

export interface PlatformAuditEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
}

export const platformAudit: PlatformAuditEntry[] = [
  { id: "pa1", time: "2026-09-24 09:12", actor: "admin@lumina", action: "Approved KYC", target: "Lake of Stars Productions" },
  { id: "pa2", time: "2026-09-24 08:47", actor: "admin@lumina", action: "Changed commission (bus) 9% → 10%", target: "Platform default" },
  { id: "pa3", time: "2026-09-23 17:20", actor: "reviewer@lumina", action: "Requested re-verification", target: "Chikondi Banda (agent)" },
  { id: "pa4", time: "2026-09-23 15:03", actor: "admin@lumina", action: "Suspended account", target: "Intercape Cross-Border" },
  { id: "pa5", time: "2026-09-22 11:40", actor: "support@lumina", action: "Issued refund", target: "LMT-R1-2050" },
];

export const rbacPermissions = [
  "Manage commission",
  "Review KYC",
  "Manage roles",
  "View bookings",
  "Process bookings",
  "View finance",
  "Dispatch",
  "Validate tickets",
  "Sell at POS",
  "Support actions",
] as const;

export type RbacPermission = (typeof rbacPermissions)[number];

export interface RbacRole {
  name: string;
  scope: "Platform" | "Operator" | "Field";
  grants: RbacPermission[];
}

export const rbacRoles: RbacRole[] = [
  { name: "Administrator", scope: "Platform", grants: ["Manage commission", "Review KYC", "Manage roles", "View bookings", "View finance", "Support actions"] },
  { name: "KYC Reviewer", scope: "Platform", grants: ["Review KYC"] },
  { name: "Customer Support", scope: "Platform", grants: ["View bookings", "Support actions"] },
  { name: "Operations Manager", scope: "Operator", grants: ["Manage roles", "View bookings", "View finance", "Dispatch"] },
  { name: "Booking Officer", scope: "Operator", grants: ["View bookings", "Process bookings"] },
  { name: "Finance Officer", scope: "Operator", grants: ["View finance"] },
  { name: "Dispatcher", scope: "Operator", grants: ["View bookings", "Dispatch"] },
  { name: "Ticket Inspector", scope: "Field", grants: ["Validate tickets"] },
  { name: "Driver", scope: "Field", grants: ["Dispatch", "Validate tickets"] },
  { name: "Retail / POS Agent", scope: "Field", grants: ["Sell at POS", "View bookings"] },
];

export interface ReconciliationFlag {
  id: string;
  gatewayRef: string;
  amount: number;
  currency: string;
  issue: string;
  status: "auto-refunded" | "booking-completed" | "needs-review";
  when: string;
}

export const reconciliationFlags: ReconciliationFlag[] = [
  { id: "rf1", gatewayRef: "GW-88213", amount: 18000, currency: "MWK", issue: "Payment confirmed, booking record failed to write", status: "booking-completed", when: "2026-09-24 08:12" },
  { id: "rf2", gatewayRef: "GW-88240", amount: 45000, currency: "MWK", issue: "Payment confirmed, seat no longer available", status: "auto-refunded", when: "2026-09-23 19:31" },
  { id: "rf3", gatewayRef: "GW-88301", amount: 12000, currency: "MWK", issue: "Duplicate charge on retried request (idempotency key mismatch)", status: "needs-review", when: "2026-09-23 14:05" },
];

export interface SupportCase {
  id: string;
  ref: string;
  customer: string;
  subject: string;
  kind: "bus" | "event" | "parcel";
  status: "open" | "waiting" | "resolved";
  opened: string;
}

export const supportCases: SupportCase[] = [
  { id: "sc1", ref: "LMT-PCL-20481", customer: "Chikondi Banda", subject: "Parcel delayed — no scan since Lilongwe hub", kind: "parcel", status: "open", opened: "2026-09-23" },
  { id: "sc2", ref: "LMT-R1-2050", customer: "Frank Chirwa", subject: "Refund requested after cancellation", kind: "bus", status: "waiting", opened: "2026-09-22" },
  { id: "sc3", ref: "LMT-EVT-212", customer: "Grace Mvula", subject: "Ticket QR not scanning at the gate", kind: "event", status: "resolved", opened: "2026-09-19" },
];

export const commissionRules = [
  { id: "bus", service: "Bus tickets", rate: 10 },
  { id: "events", service: "Event tickets", rate: 8 },
  { id: "parcels", service: "Parcels", rate: 12 },
  { id: "agent", service: "Retail / POS agent commission", rate: 2 },
  { id: "gateway", service: "Payment gateway fee (pass-through)", rate: 2.5 },
];
