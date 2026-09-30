// Typed client for the Lumticket operational API (catalog, bookings, parcels,
// fleet, schedules, drivers/assignments, couriers, compliance, validations,
// POS, settlements and platform administration).
//
// Shapes were verified against the deployed API:
//   GET  /api/countries                       -> { countries: [...] }
//   GET  /api/catalog/routes                  -> { routes: [...] }
//   GET  /api/catalog/events                  -> { events: [...] }
//   *    /api/bookings|parcels|fleet|schedules|drivers|assignments|couriers|
//        compliance|validations|bus-bookings  -> wrapped list envelopes
//   *    /api/admin/*                         -> wrapped list envelopes
// Mutations return the created/updated row directly; deletes return {success:true}.
// Every call goes through apiRequest/publicApiRequest so the bearer token and
// refresh handling are shared with src/lib/auth.ts.
import { apiRequest, publicApiRequest } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type Envelope = { [key: string]: unknown };

/** Pulls the list out of an API envelope ({ routes: [...] }) or passes bare arrays through. */
export function unwrapList<T>(payload: Envelope | T[] | null, key: string): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  const value = (payload as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

function envelopePayload<T>(payload: unknown, key: string): T | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  return (value ?? payload) as T;
}

// ---------------------------------------------------------------------------
// Countries + public catalog
// ---------------------------------------------------------------------------

export interface ApiCountry {
  code: string;
  name: string;
  currency: string;
  flag: string;
  live: boolean;
}

export async function listCountries() {
  return unwrapList<ApiCountry>(
    await publicApiRequest<Envelope>("/api/countries"),
    "countries",
  );
}

export interface CatalogRoute {
  id: number | string;
  origin: string;
  destination: string;
  operator: string | null;
  fromPrice: number;
  currency: string;
  duration?: string | null;
  departures?: number;
  rating?: number;
  [key: string]: unknown;
}

export async function listCatalogRoutes(params: { origin?: string; destination?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, String(value));
  const query = search.toString();
  return unwrapList<CatalogRoute>(
    await publicApiRequest<Envelope>(`/api/catalog/routes${query ? `?${query}` : ""}`),
    "routes",
  );
}

export interface CatalogEvent {
  id: number | string;
  title: string;
  subtitle?: string | null;
  category: string;
  organizer?: string | null;
  location?: string | null;
  venue?: string | null;
  city?: string | null;
  countryCode?: string | null;
  startsAt: string;
  image?: string | null;
  fromPrice: number;
  currency: string;
  status: "on-sale" | "selling-fast" | "sold-out";
  [key: string]: unknown;
}

export async function listCatalogEvents(params: { country?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, String(value));
  const query = search.toString();
  return unwrapList<CatalogEvent>(
    await publicApiRequest<Envelope>(`/api/catalog/events${query ? `?${query}` : ""}`),
    "events",
  );
}

// ---------------------------------------------------------------------------
// Customer bookings + parcels
// ---------------------------------------------------------------------------

export type BookingKind = "bus" | "event" | "parcel";

export interface ApiBooking {
  id: number | string;
  kind: BookingKind;
  reference: string;
  title: string;
  detail?: string | null;
  scheduledFor: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}

export async function listBookings() {
  return unwrapList<ApiBooking>(
    await apiRequest<Envelope>("/api/bookings"),
    "bookings",
  );
}

export function getBooking(reference: string) {
  return apiRequest<ApiBooking | null>(`/api/bookings/${encodeURIComponent(reference)}`);
}

export interface CreateBookingInput {
  kind: BookingKind;
  title: string;
  detail?: string;
  scheduledFor?: string;
  amount: number;
  currency?: string;
}

export function createBooking(payload: CreateBookingInput) {
  return apiRequest<ApiBooking>("/api/bookings", { method: "POST", body: JSON.stringify(payload) });
}

export interface ApiParcel {
  id: number | string;
  reference: string;
  senderName: string;
  recipientName: string;
  origin: string;
  destination: string;
  weightKg?: string | number | null;
  status: string;
  courierId?: number | string | null;
  courierName?: string | null;
  amount: number;
  currency: string;
  createdAt?: string;
  [key: string]: unknown;
}

