# Database Requirements — Tables Not Yet Implemented

Several UI screens ship with hardcoded sample data and no backing API. This document lists the
database tables each of those screens needs, derived directly from the mock data structures the UI
already renders, so the UI can be switched from dummy data to real data without changing its shape.

- **Mock sources:** `src/lib/data.ts`, `src/lib/dashboard-mock.ts`, `src/lib/workspace-mock.ts`, `src/lib/types.ts`
- **Already implemented (see `API.md`):** `users`, `sessions`, `refresh_tokens`, `business_types`, `business_profiles`, `payments`, `events`, `ticket_types`, `team_roles`, `team_invitations`, `team_members`, `audit_logs`

Conventions: snake_case columns, `id` bigserial primary key, `created_at` / `updated_at` timestamps
on every table, monetary amounts as integer minor units with an explicit `currency` code. Enum
values below are the exact values the UI currently renders.

---

## 1. Catalog & discovery (public, customer-facing)

### 1.1 `countries`

Rendered by the country switcher (`CountrySwitcher`), signup (`AuthForm`), footer, module search
bars, and events filtering. Source: `countries` in `src/lib/data.ts`.

| Column | Type | Notes |
| --- | --- | --- |
| code | varchar(2) PK | `MW`, `ZM`, `ZW`, `MZ`, `TZ`, `ZA`, `BW`, `NA` |
| name | text | "Malawi" |
| currency | varchar(3) | `MWK`, `ZMW`, `USD`, … |
| flag | varchar(8) | emoji or country-code key |
| live | boolean | platform launched in this country |

### 1.2 `bus_routes`

Rendered by `/bus` (search results), `/bus/[id]` (route detail + `SeatSelector`), and the homepage
`PopularRoutes` section. Source: `popularRoutes` / `BusRoute` in `src/lib/types.ts` + `src/lib/data.ts`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | the operating bus company (`operator` display name resolves through it) |
| origin / destination | text | e.g. "Lilongwe" / "Blantyre" |
| duration | interval or text | "4h 30m" |
| from_price | integer | lowest active fare, minor units |
| currency | varchar(3) | |
| departures_per_day | integer | "9 departures today" |
| rating | numeric(2,1) | operator/route rating, 0–5 |
| is_published | boolean | only published routes appear in search |

Needed alongside it: a `route_departures` / `schedule_instances` concept for `/bus/[id]`, which
currently shows a seat map with no real seat inventory (see §3.2 and §4.1).

### 1.3 Public event catalog (no new table — new query/endpoint)

`/events` and `/events/[id]` (browse, filter by country/query, ticket selector) render
`trendingEvents` / `EventListing` + `EventTicketType` from `src/lib/data.ts`. The existing
`events` + `ticket_types` tables cover the fields; what is missing is the **public** listing layer:

- `GET /api/events/catalog?country=&q=` across all business profiles, filtering to published,
  on-sale events.
- Derivable display fields: `status` (`on-sale` | `selling-fast` | `sold-out`, computed from
  `remaining` vs `capacity`), `fromPrice` (min ticket price), `venue`, `city`, `countryCode`.
- `venue` and `city` are not columns on `events` today and must be added.

### 1.4 `howItWorks`, marketing copy — **not a table**

Homepage copy in `src/lib/data.ts` is static content; keep it in code or a CMS later.

---

## 2. Customer bookings & parcels

### 2.1 `bookings` (unified customer view)

Rendered by `/bookings` and `/account` (`AccountHome`). Source: `sampleBookings` /
`CustomerBooking` in `src/lib/types.ts` + `src/lib/data.ts`. This is one screen over three
realities; implement either as one table with a `kind` discriminator, or as a read-model view over
bus bookings, event ticket orders, and parcels.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | FK → users | owner of the booking |
| kind | enum | `bus` \| `event` \| `parcel` |
| reference | text unique | `LMT-R1-2029`, `LMT-EVT-212`, `LMT-PCL-20481` |
| title / detail | text | display strings the UI shows verbatim (derive from related rows where possible) |
| scheduled_for | timestamptz | travel/event/shipment date |
| amount | integer | minor units |
| currency | varchar(3) | |
| status | enum | `upcoming` \| `completed` \| `in-transit` \| `delivered` \| `cancelled` |

### 2.2 `bus_bookings`

Rendered by the bus-operator **Bookings** panel. Source: `busBookings` in `src/lib/workspace-mock.ts`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | operator |
| reference | text unique | `LMT-R1-2029` |
| customer_name | text | passenger |
| schedule_id | FK → schedules (§3.2) | which departure |
| seats | text[] or FK rows | `["1A","1B"]` — real seat inventory belongs to §4.1 |
| amount / currency | integer / varchar(3) | |
| channel | enum | `online` \| `pos` |
| status | enum | `confirmed` \| `checked-in` \| `cancelled` |

