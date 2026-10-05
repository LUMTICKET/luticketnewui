"use client";

import { useMemo } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLES } from "@/lib/roles";
import { workspaceHref, type WorkspaceRole } from "@/lib/workspace-nav";
import { formatPrice } from "@/lib/format";
import { Card, DemoBadge, StatCard } from "../ui";
import { useWorkspace } from "../WorkspaceContext";
import { useDashboardData } from "../useDashboardData";

interface OverviewContent {
  tagline: string;
  /** Fallback KPIs shown only when the live data can't be loaded. */
  kpis: { label: string; value: string; hint?: string }[];
  actions: { slug: string; title: string; body: string }[];
  /** Business roles: the role-specific last step of the onboarding checklist. */
  finalStep?: { slug: string; title: string; body: string };
}

const OVERVIEW: Record<WorkspaceRole, OverviewContent> = {
  "bus-operator": {
    tagline: "Publish routes and schedules, keep your fleet compliant, and watch seats sell across the region.",
    kpis: [
      { label: "Departures today", value: "6" },
      { label: "Seats sold (7 days)", value: "1,284" },
      { label: "Average occupancy", value: "78%" },
      { label: "Pending settlement", value: "MWK 486,000" },
    ],
    actions: [
      { slug: "schedules", title: "Schedules & fleet", body: "Departures, vehicles and seat-hold rules." },
      { slug: "trips/new", title: "Publish a trip", body: "List a new departure with seat classes and pricing." },
      { slug: "bookings", title: "Bookings", body: "Process bookings and cancellations." },
      { slug: "scanning", title: "Ticket scanning", body: "Validate boarding passes, online or offline." },
    ],
    finalStep: { slug: "trips/new", title: "Publish your first trip", body: "Add a route, departure time and seat classes." },
  },
  courier: {
    tagline: "Run your parcel queue, dispatch couriers, and close every delivery with a verifiable record.",
    kpis: [
      { label: "Parcels in queue", value: "14" },
      { label: "Out for delivery", value: "5" },
      { label: "Delivered today", value: "23" },
      { label: "Compliance alerts", value: "2", hint: "Renew before accounts are suspended" },
    ],
    actions: [
      { slug: "parcels", title: "Parcel queue", body: "Move parcels through each handling stage." },
      { slug: "dispatch", title: "Couriers & dispatch", body: "See who's available and assign parcels." },
      { slug: "scanning", title: "Delivery scanning", body: "Confirm handovers and deliveries." },
      { slug: "compliance", title: "Compliance", body: "Licences, registrations and insurance." },
    ],
    finalStep: { slug: "dispatch", title: "Set up couriers & dispatch", body: "Add your couriers and the zones they cover." },
  },
  organizer: {
    tagline: "Create events and ticket types, sell across the region, and validate entry at the gate.",
    kpis: [
      { label: "Live events", value: "3" },
      { label: "Tickets sold", value: "948" },
      { label: "Gross presales", value: "MWK 24.7M" },
      { label: "Check-in rate", value: "71%" },
    ],
    actions: [
      { slug: "events/new", title: "Create event", body: "Set ticket types, capacity and pricing." },
      { slug: "events", title: "My events", body: "Everything you've published." },
      { slug: "scanning", title: "Entry scanning", body: "Validate tickets at the gate." },
      { slug: "reports", title: "Sales & attendance", body: "Tickets sold against capacity." },
    ],
    finalStep: { slug: "events/new", title: "Create your first event", body: "Publish an event with its ticket types." },
  },
  agent: {
    tagline: "Sell tickets and register parcels in person, and reconcile your till at the end of every day.",
    kpis: [
      { label: "Sales today", value: "12" },
      { label: "Cash in till", value: "MWK 62,000" },
      { label: "Float used", value: "62%", hint: "Limit MWK 100,000" },
      { label: "Commission earned", value: "MWK 4,180" },
    ],
    actions: [
      { slug: "sell", title: "Sell & register", body: "Tickets and parcels for walk-in customers." },
      { slug: "transactions", title: "Transactions", body: "Today's sales by payment method." },
      { slug: "reconciliation", title: "End of day", body: "Count your till and close the day." },
      { slug: "team", title: "Team", body: "Individually attributable staff accounts." },
    ],
    finalStep: { slug: "sell", title: "Make your first sale", body: "Sell a ticket or register a parcel." },
  },
  staff: {
    tagline: "System administration and customer support for Lumina Holdings.",
    kpis: [
      { label: "KYC pending", value: "3" },
      { label: "Active merchants", value: "42" },
      { label: "Payouts pending", value: "5" },
      { label: "Reconciliation flags", value: "1", hint: "Needs review" },
    ],
    actions: [
      { slug: "kyc", title: "KYC review", body: "Approve, reject or request re-verification." },
      { slug: "operators", title: "Operators & agents", body: "Commission and account controls." },
      { slug: "support", title: "Support console", body: "Look up bookings and parcels." },
      { slug: "reconciliation", title: "Payment reconciliation", body: "Resolve payment/booking mismatches." },
    ],
  },
};

/** Human label for an audit action + resource pair. */
function auditLine(action: string, resourceType: string) {
  const resource = resourceType.replace(/-/g, " ") || "record";
  if (action === "created") return `New ${resource} published`;
  if (action === "updated") return `${resource.charAt(0).toUpperCase() + resource.slice(1)} updated`;
  if (action === "accepted") return "Invitation accepted";
  return `${action.charAt(0).toUpperCase() + action.slice(1)} · ${resource}`;
}