export async function listParcels() {
  return unwrapList<ApiParcel>(
    await apiRequest<Envelope>("/api/parcels"),
    "parcels",
  );
}

export interface CreateParcelInput {
  senderName: string;
  recipientName: string;
  origin: string;
  destination: string;
  weightKg?: number;
  courierId?: number | string;
}

export function createParcel(payload: CreateParcelInput) {
  return apiRequest<ApiParcel>("/api/parcels", { method: "POST", body: JSON.stringify(payload) });
}

export interface ParcelTimelineEntry {
  location?: string;
  status: string;
  scannedBy?: string;
  occurredAt: string;
}

export interface ParcelTracking {
  reference: string;
  status: string;
  origin: string;
  destination: string;
  senderName?: string;
  recipientName?: string;
  weightKg?: string | null;
  currency?: string;
  amount?: number;
  timeline: ParcelTimelineEntry[];
}

/** Public tracking endpoint — recipient names are masked unless you own the parcel. */
export function getParcelTracking(reference: string) {
  return publicApiRequest<ParcelTracking>(`/api/parcels/${encodeURIComponent(reference)}/tracking`);
}

// ---------------------------------------------------------------------------
// Operator-owned operational resources
// ---------------------------------------------------------------------------

export interface FleetVehicle {
  id: number | string;
  plate: string;
  type?: string | null;
  capacity?: number | null;
  status: "active" | "maintenance" | "inactive" | string;
  roadworthyExpiry?: string | null;
  [key: string]: unknown;
}

export async function listFleet() {
  return unwrapList<FleetVehicle>(
    await apiRequest<Envelope>("/api/fleet"),
    "vehicles",
  );
}

export function createVehicle(
  payload: { plate: string; type?: string; capacity?: number; status?: string; roadworthyExpiry?: string },
) {
  return apiRequest<FleetVehicle>("/api/fleet", { method: "POST", body: JSON.stringify(payload) });
}