### 2.3 `parcels` + `parcel_events`

Rendered by `/parcels` (tracking timeline — currently a hardcoded 4-stage progress bar) and the
courier **Parcel queue** panel. Source: `parcelQueue` / `ParcelJob` in `src/lib/dashboard-mock.ts`,
plus the stage list in `src/app/parcels/page.tsx`.

`parcels`:

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | courier operator |
| reference | text unique | `LMT-PCL-20481` |
| sender_name / recipient_name | text | |
| origin / destination | text | `Lilongwe → Blantyre` |
| weight_kg | numeric(6,2) | `2.4kg` |
| courier_id | FK → couriers (§5.1), nullable | "Unassigned" when null |
| status | enum | `registered` \| `in-transit` \| `out-for-delivery` \| `delivered` \| `failed` |

`parcel_events` (one row per scan/handover): `parcel_id` FK, `location` text, `status` enum,
`scanned_by`, `occurred_at`. `/parcels` renders these instead of the hardcoded `stages` array.

`/parcels/send` (`SendParcelPage`) currently generates a random reference in local state and
persists nothing — it needs a `POST` that creates a `parcels` row (base fee + per-kg pricing from
`estimateCost`).

---

## 3. Bus operator operations

### 3.1 `vehicles`

Rendered by the **Schedules & fleet** panel. Source: `fleetVehicles` / `FleetVehicle` in
`src/lib/dashboard-mock.ts`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | |
| plate | text unique per operator | `BT 4521` |
| type | text | "Coach (62 seats)" |
| capacity | integer | seats |
| status | enum | `active` \| `maintenance` \| `inactive` |
| roadworthy_expiry | date | drives expiry badges |

### 3.2 `schedules`

Rendered by the **Schedules & fleet** panel. Source: `busSchedules` / `ScheduleRow`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | |
| route_id | FK → bus_routes (§1.2) | |
| vehicle_id | FK → vehicles (§3.1) | |
| driver_id | FK → drivers (§3.3) | |
| departure_at | timestamptz | |
| seats_total | integer | |
| seats_sold | integer | derived from bus bookings; store or compute |
| status | enum | `scheduled` \| `boarding` \| `departed` \| `completed` |

### 3.3 `drivers`

Rendered by the **Dispatch & drivers** panel. Source: `driverTrips` / `DriverTrip` (drivers appear
as names like "J. Phiri" with no record of their own today).

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | |
| user_id | FK → users, nullable | when the driver has an account |
| name | text | display when no account |
| status | enum | `upcoming` \| `in-progress` \| `completed` trips are on assignments, not the driver row |

Plus `driver_assignments` (driver + vehicle + schedule + `status`
`upcoming` | `in-progress` | `completed` + passenger/parcel counts, mirroring `DriverTrip`).

---

## 4. Field operations, scanning & POS

### 4.1 `scan_events`

Rendered by all three **Scanning** panels (bus ticket scanning, delivery scanning, entry scanning —
the same `ScanPanel` component). Source: `validationLog` / `ValidationLogEntry`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | operator/scanner owner |
| code | text | scanned QR/label value (`QR-88213`, `LMT-PCL-20481`) |
| kind | enum | `ticket` \| `parcel` |
| result | enum | `valid` \| `invalid` \| `duplicate` |
| mode | enum | `auto` \| `manual` |
| device | text | `Scanner-04` |
| synced | boolean | offline-first: created offline, synced later |
| occurred_at | timestamptz | |

The scanner UI is currently local state only; it needs a `POST /api/validations` that resolves the
code against tickets/parcels and records the result (duplicate detection included).

### 4.2 `pos_transactions`

Rendered by the agent **Sell & register** and **Transactions** panels. Source: `posTransactions` /
`PosTransaction`.

| Column | Type | Notes |
| --- | --- | --- |
| agent_profile_id | FK → business_profiles | retail agent |
| occurred_at | timestamptz | |
| kind | enum | `bus-ticket` \| `parcel` \| `event-ticket` |
| reference | text | what was sold (route, parcel ref, event) |
| amount | integer | minor units |
| currency | varchar(3) | |
| method | enum | `cash` \| `mobile-money` |

### 4.3 `till_sessions` (agent float)

Rendered by the agent **Today's till** overview and **End of day** panel. Source: `posFloat`.

| Column | Type | Notes |
| --- | --- | --- |
| agent_profile_id | FK → business_profiles | |
| opened_at / closed_at | timestamptz | null while open |
| opening_float | integer | `20000` |
| limit_amount | integer | `100000` |
| currency | varchar(3) | |
| cash_sales / mobile_sales | integer | derived from `pos_transactions`, or stored at close |

