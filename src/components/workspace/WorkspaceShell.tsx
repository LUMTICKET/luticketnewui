"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo, LogoMark } from "@/components/layout/Logo";
import {
  ApiError,
  clearAuthSession,
  getAuthSession,
  getBusinessProfile,
  getCurrentUser,
  logoutSession,
  type AuthUser,
  type BusinessProfile,
} from "@/lib/auth";
import { ROLES, getStoredRole, resolveRole, roleLanding, saveRole, staffAccess, type AccountRole } from "@/lib/roles";
import { WORKSPACE_NAV, workspaceHref, type WorkspaceRole } from "@/lib/workspace-nav";
import { WorkspaceContext } from "./WorkspaceContext";
import { NavIcon } from "./NavIcon";

/** The one action a role most often starts from; shown as the pill at the top of the sidebar. */
const PRIMARY_ACTION: Record<WorkspaceRole, { slug: string; label: string }> = {
  "bus-operator": { slug: "trips/new", label: "Publish a trip" },
  courier: { slug: "parcels", label: "Open parcel queue" },
  organizer: { slug: "events/new", label: "Create event" },
  agent: { slug: "sell", label: "New sale" },
  staff: { slug: "kyc", label: "Review KYC" },
};

type ShellState = "checking" | "ready" | "wrong-role" | "denied";

function loginUrl(role: WorkspaceRole) {
  const next = encodeURIComponent(window.location.pathname);
  return role === "staff" ? `/login?portal=staff&next=${next}` : `/login?next=${next}`;
}

