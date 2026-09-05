"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  { key: "bus", label: "Bus", href: "/" },
  { key: "events", label: "Events", href: "/events" },
  { key: "parcel", label: "Parcel", href: "/parcels" },
] as const;

function isActive(pathname: string, key: (typeof modules)[number]["key"]) {
  if (key === "bus") return pathname === "/" || pathname.startsWith("/bus");
  if (key === "events") return pathname.startsWith("/events");
  return pathname.startsWith("/parcels");
}

export function ModuleNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Modules"
      className={`flex items-center gap-1.5 sm:gap-2 ${className}`}
    >
      {modules.map((m) => {
        const active = isActive(pathname, m.key);
        return (
          <Link
            key={m.key}
            href={m.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-base lg:px-6 lg:py-3 lg:text-base ${
              active
                ? "bg-navy-950 text-white"
                : "text-ink-muted hover:bg-surface-alt hover:text-navy-950"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