---

## 5. Courier operations

### 5.1 `couriers` (riders/drivers roster)

Rendered by the courier **Couriers & dispatch** panel. Source: `courierRoster` / `CourierPerson`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | courier company |
| user_id | FK → users, nullable | |
| name | text | `D. Kachala` |
| zone | text | `Lilongwe ↔ Blantyre` |
| vehicle | text | `Van BT 1180`, `Motorcycle MZ 3310` |
| status | enum | `available` \| `on-route` \| `off-duty` |
| active_parcels | integer | derived by counting `parcels.courier_id` |

### 5.2 `compliance_documents`

Rendered by the bus-operator **Compliance** and courier **Compliance** panels. Source:
`busCompliance` / `courierCompliance` / `ComplianceItem`. `daysLeft` is computed
(`expires - today`) at read time, never stored.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | owning company |
| subject | text | company, vehicle plate, or person (`Nyasa Express Ltd`, `BT 4521`, `K. Mbewe`) |
| kind | text | "Transport operator licence", "Roadworthiness certificate", "Public service vehicle insurance", "MACRA courier operating licence", "Goods-in-Transit insurance", "Vehicle registration", "Rider's licence" |
| expires_at | date | |
| document_url | text | for uploading the actual certificate (implied by review flows) |

---

## 6. Finance & settlement

### 6.1 `settlements`

Rendered by every business role's **Finance & settlements** panel. Source: `settlements` /
`SettlementRow`.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | the settled operator |
| period_start / period_end | date | "1–7 Sep 2026" |
| gross_amount | integer | minor units |
| commission_amount | integer | |
| net_amount | integer | `gross - commission` |
| currency | varchar(3) | |
| status | enum | `pending` \| `paid` |
| paid_at | timestamptz, nullable | |

### 6.2 `commission_rules`

Rendered by the admin **Commission & settlement** panel (editable). Source: `commissionRules`.

| Column | Type | Notes |
| --- | --- | --- |
| service | enum | `bus` \| `events` \| `parcels` \| `agent` \| `gateway` |
| rate | numeric(4,2) | percent (`10`, `8`, `12`, `2`, `2.5`) |
| effective_from | timestamptz | so changes are auditable over time |

### 6.3 `reconciliation_flags`

Rendered by the admin **Payment reconciliation** panel and agent **End of day**. Source:
`reconciliationFlags` / `ReconciliationFlag`.

| Column | Type | Notes |
| --- | --- | --- |
| gateway_ref | text | `GW-88213` |
| amount / currency | integer / varchar(3) | |
| issue | text | "Payment confirmed, booking record failed to write" |
| status | enum | `auto-refunded` \| `booking-completed` \| `needs-review` |
| detected_at | timestamptz | |

---

## 7. Platform administration

### 7.1 `kyc_reviews`

Rendered by the staff **KYC review** panel. Source: `kycQueue` / `KycQueueItem`. This is the
platform-side counterpart of the existing `business_profiles` verification — likely an extension of
that table rather than a brand-new one, but it needs the extra columns.

| Column | Type | Notes |
| --- | --- | --- |
| business_profile_id | FK → business_profiles | applicant |
| submitted_at | timestamptz | |
| risk_tier | enum | `low` \| `medium` \| `high` |
| status | enum | `pending` \| `approved` \| `rejected` \| `re-verification` |
| reviewer_id | FK → users, nullable | who decided |
| decided_at | timestamptz, nullable | |

### 7.2 Operators & agents directory (extend `business_profiles`)

Rendered by the staff **Operators & agents** panel. Source: `platformOperators` /
`PlatformOperator`. Missing from the current KYB table: `country` as a filterable column,
`commission_rate` numeric, and account `status` (`active` | `suspended`). `type` exists as
business type.

### 7.3 Platform RBAC: `permissions`, `roles`, `role_permissions`

Rendered by the staff **Roles & permissions** panel. Source: `rbacRoles`, `rbacPermissions` /
`RbacRole`, `RbacPermission`. Distinct from the per-business `team_roles` table in `API.md` —
these are platform-scope roles (`scope`: `Platform` | `Operator` | `Field`).

- `permissions`: `id`, `key` unique — `manage-commission`, `review-kyc`, `manage-roles`,
  `view-bookings`, `process-bookings`, `view-finance`, `dispatch`, `validate-tickets`,
  `sell-at-pos`, `support-actions` (the `rbacPermissions` list).
- `platform_roles`: `id`, `name`, `scope` enum (`platform` | `operator` | `field`).
- `platform_role_permissions`: role ↔ permission join.

Assignment of these roles to users is not shown in the UI yet, but the panel implies it — add a
`user_platform_roles` join when that screen is built.

