"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  ApiError,
  clearAuthSession,
  getAuthSession,
  getCurrentUser,
  logoutSession,
  type AuthUser,
} from "@/lib/auth";
import { ROLES, businessTypeFromServer, getStoredRole, roleLanding, saveRole, type AccountRole } from "@/lib/roles";
import { workspaceForBusinessType } from "@/lib/business-types";
import { sampleBookings } from "@/lib/data";
import { formatPrice } from "@/lib/format";

const quickActions = [
  { href: "/", title: "Book a bus", body: "Search routes and pick your seat." },
  { href: "/events", title: "Find events", body: "Concerts, festivals and conferences." },
  { href: "/parcels/send", title: "Send a parcel", body: "Get a quote and a QR label." },
  { href: "/parcels", title: "Track a parcel", body: "Follow it to the doorstep." },
];

const statusTone = {
  upcoming: "warning",
  completed: "neutral",
  "in-transit": "warning",
  delivered: "success",
  cancelled: "error",
} as const;

/** Display name for the stored business type; falls back to prettified slug. */
function typeDisplayName(slug: string, user: AuthUser | null) {
  const stored = user?.businessType as { name?: string } | null | undefined;
  return stored?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AccountHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [homeRole, setHomeRole] = useState<AccountRole>("customer");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const session = getAuthSession();
    if (!session) {
      router.replace("/login?role=customer&next=%2Faccount");
      return;
    }

    (async () => {
      let me: AuthUser | null = null;
      try {
        me = await getCurrentUser(session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          router.replace("/login?role=customer&next=%2Faccount");
          return;
        }
      }
      if (cancelled) return;

      const stored = getStoredRole();
      if (!stored) saveRole("customer", true);
      setHomeRole(stored ?? "customer");
      setUser(me);
      setReady(true);

      // Keep the workspace banner driven by the account of record: the business
      // type stored on the user (users.business_type_id) wins over the last-used
      // role in localStorage when the two disagree.
      if (me) {
        const serverWorkspace = workspaceForBusinessType(businessTypeFromServer(me));
        if (serverWorkspace && serverWorkspace !== (stored ?? "customer")) {
          saveRole(serverWorkspace, true);
          setHomeRole(serverWorkspace);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    setSigningOut(true);
    const session = getAuthSession();
    if (session) await logoutSession(session.token);
    clearAuthSession();
    router.replace("/");
    router.refresh();
  }

  if (!ready) {
    return <p className="px-4 py-24 text-center text-sm text-ink-muted">Loading your account…</p>;
  }

  const firstName = user?.name?.split(" ")[0];
  const otherWorkspace = homeRole !== "customer" ? ROLES[homeRole] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-navy-950 p-7 text-white sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">My account</p>
        <h1 className="mt-2 text-3xl font-bold">Hi{firstName ? `, ${firstName}` : ""}</h1>
        {user?.email && <p className="mt-2 text-navy-200">{user.email}</p>}
        {(() => {
          const linkedType = businessTypeFromServer(user);
          if (!linkedType) return null;
          return (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              Business: {typeDisplayName(linkedType.slug, user)}
            </p>
          );
        })()}
      </section>

      {otherWorkspace && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-surface-alt p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-muted">
            You&apos;re signed in as <strong className="text-navy-950">{otherWorkspace.label}</strong>. Your{" "}
            {otherWorkspace.workspace.toLowerCase()} is where you manage your business.
          </p>
          <LinkButton href={roleLanding(homeRole)} variant="primary" size="sm" className="shrink-0">
            Open {otherWorkspace.workspace.toLowerCase()}
          </LinkButton>
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold text-navy-950">What would you like to do?</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
          >
            <p className="font-semibold text-navy-950">{action.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{action.body}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-gold-600">Go →</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy-950">Recent bookings</h2>
        <Link href="/bookings" className="text-sm font-semibold text-navy-950 hover:text-gold-600">
          View all →
        </Link>
      </div>
      <p className="mt-1 text-xs text-ink-faint">Example bookings shown for preview.</p>
      <ul className="mt-3 flex flex-col gap-3">
        {sampleBookings.slice(0, 3).map((booking) => (
          <li key={booking.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-navy-950">{booking.title}</p>
              <p className="text-sm text-ink-muted">{booking.detail} · {booking.reference}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={statusTone[booking.status]}>{booking.status.replace("-", " ")}</Badge>
              <span className="text-sm font-semibold text-navy-950">{formatPrice(booking.amount, booking.currency)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-navy-950">Run a business on Lumiticket?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Bus operators, couriers, event organizers and retail agents each get their own workspace.
          </p>
        </div>
        <LinkButton href="/business" variant="accent" size="md" className="shrink-0">
          For business
        </LinkButton>
      </div>

      <div className="mt-8">
        <Button type="button" variant="outline" size="md" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
