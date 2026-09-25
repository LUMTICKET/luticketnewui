import { useCallback, useEffect, useState } from "react";
import {
  getEvent,
  listAuditLog,
  listEvents,
  listPayments,
  listTeamInvitations,
  type AuditEntry,
  type EventDetail,
  type EventSummary,
  type PaymentRecord,
  type TeamInvitation,
} from "@/lib/auth";

export type DashboardSource = "events" | "payments" | "invitations" | "audit";

export interface DashboardData {
  loading: boolean;
  events: EventSummary[];
  /** Full listing detail (with ticket types) per published event id. */
  details: Record<string, EventDetail>;
  payments: PaymentRecord[];
  invitations: TeamInvitation[];
  audit: AuditEntry[];
  /** One message per source that failed; sources fail independently. */
  errors: Partial<Record<DashboardSource, string>>;
  reload: () => void;
}

type Result<T> = { key: DashboardSource; value: T[]; error?: string };

/**
 * Loads every dashboard data source for a business profile in parallel. A
 * failing endpoint degrades to an empty list plus an error message instead of
 * blanking the whole dashboard.
 */
export function useDashboardData(
  token: string,
  businessProfileId: number | string | null | undefined,
): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, "loading" | "reload">>({
    events: [],
    details: {},
    payments: [],
    invitations: [],
    audit: [],
    errors: {},
  });
  const [loading, setLoading] = useState(Boolean(businessProfileId));
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!businessProfileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    async function pick<T>(key: DashboardSource, load: () => Promise<T[]>): Promise<Result<T>> {
      try {
        return { key, value: await load() };
      } catch (error) {
        return { key, value: [], error: error instanceof Error ? error.message : "Request failed." };
      }
    }

    (async () => {
      const results = await Promise.all([
        pick("events", () => listEvents(token, businessProfileId as number | string)),
        pick("payments", () => listPayments(token, businessProfileId as number | string)),
        pick("invitations", () => listTeamInvitations(token, businessProfileId as number | string)),
        pick("audit", () => listAuditLog(token, businessProfileId as number | string)),
      ]);
      if (cancelled) return;

      const [events, payments, invitations, audit] = results;

      // The list endpoint omits ticket types; fetch each listing's detail in
      // parallel so sold/capacity KPIs come from the real remaining counts.
      const details: Record<string, EventDetail> = {};
      await Promise.all(
        events.value.map(async (event) => {
          try {
            const detail = await getEvent(token, event.id);
            if (detail && !cancelled) details[String(event.id)] = detail;
          } catch {
            // A missing detail shouldn't blank the dashboard.
          }
        }),
      );
      if (cancelled) return;

      setData({
        events: events.value,
        details,
        payments: payments.value,
        invitations: invitations.value,
        audit: audit.value,
        errors: Object.fromEntries(
          results.filter((r) => r.error).map((r) => [r.key, r.error]),
        ),
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, businessProfileId, nonce]);

  return { ...data, loading, reload };
}
