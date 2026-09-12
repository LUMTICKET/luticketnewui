"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { countries } from "@/lib/data";
import {
  clearAuthSession,
  createBusinessProfile,
  getAuthSession,
  getBusinessProfile,
  getCurrentUser,
  listEvents,
  logoutSession,
  type AuthUser,
  type BusinessProfile,
  type EventSummary,
} from "@/lib/auth";

type LoadState = "loading" | "ready" | "error";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const currentUser = await getCurrentUser(session.token);
        if (!currentUser) throw new Error("Session expired.");
        if (cancelled) return;
        setToken(session.token);
        setUser(currentUser);

        const businessProfile = await getBusinessProfile(session.token);
        if (cancelled) return;
        setProfile(businessProfile);

        if (businessProfile) {
          const businessEvents = await listEvents(session.token, businessProfile.id);
          if (cancelled) return;
          setEvents(businessEvents);
        }

        setState("ready");
      } catch (loadError) {
        if (cancelled) return;
        clearAuthSession();
        router.replace("/login");
        void loadError;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    if (token) await logoutSession(token);
    clearAuthSession();
    router.push("/");
    router.refresh();
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);

    try {
      const created = await createBusinessProfile(token, {
        businessName: String(formData.get("businessName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        address: String(formData.get("address") || ""),
        city: String(formData.get("city") || ""),
        country: String(formData.get("country") || ""),
        type: String(formData.get("type") || "individual"),
        website: String(formData.get("website") || ""),
        description: String(formData.get("description") || ""),
      });
      setProfile(created);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create your business profile.",
      );
    }
  }

  if (state === "loading") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <p className="text-sm text-ink-muted">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Business dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy-950">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{user?.email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>

      {!profile ? (
        <div className="mt-8 rounded-2xl border border-line p-6">
          <h2 className="text-lg font-bold text-navy-950">
            Complete your business verification (KYB)
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Create your business profile to start onboarding as a bus operator,
            courier, event organizer, or retail agent.
          </p>

          <form
            onSubmit={handleCreateProfile}
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="businessName" className="text-sm font-medium text-ink">
                Business name
              </label>
              <input
                id="businessName"
                name="businessName"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="Nyasa Express Ltd"
              />
            </div>

            <div>
              <label htmlFor="type" className="text-sm font-medium text-ink">
                Business type
              </label>
              <select
                id="type"
                name="type"
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400"
                defaultValue="individual"
              >
                <option value="individual">Individual</option>
                <option value="company">Registered company</option>
              </select>
            </div>

            <div>
              <label htmlFor="business-email" className="text-sm font-medium text-ink">
                Business email
              </label>
              <input
                id="business-email"
                name="email"
                type="email"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="business@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="+265 999 000 000"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium text-ink">
                Address
              </label>
              <input
                id="address"
                name="address"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label htmlFor="city" className="text-sm font-medium text-ink">
                City
              </label>
              <input
                id="city"
                name="city"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="Lilongwe"
              />
            </div>

            <div>
              <label htmlFor="profile-country" className="text-sm font-medium text-ink">
                Country
              </label>
              <select
                id="profile-country"
                name="country"
                required
                className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm focus:border-navy-400"
                defaultValue={countries[0].code}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="website" className="text-sm font-medium text-ink">
                Website (optional)
              </label>
              <input
                id="website"
                name="website"
                className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
                placeholder="https://example.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-ink">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-navy-400"
                placeholder="What does your business do?"
              />
            </div>

            {error && (
              <p role="alert" className="sm:col-span-2 rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" size="lg" className="sm:col-span-2">
              Create business profile
            </Button>
          </form>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-950">{profile.businessName}</h2>
              <Badge tone="success">Profile created</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Type</dt>
                <dd className="text-ink">{profile.type || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Email</dt>
                <dd className="text-ink">{profile.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Phone</dt>
                <dd className="text-ink">{profile.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Location</dt>
                <dd className="text-ink">
                  {profile.city}, {profile.country}
                </dd>
              </div>
              {profile.website && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Website</dt>
                  <dd className="truncate text-ink">{profile.website}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-dashed border-line p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Team
                </p>
                <p className="mt-1 text-xs text-ink-muted">Coming soon</p>
              </div>
              <div className="rounded-xl border border-dashed border-line p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Audit log
                </p>
                <p className="mt-1 text-xs text-ink-muted">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-950">Your events</h2>
              <Badge tone="neutral">{events.length}</Badge>
            </div>

            {events.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                No events yet. Publishing an event requires a completed payment
                step — this flow is wired up in the API but not yet built into
                this dashboard.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-line p-4"
                  >
                    <p className="font-semibold text-navy-950">{e.title}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {e.category} · {e.location}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">{e.startsAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
