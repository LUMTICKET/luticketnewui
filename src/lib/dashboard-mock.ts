// Illustrative data for dashboard areas that don't have a backing API yet
// (bus/courier/retail operations, scanning, driver, finance, system admin).
// The business profile, events, team, and audit pages in this dashboard use
// the real API instead — see src/lib/auth.ts.

export interface FleetVehicle {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: "active" | "maintenance" | "inactive";
  roadworthyExpiry: string;
}

export const fleetVehicles: FleetVehicle[] = [
  { id: "v1", plate: "BT 4521", type: "Coach (62 seats)", capacity: 62, status: "active", roadworthyExpiry: "2027-01-15" },
  { id: "v2", plate: "BT 7790", type: "Coach (48 seats)", capacity: 48, status: "active", roadworthyExpiry: "2026-11-02" },
  { id: "v3", plate: "LL 2201", type: "Minibus (30 seats)", capacity: 30, status: "maintenance", roadworthyExpiry: "2026-10-08" },
];

export interface ScheduleRow {
  id: string;
  route: string;
  vehicle: string;
  driver: string;
  departure: string;
  seatsSold: number;
  seatsTotal: number;
  status: "scheduled" | "boarding" | "departed" | "completed";
}

export const busSchedules: ScheduleRow[] = [
  { id: "s1", route: "Lilongwe → Blantyre", vehicle: "BT 4521", driver: "J. Phiri", departure: "2026-09-13 06:00", seatsSold: 54, seatsTotal: 62, status: "scheduled" },
  { id: "s2", route: "Blantyre → Mzuzu", vehicle: "BT 7790", driver: "A. Banda", departure: "2026-09-13 07:30", seatsSold: 21, seatsTotal: 48, status: "boarding" },
  { id: "s3", route: "Lilongwe → Zomba", vehicle: "LL 2201", driver: "C. Mwale", departure: "2026-09-12 14:00", seatsSold: 30, seatsTotal: 30, status: "completed" },
];

export interface ParcelJob {
  id: string;
  ref: string;
  sender: string;
  recipient: string;
  route: string;
  status: "registered" | "in-transit" | "out-for-delivery" | "delivered" | "failed";
  courier: string;
  weight: string;
}

export const parcelQueue: ParcelJob[] = [
  { id: "p1", ref: "LMT-PCL-20481", sender: "Chikondi Banda", recipient: "Grace Mvula", route: "Lilongwe → Blantyre", status: "in-transit", courier: "D. Kachala", weight: "2.4kg" },
  { id: "p2", ref: "LMT-PCL-20502", sender: "Blessings Phiri", recipient: "Thoko Jere", route: "Mzuzu → Karonga", status: "registered", courier: "Unassigned", weight: "0.8kg" },
  { id: "p3", ref: "LMT-PCL-20488", sender: "Esther Zulu", recipient: "Mphatso Nyirenda", route: "Blantyre → Zomba", status: "out-for-delivery", courier: "K. Mbewe", weight: "5.1kg" },
  { id: "p4", ref: "LMT-PCL-20470", sender: "Frank Chirwa", recipient: "Ruth Kaunda", route: "Lilongwe → Lusaka", status: "delivered", courier: "D. Kachala", weight: "1.2kg" },
];

export interface PosTransaction {
  id: string;
  time: string;
  type: "bus-ticket" | "parcel" | "event-ticket";
  reference: string;
  amount: number;
  currency: string;
  method: "cash" | "mobile-money";
}

export const posTransactions: PosTransaction[] = [
  { id: "t1", time: "09:12", type: "bus-ticket", reference: "Lilongwe → Blantyre", amount: 18000, currency: "MWK", method: "cash" },
  { id: "t2", time: "09:47", type: "parcel", reference: "LMT-PCL-20502", amount: 6500, currency: "MWK", method: "mobile-money" },
  { id: "t3", time: "10:03", type: "event-ticket", reference: "Blantyre Comedy Night", amount: 12000, currency: "MWK", method: "cash" },
  { id: "t4", time: "10:21", type: "bus-ticket", reference: "Lilongwe → Zomba", amount: 14500, currency: "MWK", method: "mobile-money" },
];

