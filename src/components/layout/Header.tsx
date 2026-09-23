"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ModuleNav } from "./ModuleNav";
import { CountrySwitcher } from "./CountrySwitcher";
import { LinkButton } from "@/components/ui/Button";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/#module-search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy-950 hover:bg-surface-alt"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M16 16l-3.8-3.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                {menuOpen ? (
                  <path
                    d="M3 3l12 12M15 3L3 15"
                    stroke="#0B1220"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M2 4.5h14M2 9h14M2 13.5h14"
                    stroke="#0B1220"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-surface p-4 shadow-xl">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Region
                </p>
                <div className="mt-2">
                  <CountrySwitcher />
                </div>

                <div className="mt-4 flex flex-col border-t border-line pt-4">
                  <Link
                    href="/business"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-1 py-2 text-sm font-medium text-ink hover:bg-surface-alt"
                  >
                    For business
                  </Link>
                  <Link
                    href="/team"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-1 py-2 text-sm font-medium text-ink hover:bg-surface-alt"
                  >
                    Team workspace
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-1 py-2 text-sm font-medium text-ink hover:bg-surface-alt"
                  >
                    Help centre
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-1 py-2 text-sm font-medium text-ink hover:bg-surface-alt"
                  >
                    Manage my bookings
                  </Link>
                </div>

                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  <LinkButton
                    href="/login"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </LinkButton>
                  <LinkButton
                    href="/signup"
                    variant="accent"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign up
                  </LinkButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center px-2 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3">
          <ModuleNav />
        </div>
      </div>
    </header>
  );
}
