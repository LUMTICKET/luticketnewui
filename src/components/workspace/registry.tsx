import type { ComponentType } from "react";
import type { WorkspaceRole } from "@/lib/workspace-nav";
import { WorkspaceOverview } from "./panels/WorkspaceOverview";
import { BusinessProfilePanel } from "./panels/ProfilePanel";
import { CreateEventPanel, EventsPanel } from "./panels/EventsPanels";
import { AuditPanel, TeamPanel } from "./panels/TeamAuditPanels";
import {
  BusBookingsPanel,
  BusCompliancePanel,
  CourierCompliancePanel,
  CourierDispatchPanel,
  DriverTripsPanel,
  ParcelQueuePanel,
  SchedulesFleetPanel,
} from "./panels/OperationsPanels";
import {
  EndOfDayPanel,
  FinancePanel,
  OrganizerReportsPanel,
  PosSellPanel,
  ScanPanel,
  TransactionsPanel,
} from "./panels/FieldPanels";
import {
  CommissionPanel,
  KycReviewPanel,
  OperatorsPanel,
  PlatformAuditPanel,
  PlatformReconciliationPanel,
  RolesPanel,
  SupportConsolePanel,
} from "./panels/AdminPanels";

const TicketScanning = () => (
  <ScanPanel
    title="Ticket scanning"
    description="Validate boarding passes at the bus door — online or offline."
    placeholder="Scan a boarding QR code, or type one — e.g. QR-88213"
  />
);

const DeliveryScanning = () => (
  <ScanPanel
    title="Delivery scanning"
    description="Scan parcel labels at handover and delivery so every parcel closes with a verifiable record."
    placeholder="Scan a parcel label, or type one — e.g. LMT-PCL-20481"
  />
);

const EntryScanning = () => (
  <ScanPanel
    title="Entry scanning"
    description="Validate tickets at the gate. Duplicates are always flagged, even during a crowd surge or a connectivity drop."
    placeholder="Scan a ticket QR code, or type one — e.g. QR-88213"
  />
);

const MyTrips = () => (
  <EventsPanel
    title="My trips"
    description="Departures you've published for customers to book."
    category="bus"
    createSlug="trips/new"
    createLabel="Publish a trip"
    emptyLabel="You haven't published any trips yet."
  />
);

const CreateTrip = () => (
  <CreateEventPanel
    title="Publish a trip"
    description="List a departure with its seat classes and pricing. Publishing is confirmed by a payment step."
    categories={["bus"]}
    submitLabel="Pay fee & publish trip"
    listSlug="trips"
  />
);

const MyEvents = () => (
  <EventsPanel
    title="My events"
    description="Events you've published for customers to buy tickets to."
    createSlug="events/new"
    createLabel="Create event"
    emptyLabel="You haven't published any events yet."
  />
);

const CreateEvent = () => (
  <CreateEventPanel
    title="Create an event"
    description="Set ticket types, capacity and pricing. Publishing is confirmed by a payment step."
    categories={["event", "tourism"]}
    submitLabel="Pay fee & publish event"
    listSlug="events"
  />
);

/** URL below each workspace root → the screen it shows. Keep in step with WORKSPACE_NAV. */
export const WORKSPACE_PAGES: Record<WorkspaceRole, Record<string, ComponentType>> = {
  "bus-operator": {
    "": WorkspaceOverview,
    profile: BusinessProfilePanel,
    schedules: SchedulesFleetPanel,
    bookings: BusBookingsPanel,
    dispatch: DriverTripsPanel,
    scanning: TicketScanning,
    compliance: BusCompliancePanel,
    trips: MyTrips,
    "trips/new": CreateTrip,
    finance: FinancePanel,
    team: TeamPanel,
    audit: AuditPanel,
  },
  courier: {
    "": WorkspaceOverview,
    profile: BusinessProfilePanel,
    parcels: ParcelQueuePanel,
    dispatch: CourierDispatchPanel,
    scanning: DeliveryScanning,
    compliance: CourierCompliancePanel,
    finance: FinancePanel,
    team: TeamPanel,
    audit: AuditPanel,
  },
  organizer: {
    "": WorkspaceOverview,
    profile: BusinessProfilePanel,
    events: MyEvents,
    "events/new": CreateEvent,
    scanning: EntryScanning,
    reports: OrganizerReportsPanel,
    finance: FinancePanel,
    team: TeamPanel,
    audit: AuditPanel,
  },
  agent: {
    "": WorkspaceOverview,
    profile: BusinessProfilePanel,
    sell: PosSellPanel,
    transactions: TransactionsPanel,
    reconciliation: EndOfDayPanel,
    team: TeamPanel,
    audit: AuditPanel,
  },
  staff: {
    "": WorkspaceOverview,
    kyc: KycReviewPanel,
    operators: OperatorsPanel,
    commission: CommissionPanel,
    roles: RolesPanel,
    reconciliation: PlatformReconciliationPanel,
    audit: PlatformAuditPanel,
    support: SupportConsolePanel,
  },
};