export function WorkspaceShell({ role, children }: { role: WorkspaceRole; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const config = ROLES[role];

  const [state, setState] = useState<ShellState>("checking");
  const [otherRole, setOtherRole] = useState<AccountRole | null>(null);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [staffPreview, setStaffPreview] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null | undefined>(config.business ? undefined : null);
  const [profileError, setProfileError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const session = getAuthSession();
    if (!session) {
      router.replace(loginUrl(role));
      return;
    }

    const stored = getStoredRole();
    if (stored && stored !== role) {
      // The remembered role lives in localStorage, so it can only be compared after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOtherRole(stored);
      setState("wrong-role");
      return;
    }

    (async () => {
      let me: AuthUser | null = null;
      try {
        me = await getCurrentUser(session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          router.replace(loginUrl(role));
          return;
        }
      }
      if (cancelled) return;

      if (role === "staff") {
        const access = staffAccess(me);
        if (access === "denied") {
          setState("denied");
          return;
        }
        setStaffPreview(access === "preview");
      }

      if (!stored) saveRole(role, true);
      setToken(session.token);
      setUser(me);
      setState("ready");

      // The account's stored businessType is the source of truth: a user who
      // signed up as an event organizer but landed here via /bus-operator is
      // redirected to their own dashboard instead of seeing the wrong workspace.
      if (me && role !== "staff") {
        const homeRole = resolveRole(me);
        // null = the account hasn't picked a venture yet — send it to venture
        // selection instead of letting it into a workspace it didn't choose.
        if (homeRole !== role) {
          if (homeRole) saveRole(homeRole, true);
          router.replace(homeRole ? roleLanding(homeRole) : "/onboarding/business-type");
          return;
        }
      }

      if (ROLES[role].business) {
        try {
          const loaded = await getBusinessProfile(session.token);
          if (!cancelled) setProfile(loaded);
        } catch (error) {
          if (!cancelled) setProfileError(error instanceof Error ? error.message : "Could not load your business profile.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role, router]);

  const reloadProfile = useCallback(async () => {
    if (!ROLES[role].business) return;
    try {
      setProfileError("");
      setProfile(await getBusinessProfile(getAuthSession()?.token ?? ""));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not load your business profile.");
    }
  }, [role]);

  async function signOut() {
    setSigningOut(true);
    const session = getAuthSession();
    if (session) await logoutSession(session.token);
    clearAuthSession();
    router.replace("/");
    router.refresh();
  }

  function switchToThisWorkspace() {
    saveRole(role, true);
    setState("checking");
    window.location.reload();
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <LogoMark size={48} className="animate-pulse" />
        <p className="text-sm text-ink-muted">Opening your workspace…</p>
      </div>
    );
  }

  if (state === "wrong-role") {
    const mine = otherRole ? ROLES[otherRole] : null;
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <LogoMark size={44} />
        <h1 className="mt-5 text-2xl font-bold text-navy-950">This is the {config.workspace}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You&apos;re signed in as <strong className="text-navy-950">{mine?.label}</strong>, so this workspace
          isn&apos;t your home.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {mine && (
            <Link
              href={roleLanding(otherRole)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-navy-950 px-6 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Go to my {mine.workspace.toLowerCase()}
            </Link>
          )}
          {role === "staff" ? (
            <Link
              href="/login?portal=staff"
              className="inline-flex h-12 items-center justify-center rounded-full border border-navy-950 px-6 text-sm font-semibold text-navy-950 hover:bg-navy-950 hover:text-white"
            >
              Staff sign-in
            </Link>
          ) : (
            <Button type="button" variant="outline" size="lg" onClick={switchToThisWorkspace}>
              Open the {config.label.toLowerCase()} workspace instead
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <LogoMark size={44} />
        <h1 className="mt-5 text-2xl font-bold text-navy-950">Staff access required</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This account isn&apos;t provisioned for the Lumina staff console. Ask an administrator to enable it,
          or sign in with a staff account.
        </p>
        <Button type="button" variant="outline" size="lg" className="mt-6" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    );
  }

  // Individuals/sole traders can't invite staff (see TeamPanel) — hide the
  // nav entry rather than showing a page that immediately turns them away.
  const isIndividual = ROLES[role].business && profile?.type === "individual";
  const groups = WORKSPACE_NAV[role]
    .map((group) => ({ ...group, items: group.items.filter((item) => !(isIndividual && item.slug === "team")) }))
    .filter((group) => group.items.length > 0);
  const items = groups.flatMap((group) => group.items.map((item) => ({ ...item, href: workspaceHref(role, item.slug) })));
  // The most specific matching item wins, so /events/new highlights "Create event" but not "My events".
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const displayName = user?.name || user?.email || config.label;

  const primary = PRIMARY_ACTION[role];
  const profileStatus = !config.business
    ? null
    : !profile
      ? { label: "Profile not set up", pct: 12 }
      : profile.isVerified === true
        ? { label: "Verified business", pct: 100 }
        : { label: "Verification in review", pct: 60 };

  function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit = items.find((item) => item.label.toLowerCase().includes(q));
    if (hit) {
      router.push(hit.href);
      setQuery("");
    }
  }

  const auditItem = items.find((item) => item.href.endsWith("/audit"));
  const profileItem = items.find((item) => item.href.endsWith("/profile"));
  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-full text-navy-950 transition-colors hover:bg-navy-50";

  return (
    <WorkspaceContext.Provider value={{ role, token, user, profile, profileError, reloadProfile, staffPreview }}>
      <div className="workspace-shell min-h-screen bg-surface lg:h-dvh lg:min-h-0 lg:overflow-hidden">
        <div className="flex min-h-screen flex-col bg-surface lg:h-full lg:min-h-0 lg:overflow-hidden">
          {/* top bar */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-surface/95 px-4 backdrop-blur sm:px-6 lg:static lg:h-24 lg:gap-0 lg:px-0 lg:backdrop-blur-none">
            <div
              className={`flex shrink-0 items-center justify-between lg:px-2 ${
                sidebarCollapsed ? "lg:w-20" : "lg:w-72 lg:px-9"
              }`}
            >
              <Link href={config.landing} aria-label={`${config.workspace} home`}>
                {sidebarCollapsed ? <LogoMark size={26} /> : <Logo markSize={30} />}
              </Link>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!sidebarCollapsed}
                aria-controls="workspace-sidebar"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden h-8 w-8 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-50 lg:flex"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {sidebarCollapsed ? (
                    <>
                      <path d="M9 5l7 7-7 7" />
                      <path d="M4 5v14" />
                    </>
                  ) : (
                    <>
                      <path d="M15 5l-7 7 7 7" />
                      <path d="M20 5v14" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            <form onSubmit={runSearch} role="search" className="relative ml-auto hidden max-w-md flex-1 md:block lg:ml-0">
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4 4" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search workspace pages"
                placeholder="Jump to a page…"
                className="h-11 w-full rounded-full bg-navy-50 pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </form>

            <div className="ml-auto flex items-center gap-1 lg:pr-9">
              {auditItem && (
                <Link href={auditItem.href} aria-label="Activity" title="Activity" className={iconBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16zM10 20a2 2 0 004 0" />
                  </svg>
                </Link>
              )}
              <Link href="/help" aria-label="Help centre" title="Help centre" className={iconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1-1.6 2M12 16.8h.01" />
                </svg>
              </Link>
              {profileItem && (
                <Link href={profileItem.href} aria-label="Business profile" title="Business profile" className={iconBtn}>
                  <NavIcon slug="profile" size={20} />
                </Link>
              )}
              <div className="ml-3 flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="max-w-[12rem] truncate text-sm font-medium text-navy-950">{displayName}</p>
                  <p className="text-xs text-ink-faint">{config.label}</p>
                </div>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 text-sm font-semibold text-white"
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={signingOut}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-navy-50 hover:text-navy-950 disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </header>

          <nav
            aria-label={`${config.workspace} sections`}
            className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2.5 lg:hidden"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.href === activeHref ? "page" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  item.href === activeHref
                    ? "bg-navy-950 text-white"
                    : "bg-navy-50 text-ink-muted hover:text-navy-950"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex min-h-0 flex-1">
            {/* sidebar */}
            <aside
              id="workspace-sidebar"
              className={`hidden shrink-0 flex-col overflow-hidden rounded-tr-[3rem] bg-navy-950 text-navy-100 transition-[width] duration-200 lg:flex ${
                sidebarCollapsed ? "w-20" : "w-72"
              }`}
            >
              <div className={`pb-2 pt-9 ${sidebarCollapsed ? "px-4" : "px-8"}`}>
                <Link
                  href={workspaceHref(role, primary.slug)}
                  aria-label={sidebarCollapsed ? primary.label : undefined}
                  title={sidebarCollapsed ? primary.label : undefined}
                  className={`flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-100 ${
                    sidebarCollapsed ? "" : "px-2"
                  }`}
                >
                  {sidebarCollapsed ? <NavIcon slug={primary.slug} size={20} /> : primary.label}
                </Link>
              </div>

              <nav
                aria-label={`${config.workspace} navigation`}
                className={`workspace-scrollbar workspace-scrollbar-dark min-h-0 flex-1 overflow-y-auto pb-4 pt-4 ${
                  sidebarCollapsed ? "px-2" : "px-5"
                }`}
              >
                {groups.map((group) => (
                  <div key={group.label} className="mt-5 first:mt-0">
                    <p className={`px-3 text-xs text-navy-300 ${sidebarCollapsed ? "sr-only" : ""}`}>
                      {group.label}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const href = workspaceHref(role, item.slug);
                        const active = href === activeHref;
                        return (
                          <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            aria-label={sidebarCollapsed ? item.label : undefined}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={`flex items-center rounded-xl py-2.5 text-sm transition-colors ${
                              sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"
                            } ${
                              active
                                ? "bg-white/15 font-semibold text-white"
                                : "font-medium text-navy-200 hover:bg-white/8 hover:text-white"
                            }`}
                          >
                            <span className={active ? "text-gold-400" : "text-navy-300"}>
                              <NavIcon slug={item.slug} />
                            </span>
                            <span className={sidebarCollapsed ? "sr-only" : ""}>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div
                className={`border-t border-white/10 py-5 text-xs ${
                  sidebarCollapsed ? "hidden" : "px-8"
                }`}
              >
                {profileStatus && (
                  <div className="mb-4">
                    <p className="font-semibold text-white">Account status</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15" role="presentation">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${profileStatus.pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-navy-200">{profileStatus.label}</p>
                  </div>
                )}
                {user?.businessId && (
                  <p className="mb-3 truncate text-navy-200">
                    Business ID <span className="font-mono font-semibold text-white">{user.businessId}</span>
                  </p>
                )}
                <Link href="/" className="font-semibold text-white hover:text-gold-300">
                  Lumticket public site ↗
                </Link>
              </div>
            </aside>

            <main className="workspace-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-8 sm:px-6 lg:px-12">
              <div className="w-full">
                {staffPreview && (
                  <p role="note" className="mb-6 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
                    <strong>Preview access.</strong> The API doesn&apos;t report staff roles yet, so this console is open to
                    any staff-portal sign-in. Enforce staff provisioning on the API (or set
                    NEXT_PUBLIC_STAFF_EMAIL_DOMAINS) before go-live.
                  </p>
                )}
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
