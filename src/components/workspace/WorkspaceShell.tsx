"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo, LogoMark } from "@/components/layout/Logo";
import { RoleIcon } from "@/components/auth/RoleSelector";
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
import { ROLES, getStoredRole, roleLanding, saveRole, staffAccess, type AccountRole } from "@/lib/roles";
import { WORKSPACE_NAV, workspaceHref, type WorkspaceRole } from "@/lib/workspace-nav";
import { WorkspaceContext } from "./WorkspaceContext";

type ShellState = "checking" | "ready" | "wrong-role" | "denied";

function loginUrl(role: WorkspaceRole) {
  const next = encodeURIComponent(window.location.pathname);
  return role === "staff" ? `/login?portal=staff&next=${next}` : `/login?role=${role}&next=${next}`;
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

  const groups = WORKSPACE_NAV[role];
  const items = groups.flatMap((group) => group.items.map((item) => ({ ...item, href: workspaceHref(role, item.slug) })));
  // The most specific matching item wins, so /events/new highlights "Create event" but not "My events".
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const displayName = user?.name || user?.email || config.label;

  return (
    <WorkspaceContext.Provider value={{ role, token, user, profile, profileError, reloadProfile, staffPreview }}>
      <div className="min-h-screen lg:flex">
        <aside className="hidden w-64 shrink-0 bg-navy-950 text-navy-100 lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="px-5 py-5">
              <Link href={config.landing} aria-label={`${config.workspace} home`}>
                <Logo tone="light" />
              </Link>
            </div>

            <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-950">
                <RoleIcon role={role} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-400">Workspace</p>
                <p className="truncate text-sm font-semibold text-white">{config.workspace}</p>
              </div>
            </div>

            <nav aria-label={`${config.workspace} navigation`} className="flex-1 overflow-y-auto px-3 pb-4">
              {groups.map((group) => (
                <div key={group.label} className="mt-4 first:mt-0">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-navy-300">{group.label}</p>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const href = workspaceHref(role, item.slug);
                      const active = href === activeHref;
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_var(--color-gold-500)]"
                              : "text-navy-200 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex flex-col gap-1.5 border-t border-white/10 px-6 py-4 text-xs">
              <Link href="/" className="text-navy-200 hover:text-white">
                ← Lumiticket public site
              </Link>
              <Link href="/help" className="text-navy-200 hover:text-white">
                Help centre
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <Link href={config.landing} className="lg:hidden" aria-label={`${config.workspace} home`}>
              <Logo markSize={26} />
            </Link>
            <p className="hidden text-sm font-semibold text-navy-950 lg:block">{config.workspace}</p>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[16rem] truncate text-sm font-medium text-navy-950">{displayName}</p>
                <p className="text-xs text-ink-faint">{config.label}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
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
                    : "bg-surface-alt text-ink-muted hover:text-navy-950"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {staffPreview && (
              <p role="note" className="mb-6 rounded-xl bg-warning-surface px-4 py-3 text-sm text-warning">
                <strong>Preview access.</strong> The API doesn&apos;t report staff roles yet, so this console is open to
                any staff-portal sign-in. Enforce staff provisioning on the API (or set
                NEXT_PUBLIC_STAFF_EMAIL_DOMAINS) before go-live.
              </p>
            )}
            {children}
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