export function updateVehicle(id: number | string, patch: Partial<FleetVehicle>) {
  return apiRequest<FleetVehicle>(`/api/fleet?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteVehicle(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/fleet?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface Schedule {
  id: number | string;
  routeId?: number | string | null;
  origin?: string | null;
  destination?: string | null;
  vehicleId?: number | string | null;
  plate?: string | null;
  driverId?: number | string | null;
  driverName?: string | null;
  departureAt?: string | null;
  seatsTotal?: number | null;
  seatsSold?: number | null;
  status: "scheduled" | "boarding" | "departed" | "completed" | string;
  [key: string]: unknown;
}

export async function listSchedules() {
  return unwrapList<Schedule>(
    await apiRequest<Envelope>("/api/schedules"),
    "schedules",
  );
}

export function createSchedule(payload: { routeId: number | string; vehicleId?: number | string; driverId?: number | string; departureAt: string; seatsTotal?: number }) {
  return apiRequest<Schedule>("/api/schedules", { method: "POST", body: JSON.stringify(payload) });
}

export function updateSchedule(id: number | string, patch: Partial<Schedule>) {
  return apiRequest<Schedule>(`/api/schedules?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteSchedule(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/schedules?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface Driver {
  id: number | string;
  name: string;
  phone?: string | null;
  licenceNumber?: string | null;
  status: string;
  [key: string]: unknown;
}

export async function listDrivers() {
  return unwrapList<Driver>(
    await apiRequest<Envelope>("/api/drivers"),
    "drivers",
  );
}

export function createDriver(payload: { name: string; phone?: string; licenceNumber?: string; status?: string }) {
  return apiRequest<Driver>("/api/drivers", { method: "POST", body: JSON.stringify(payload) });
}

export function updateDriver(id: number | string, patch: Partial<Driver>) {
  return apiRequest<Driver>(`/api/drivers?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteDriver(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/drivers?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface DriverAssignment {
  id: number | string;
  driverId: number | string;
  driverName?: string | null;
  vehicleId?: number | string | null;
  plate?: string | null;
  scheduleId?: number | string | null;
  departureAt?: string | null;
  passengerCount?: number | null;
  parcelCount?: number | null;
  status: "upcoming" | "in-progress" | "completed" | string;
  [key: string]: unknown;
}

export async function listAssignments() {
  return unwrapList<DriverAssignment>(
    await apiRequest<Envelope>("/api/assignments"),
    "assignments",
  );
}

export function createAssignment(payload: {
  driverId: number | string;
  vehicleId?: number | string;
  scheduleId?: number | string;
  passengerCount?: number;
  parcelCount?: number;
  status?: string;
}) {
  return apiRequest<DriverAssignment>("/api/assignments", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAssignment(id: number | string, patch: Partial<DriverAssignment>) {
  return apiRequest<DriverAssignment>(`/api/assignments?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteAssignment(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/assignments?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface Courier {
  id: number | string;
  name: string;
  zone?: string | null;
  vehicle?: string | null;
  status: string;
  activeParcels?: number;
  [key: string]: unknown;
}

export async function listCouriers() {
  return unwrapList<Courier>(
    await apiRequest<Envelope>("/api/couriers"),
    "couriers",
  );
}

export function createCourier(payload: { name: string; zone?: string; vehicle?: string; status?: string }) {
  return apiRequest<Courier>("/api/couriers", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCourier(id: number | string, patch: Partial<Courier>) {
  return apiRequest<Courier>(`/api/couriers?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

/** Deleting a courier detaches their parcels rather than dropping history. */
export function deleteCourier(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/couriers?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface BusBooking {
  id: number | string;
  reference: string;
  customerName: string;
  scheduleId?: number | string | null;
  seats: string[];
  amount: number;
  currency: string;
  channel: "online" | "pos" | string;
  status: "confirmed" | "checked-in" | "cancelled" | string;
  [key: string]: unknown;
}

export async function listBusBookings() {
  return unwrapList<BusBooking>(
    await apiRequest<Envelope>("/api/bus-bookings"),
    "busBookings",
  );
}

export function createBusBooking(payload: {
  scheduleId?: number | string;
  customerName: string;
  seats: string[];
  amount: number;
  channel?: "online" | "pos";
  status?: "confirmed" | "checked-in" | "cancelled";
  currency?: string;
}) {
  return apiRequest<BusBooking>("/api/bus-bookings", { method: "POST", body: JSON.stringify(payload) });
}

export function updateBusBooking(id: number | string, patch: Partial<BusBooking>) {
  return apiRequest<BusBooking>(`/api/bus-bookings?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteBusBooking(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/bus-bookings?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

export interface ComplianceDocument {
  id: number | string;
  subject: string;
  kind: string;
  expiresAt: string;
  documentUrl?: string | null;
  daysLeft?: number;
  [key: string]: unknown;
}

export async function listCompliance() {
  return unwrapList<ComplianceDocument>(
    await apiRequest<Envelope>("/api/compliance"),
    "documents",
  );
}

export function createComplianceDocument(payload: { subject: string; kind: string; expiresAt: string; documentUrl?: string }) {
  return apiRequest<ComplianceDocument>("/api/compliance", { method: "POST", body: JSON.stringify(payload) });
}

export function updateComplianceDocument(id: number | string, patch: Partial<ComplianceDocument>) {
  return apiRequest<ComplianceDocument>(`/api/compliance?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteComplianceDocument(id: number | string) {
  return apiRequest<{ success?: boolean }>(`/api/compliance?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Scanning / validation
// ---------------------------------------------------------------------------

export interface ValidationRecord {
  id: number | string;
  code: string;
  kind: "ticket" | "parcel" | string;
  result: "valid" | "invalid" | "duplicate" | string;
  mode: "auto" | "manual" | string;
  device?: string | null;
  synced?: boolean;
  occurredAt?: string;
  [key: string]: unknown;
}

export async function listValidations() {
  return unwrapList<ValidationRecord>(
    await apiRequest<Envelope>("/api/validations"),
    "validations",
  );
}

export function resolveValidation(payload: {
  code: string;
  kind: "ticket" | "parcel";
  mode?: "auto" | "manual";
  device?: string;
  synced?: boolean;
  occurredAt?: string;
}) {
  return apiRequest<ValidationRecord>("/api/validations", { method: "POST", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// POS (retail agents)
// ---------------------------------------------------------------------------

export interface PosTransaction {
  id: number | string;
  kind: string;
  reference: string;
  amount: number;
  currency: string;
  method: string;
  occurredAt?: string;
  [key: string]: unknown;
}

export async function listPosTransactions() {
  return unwrapList<PosTransaction>(
    await apiRequest<Envelope>("/api/pos/transactions"),
    "transactions",
  );
}

export function createPosTransaction(payload: {
  kind: "bus-ticket" | "parcel" | "event-ticket";
  amount: number;
  method: "cash" | "mobile-money";
  reference?: string;
  currency?: string;
}) {
  return apiRequest<PosTransaction>("/api/pos/transactions", { method: "POST", body: JSON.stringify(payload) });
}

export interface OpenTill {
  id: number | string;
  openedAt: string;
  closedAt?: string | null;
  openingFloat: number;
  limitAmount?: number | null;
  currency: string;
  [key: string]: unknown;
}

export interface TillSummary {
  current: OpenTill | null;
  today: { cashSales: number; mobileSales: number; count: number };
  history: (OpenTill & { cashSales?: number | null; mobileSales?: number | null })[];
}

export async function getTillSummary() {
  return envelopePayload<TillSummary>(
    await apiRequest<unknown>("/api/pos/tills"),
    "till",
  ) ?? { current: null, today: { cashSales: 0, mobileSales: 0, count: 0 }, history: [] };
}

export function openTill(payload: { openingFloat: number; limitAmount?: number; currency?: string }) {
  return apiRequest<OpenTill>("/api/pos/tills", { method: "POST", body: JSON.stringify(payload) });
}

export function closeTill(id: number | string) {
  return apiRequest<OpenTill>(`/api/pos/tills?id=${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface Settlement {
  id: number | string;
  periodStart?: string;
  periodEnd?: string;
  grossAmount?: number;
  commissionAmount?: number;
  netAmount?: number;
  status: "pending" | "paid" | string;
  paidAt?: string | null;
  currency?: string;
  [key: string]: unknown;
}

export async function listSettlements(status?: "pending" | "paid") {
  const query = status ? `?status=${status}` : "";
  return unwrapList<Settlement>(
    await apiRequest<Envelope>(`/api/finance/settlements${query}`),
    "settlements",
  );
}

// ---------------------------------------------------------------------------
// Platform administration
// ---------------------------------------------------------------------------

export interface KycQueueItem {
  id: number | string;
  businessProfileId: number | string;
  businessName: string;
  country?: string;
  email?: string;
  riskTier?: "low" | "medium" | "high" | string;
  status: "pending" | "approved" | "rejected" | "re-verification" | string;
  submittedAt?: string;
  [key: string]: unknown;
}

export async function listKycQueue() {
  return unwrapList<KycQueueItem>(
    await apiRequest<Envelope>("/api/admin/kyc"),
    "kycQueue",
  );
}

export function decideKyc(id: number | string, status: "approved" | "rejected" | "re-verification", riskTier?: string) {
  return apiRequest<KycQueueItem>("/api/admin/kyc", {
    method: "POST",
    body: JSON.stringify({ id, status, ...(riskTier ? { riskTier } : {}) }),
  });
}

export interface PlatformOperator {
  id: number | string;
  businessName: string;
  email?: string;
  type?: string | null;
  ownerName?: string | null;
  country?: string;
  commissionRate?: number | null;
  isVerified?: boolean;
  accountStatus: "active" | "suspended" | string;
  createdAt?: string;
  [key: string]: unknown;
}

export async function listPlatformOperators() {
  return unwrapList<PlatformOperator>(
    await apiRequest<Envelope>("/api/admin/operators"),
    "operators",
  );
}

export function setOperatorAccountStatus(id: number | string, accountStatus: "active" | "suspended") {
  return apiRequest<PlatformOperator>(`/api/admin/operators?id=${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify({ accountStatus }),
  });
}

export interface CommissionRule {
  id: number | string;
  service: "bus" | "events" | "parcels" | "agent" | "gateway" | string;
  rate: string | number;
  effectiveFrom?: string;
  [key: string]: unknown;
}

export async function listCommissionRules() {
  return unwrapList<CommissionRule>(
    await apiRequest<Envelope>("/api/admin/commission"),
    "rules",
  );
}

export function upsertCommissionRule(service: string, rate: number) {
  return apiRequest<CommissionRule>("/api/admin/commission", {
    method: "PUT",
    body: JSON.stringify({ service, rate }),
  });
}

export interface ReconciliationFlag {
  id: number | string;
  gatewayRef: string;
  amount?: number | null;
  currency?: string;
  issue?: string | null;
  status: "auto-refunded" | "booking-completed" | "needs-review" | string;
  detectedAt?: string;
  [key: string]: unknown;
}

export async function listReconciliationFlags() {
  return unwrapList<ReconciliationFlag>(
    await apiRequest<Envelope>("/api/admin/reconciliation"),
    "flags",
  );
}

export function createReconciliationFlag(payload: { gatewayRef: string; amount?: number; currency?: string; issue?: string }) {
  return apiRequest<ReconciliationFlag>("/api/admin/reconciliation", { method: "POST", body: JSON.stringify(payload) });
}

export function resolveReconciliationFlag(
  id: number | string,
  status: "auto-refunded" | "booking-completed" | "needs-review",
) {
  return apiRequest<ReconciliationFlag>(`/api/admin/reconciliation?id=${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface PlatformAuditEntry {
  id: number | string;
  actorUserId?: number | string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: number | string | null;
  details?: unknown;
  createdAt?: string;
  [key: string]: unknown;
}

export async function listPlatformAudit() {
  return unwrapList<PlatformAuditEntry>(
    await apiRequest<Envelope>("/api/admin/platform-audit"),
    "entries",
  );
}

export interface SupportCase {
  id: number | string;
  reference?: string | null;
  customerName: string;
  subject: string;
  kind: "bus" | "event" | "parcel" | string;
  status: "open" | "waiting" | "resolved" | string;
  openedAt?: string;
  [key: string]: unknown;
}

export async function listSupportCases(status?: string, kind?: string) {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (kind) search.set("kind", kind);
  const query = search.toString();
  return unwrapList<SupportCase>(
    await apiRequest<Envelope>(`/api/admin/support-cases${query ? `?${query}` : ""}`),
    "cases",
  );
}

export function createSupportCase(payload: { customerName: string; subject: string; reference?: string; kind?: string }) {
  return apiRequest<SupportCase>("/api/admin/support-cases", { method: "POST", body: JSON.stringify(payload) });
}

export function updateSupportCaseStatus(id: number | string, status: "open" | "waiting" | "resolved") {
  return apiRequest<SupportCase>(`/api/admin/support-cases?id=${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface PlatformRole {
  id: number | string;
  name: string;
  scope: "platform" | "operator" | "field" | string;
  permissions: string[];
  [key: string]: unknown;
}

export interface AdminRolesPayload {
  roles: PlatformRole[];
  permissions: string[];
}

/** GET /api/admin/roles returns the roles plus the full permission key list. */
export async function listAdminRoles() {
  const payload = (await apiRequest<Record<string, unknown>>("/api/admin/roles")) ?? {};
  return {
    roles: unwrapList<PlatformRole>(payload, "roles"),
    permissions: unwrapList<string>(payload, "permissions"),
  };
}

export function createPlatformRole(payload: { name: string; scope: "platform" | "operator" | "field"; permissions?: string[] }) {
  return apiRequest<PlatformRole>("/api/admin/roles", { method: "POST", body: JSON.stringify(payload) });
}

export function replacePlatformRolePermissions(name: string, permissions: string[]) {
  return apiRequest<PlatformRole>(`/api/admin/roles?name=${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

// ---------------------------------------------------------------------------
// Business profile (KYB) update
// ---------------------------------------------------------------------------

export interface BusinessProfilePatch {
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  type?: string;
  website?: string;
  description?: string;
}

export function updateBusinessProfile(token: string, id: number | string, patch: BusinessProfilePatch) {
  return apiRequest<unknown>(`/api/kyb/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}