export function WorkspaceOverview() {
  const { role, token, user, profile, profileError, reloadProfile } = useWorkspace();
  const config = ROLES[role];
  const content = OVERVIEW[role];
  const firstName = user?.name?.split(" ")[0];

  // Live data for the signed-in business. Staff has no business profile and
  // keeps the sample KPIs until platform-wide stats exist on the API.
  const data = useDashboardData(token, profile?.id ?? null);

  // KPIs computed from the live API; falls back to the sample KPIs when the
  // account has no business profile yet.
  const kpis = useMemo(() => {
    if (!profile) return content.kpis;

    // Per-ticket sold/capacity comes from each listing's ticket rows.
    const ticketRows = Object.values(data.details).flatMap((detail) => detail.tickets ?? []);
    const sold = ticketRows.reduce((sum, t) => sum + Math.max((t.capacity ?? 0) - (t.remaining ?? 0), 0), 0);
    const capacity = ticketRows.reduce((sum, t) => sum + (t.capacity ?? 0), 0);
    const gross = ticketRows.reduce(
      (sum, t) => sum + Math.max((t.capacity ?? 0) - (t.remaining ?? 0), 0) * (t.price ?? 0),
      0,
    );
    const currency = ticketRows[0]?.currency ?? "MWK";
    const succeeded = data.payments.filter((p) => p.status === "succeeded");
    const feesTotal = succeeded.reduce((sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0), 0);
    const pendingInvites = data.invitations.filter((i) => i.status === "pending").length;

    return [
      {
        label: "Tickets sold",
        value: sold.toLocaleString(),
        hint: capacity > 0 ? `${Math.round((sold / capacity) * 100)}% of ${capacity.toLocaleString()} capacity` : "No ticket capacity yet",
      },
      {
        label: "Gross presales",
        value: gross > 0 ? formatPrice(gross, currency) : "—",
        hint: `${data.events.length} listing${data.events.length === 1 ? "" : "s"} published`,
      },
      {
        label: "Publishing fees paid",
        value: feesTotal > 0 ? formatPrice(feesTotal, currency) : "—",
        hint: `${succeeded.length} successful payment${succeeded.length === 1 ? "" : "s"}`},
      {
        label: "Team invites",
        value: `${pendingInvites} pending`,
        hint: data.invitations.length > 0 ? `${data.invitations.length} sent in total` : "No invitations yet",
      },
    ];
  }, [profile, content.kpis, data.details, data.events, data.payments, data.invitations]);

  const steps = config.business
    ? [
        {
          title: "Create your business profile",
          body: "Your legal name, contact and address — the basis for verification and payouts.",
          slug: "profile",
          done: Boolean(profile),
        },
        {
          title: "Get verified",
          body: "Our KYC team reviews your documents and approves, rejects or asks for more information.",
          slug: "profile",
          done: profile?.isVerified === true,
          waiting: Boolean(profile) && profile?.isVerified !== true,
        },
        {
          title: "Invite your team",
          body: "Every staff member gets an individually attributable account — no shared logins.",
          slug: "team",
          done: data.invitations.length > 0 || data.audit.some((entry) => entry.resourceType === "invitation"),
        },
        ...(content.finalStep ? [{ ...content.finalStep, done: data.events.length > 0 }] : []),
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl bg-navy-950 p-7 text-white sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">{config.workspace}</p>
        <h1 className="mt-2 text-3xl font-bold">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-navy-200">{content.tagline}</p>

        {config.business && profile === null && (
          <LinkButton href={workspaceHref(role, "profile")} variant="accent" size="lg" className="mt-6">
            Complete your business profile
          </LinkButton>
        )}
        {config.business && profile && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-gold-400" />
            {profile.businessName}
          </p>
        )}
        {profileError && <p role="alert" className="mt-4 text-sm text-gold-300">{profileError}</p>}
      </section>

      {config.business && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-950">Get set up</h2>
            {!profile && <DemoBadge />}
          </div>
          <ol className="mt-4 flex flex-col divide-y divide-line">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done ? "bg-success text-white" : "bg-surface-alt text-navy-950"
                  }`}
                >
                  {step.done ? "✓" : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-950">{step.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{step.body}</p>
                </div>
                {"waiting" in step && step.waiting ? (
                  <Badge tone="warning">In review</Badge>
                ) : (
                  !step.done && (
                    <Link href={workspaceHref(role, step.slug)} className="shrink-0 text-sm font-semibold text-navy-950 hover:text-gold-600">
                      Open →
                    </Link>
                  )
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-950">At a glance</h2>
          <div className="flex items-center gap-3">
            {config.business && profile && (
              <>
                {data.loading && <span className="text-xs text-ink-faint">Refreshing…</span>}
                <button
                  type="button"
                  onClick={() => {
                    data.reload();
                    void reloadProfile();
                  }}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-navy-950 transition-colors hover:bg-surface-alt"
                >
                  Refresh
                </button>
              </>
            )}
            {(!config.business || !profile) && <DemoBadge />}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
        {config.business && profile && Object.keys(data.errors).length > 0 && (
          <p role="alert" className="mt-3 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
            Some live data couldn&apos;t load ({Object.values(data.errors).join("; ")}).
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy-950">Jump in</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.actions.map((action) => (
            <Link
              key={action.slug}
              href={workspaceHref(role, action.slug)}
              className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
            >
              <p className="font-semibold text-navy-950">{action.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{action.body}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-gold-600">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      {config.business && profile && data.audit.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-950">Recent activity</h2>
            <Link href={workspaceHref(role, "audit")} className="text-sm font-semibold text-navy-950 hover:text-gold-600">
              Full audit log →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
            {data.audit.slice(-5).reverse().map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <p className="text-sm font-medium text-navy-950">
                  {auditLine(String(entry.action ?? ""), String(entry.resourceType ?? ""))}
                </p>
                <p className="text-xs text-ink-faint">
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