export interface ValidationLogEntry {
  id: string;
  code: string;
  kind: "ticket" | "parcel";
  result: "valid" | "invalid" | "duplicate";
  mode: "auto" | "manual";
  device: string;
  time: string;
  synced: boolean;
}

export const validationLog: ValidationLogEntry[] = [
  { id: "l1", code: "QR-88213", kind: "ticket", result: "valid", mode: "auto", device: "Scanner-04", time: "05:58", synced: true },
  { id: "l2", code: "QR-88214", kind: "ticket", result: "duplicate", mode: "auto", device: "Scanner-04", time: "05:59", synced: true },
  { id: "l3", code: "QR-91002", kind: "parcel", result: "valid", mode: "manual", device: "Scanner-01", time: "06:04", synced: false },
  { id: "l4", code: "QR-88240", kind: "ticket", result: "invalid", mode: "auto", device: "Scanner-04", time: "06:11", synced: true },
];

export interface DriverTrip {
  id: string;
  route: string;
  vehicle: string;
  departure: string;
  passengers: number;
  parcels: number;
  status: "upcoming" | "in-progress" | "completed";
}

export const driverTrips: DriverTrip[] = [
  { id: "d1", route: "Lilongwe → Blantyre", vehicle: "BT 4521", departure: "2026-09-13 06:00", passengers: 54, parcels: 6, status: "upcoming" },
  { id: "d2", route: "Blantyre → Lilongwe", vehicle: "BT 4521", departure: "2026-09-13 14:30", passengers: 0, parcels: 0, status: "upcoming" },
];

export interface SettlementRow {
  id: string;
  operator: string;
  period: string;
  gross: number;
  commission: number;
  net: number;
  currency: string;
  status: "pending" | "paid";
}

export const settlements: SettlementRow[] = [
  { id: "st1", operator: "AXA Coach", period: "1–7 Sep 2026", gross: 1240000, commission: 124000, net: 1116000, currency: "MWK", status: "paid" },
  { id: "st2", operator: "Nyasa Express", period: "1–7 Sep 2026", gross: 860000, commission: 86000, net: 774000, currency: "MWK", status: "paid" },
  { id: "st3", operator: "Munorurama Coach", period: "8–14 Sep 2026", gross: 540000, commission: 54000, net: 486000, currency: "MWK", status: "pending" },
];

export interface KycQueueItem {
  id: string;
  applicant: string;
  role: "Bus operator" | "Courier operator" | "Retail / POS agent" | "Event organizer";
  submitted: string;
  riskTier: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected" | "re-verification";
}

export const kycQueue: KycQueueItem[] = [
  { id: "k1", applicant: "Nyasa Express Ltd", role: "Bus operator", submitted: "2026-09-10", riskTier: "medium", status: "pending" },
  { id: "k2", applicant: "Zola Couriers", role: "Courier operator", submitted: "2026-09-09", riskTier: "high", status: "pending" },
  { id: "k3", applicant: "Chikondi Banda (agent)", role: "Retail / POS agent", submitted: "2026-09-08", riskTier: "high", status: "re-verification" },
  { id: "k4", applicant: "Lake of Stars Productions", role: "Event organizer", submitted: "2026-09-05", riskTier: "low", status: "approved" },
];

export interface PlatformOperator {
  id: string;
  name: string;
  type: "Bus operator" | "Courier operator" | "Retail / POS agent" | "Event organizer";
  country: string;
  commissionRate: number;
  status: "active" | "suspended";
}

export const platformOperators: PlatformOperator[] = [
  { id: "o1", name: "AXA Coach", type: "Bus operator", country: "MW", commissionRate: 10, status: "active" },
  { id: "o2", name: "Nyasa Express", type: "Bus operator", country: "MW", commissionRate: 10, status: "active" },
  { id: "o3", name: "Zola Couriers", type: "Courier operator", country: "MW", commissionRate: 12, status: "active" },
  { id: "o4", name: "Intercape Cross-Border", type: "Bus operator", country: "ZM", commissionRate: 8, status: "suspended" },
];