### 7.4 `platform_audit_log`

Rendered by the staff **Platform audit log** panel. Source: `platformAudit` /
`PlatformAuditEntry`. The existing `audit_logs` (API.md) are scoped to a business profile; these
entries (`admin@lumina` approving KYC, changing platform commission, suspending accounts) are
platform-level and include support actions like issuing refunds.

| Column | Type | Notes |
| --- | --- | --- |
| actor | text or FK → users | `admin@lumina` |
| action | text | "Approved KYC", "Changed commission (bus) 9% → 10%", "Suspended account", "Issued refund" |
| target | text | affected entity label |
| occurred_at | timestamptz | |

### 7.5 `support_cases`

Rendered by the staff **Support console** panel. Source: `supportCases` / `SupportCase`.

| Column | Type | Notes |
| --- | --- | --- |
| reference | text | booking/parcel ref the case is about (`LMT-PCL-20481`) |
| customer_name | text | |
| subject | text | |
| kind | enum | `bus` \| `event` \| `parcel` |
| status | enum | `open` \| `waiting` \| `resolved` |
| opened_at | date/timestamptz | |

---

## Source → screen mapping (summary)

| Mock export (file) | Consumed by | Required tables |
| --- | --- | --- |
| `countries` (data.ts) | CountrySwitcher, AuthForm, Footer, search bars, /events | §1.1 |
| `popularRoutes` (data.ts) | /bus, /bus/[id], home, FieldPanels | §1.2 (+ §3.2, §4.1) |
| `trendingEvents` (data.ts) | /events, /events/[id], home, FieldPanels | §1.3 (extend events) |
| `sampleBookings` (data.ts) | /bookings, /account, AdminPanels | §2.1 |
| `fleetVehicles` (dashboard-mock) | SchedulesFleetPanel | §3.1 |
| `busSchedules` (dashboard-mock) | SchedulesFleetPanel | §3.2 |
| `driverTrips` (dashboard-mock) | DriverTripsPanel | §3.3 |
| `parcelQueue` (dashboard-mock) | ParcelQueuePanel, /parcels | §2.3 |
| `posTransactions` (dashboard-mock) | PosSellPanel, TransactionsPanel | §4.2 |
| `validationLog` (dashboard-mock) | ScanPanel ×3 | §4.1 |
| `settlements` (dashboard-mock) | FinancePanel | §6.1 |
| `kycQueue` (dashboard-mock) | KycReviewPanel | §7.1 |
| `platformOperators` (dashboard-mock) | OperatorsPanel | §7.2 |
| `busBookings` (workspace-mock) | BusBookingsPanel | §2.2 |
| `busCompliance` / `courierCompliance` | Compliance panels | §5.2 |
| `courierRoster` (workspace-mock) | CourierDispatchPanel | §5.1 |
| `eventSales` (workspace-mock) | OrganizerReportsPanel | derived view over ticket orders (§2.1) |
| `posFloat` (workspace-mock) | PosSellPanel, EndOfDayPanel | §4.3 |
| `platformAudit` (workspace-mock) | PlatformAuditPanel | §7.4 |
| `rbacRoles` / `rbacPermissions` | RolesPanel | §7.3 |
| `reconciliationFlags` (workspace-mock) | PlatformReconciliationPanel | §6.3 |
| `supportCases` (workspace-mock) | SupportConsolePanel | §7.5 |
| `commissionRules` (workspace-mock) | CommissionPanel | §6.2 |
| `howItWorks` (data.ts) | HowItWorks (home) | none — static content |

## Suggested API endpoints to accompany the tables

- `GET /api/catalog/routes`, `GET /api/catalog/events` — public search (§1.2, §1.3)
- `GET/POST /api/bookings`, `GET /api/bookings/:reference` — customer bookings (§2.1)
- `POST /api/parcels`, `GET /api/parcels/:reference/tracking` — sending & tracking (§2.3)
- Operator-scoped CRUD under `/api/fleet`, `/api/schedules`, `/api/drivers`, `/api/couriers`,
  `/api/compliance` (§3, §5)
- `POST /api/validations` (offline-tolerant), `GET/POST /api/pos/transactions`,
  `POST/GET /api/pos/tills` (§4)
- `GET /api/finance/settlements`, `GET/PUT /api/admin/commission` (§6.1, §6.2)
- `GET/POST /api/admin/kyc`, `GET /api/admin/operators`, `PATCH /api/admin/operators/:id/status`,
  `GET /api/admin/reconciliation`, `GET /api/admin/platform-audit`,
  `GET/POST /api/admin/support-cases` (§7)
- RBAC: `GET /api/admin/roles`, `PUT /api/admin/roles/:name/permissions` (§7.3)
