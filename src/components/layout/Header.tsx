"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { CountrySwitcher } from "./CountrySwitcher";
import { LinkButton } from "@/components/ui/Button";

const navLinks = [
  { href: "/bus", label: "Bus tickets" },
  { href: "/events", label: "Events" },
  { href: "/parcels", label: "Parcels" },
  { href: "/business", label: "For business" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted hover:text-navy-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <CountrySwitcher />
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/signup" variant="accent" size="sm">
            Sign up
          </LinkButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {mobileOpen ? (
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
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-line py-3 text-sm font-medium text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <CountrySwitcher />
            <div className="flex gap-3">
              <LinkButton href="/login" variant="outline" size="md" className="flex-1">
                Log in
              </LinkButton>
              <LinkButton href="/signup" variant="accent" size="md" className="flex-1">
                Sign up
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
