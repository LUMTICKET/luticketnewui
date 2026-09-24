import Link from "next/link";
import { Logo, LogoWordmark } from "./Logo";
import { countries } from "@/lib/data";

const columns = [
  {
    title: "Travel & tickets",
    links: [
      { href: "/bus", label: "Bus tickets" },
      { href: "/events", label: "Events" },
      { href: "/parcels/send", label: "Send a parcel" },
      { href: "/bookings", label: "Manage my bookings" },
    ],
  },
  {
    title: "Partner with us",
    links: [
      { href: "/business/bus-operators", label: "Bus operators" },
      { href: "/business/couriers", label: "Courier operators" },
      { href: "/business/organizers", label: "Event organizers" },
      { href: "/business/agents", label: "Retail & POS agents" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/help/refunds", label: "Refunds & cancellations" },
      { href: "/help/safety", label: "Trust & safety" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Lumina Holdings" },
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/kyc", label: "Verification & KYC policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm text-navy-300">
              One platform for bus travel, parcels, and event tickets across
              the SADC region.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-navy-300">
              <span>A company of</span>
              <LogoWordmark tone="light" width={112} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {countries.map((c) => (
                <span
                  key={c.code}
                  className="inline-flex items-center gap-1 rounded-full border border-navy-700 px-2.5 py-1 text-xs text-navy-200"
                  title={c.live ? "Live now" : "Coming soon"}
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.code}
                  {!c.live && <span className="text-navy-400">·soon</span>}
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-300 hover:text-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-navy-800 pt-6 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lumina Holdings Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Secured payments · Licensed payment gateway partners</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
