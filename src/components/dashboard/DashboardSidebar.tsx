"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";

const groups: {
  label: string;
  items: { href: string; label: string }[];
}[] = [
  {
    label: "My business",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/events/new", label: "Create event" },
      { href: "/dashboard/team", label: "Team" },
      { href: "/dashboard/audit", label: "Audit log" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/bus", label: "Bus operator" },
      { href: "/dashboard/parcels", label: "Courier operator" },
      { href: "/dashboard/pos", label: "Retail & POS" },
    ],
  },
  {
    label: "Field apps",
    items: [
      { href: "/dashboard/scan", label: "Scanning & validation" },
      { href: "/dashboard/driver", label: "Driver" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/finance", label: "Finance & settlements" },
      { href: "/dashboard/admin", label: "System administration" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-6">
        <Link href="/" className="px-2">
          <Logo />
        </Link>

        <nav className="mt-8 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {group.label}
              </p>
              <div className="mt-2 flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-navy-950 text-white"
                          : "text-ink-muted hover:bg-surface-alt hover:text-navy-950"
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

        <div className="mt-auto px-2 pt-6">
          <Link href="/" className="text-xs font-medium text-ink-faint hover:text-navy-950">
            ← Back to Lumiticket
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();
  const flatItems = groups.flatMap((g) => g.items);

  return (
    <nav
      aria-label="Dashboard sections"
      className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-3 lg:hidden"
    >
      {flatItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-navy-950 text-white"
                : "bg-surface-alt text-ink-muted hover:text-navy-950"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
