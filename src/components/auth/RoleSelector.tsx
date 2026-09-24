"use client";

import { ROLES, type AccountRole } from "@/lib/roles";

export function RoleIcon({ role, size = 20 }: { role: AccountRole; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (role) {
    case "customer":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </svg>
      );
    case "bus-operator":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="13" rx="2.5" />
          <path d="M4 11h16" />
          <circle cx="8" cy="19.5" r="1.2" />
          <circle cx="16" cy="19.5" r="1.2" />
        </svg>
      );
    case "courier":
      return (
        <svg {...common}>
          <path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z" />
          <path d="M4 7.2l8 4.3 8-4.3M12 11.5V21" />
        </svg>
      );
    case "organizer":
      return (
        <svg {...common}>
          <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
          <path d="M14.5 6.5v11" strokeDasharray="1.8 2.2" />
        </svg>
      );
    case "agent":
      return (
        <svg {...common}>
          <path d="M4.5 10l1.3-5h12.4l1.3 5" />
          <path d="M4.5 10c0 1.4 1.1 2.3 2.4 2.3s2.4-.9 2.4-2.3c0 1.4 1.1 2.3 2.4 2.3s2.4-.9 2.4-2.3c0 1.4 1.1 2.3 2.4 2.3s2.4-.9 2.4-2.3" />
          <path d="M6 12.5V20h12v-7.5M10 20v-4h4v4" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z" />
          <path d="M9 12l2.2 2.2L15.5 10" />
        </svg>
      );
  }
}

export function RoleSelector({
  value,
  onChange,
  roles,
  label,
}: {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
  roles: AccountRole[];
  label: string;
}) {
  return (
    <div>
      <p id="role-selector-label" className="text-sm font-medium text-ink">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="role-selector-label"
        className="mt-2 grid grid-cols-2 gap-2.5"
      >
        {roles.map((role) => {
          const config = ROLES[role];
          const selected = value === role;
          return (
            <button
              key={role}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(role)}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-colors ${
                role === "customer" ? "col-span-2" : ""
              } ${
                selected
                  ? "border-navy-950 bg-navy-50 ring-1 ring-navy-950"
                  : "border-line bg-surface hover:border-navy-300"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    selected ? "bg-navy-950 text-white" : "bg-surface-alt text-navy-950"
                  }`}
                >
                  <RoleIcon role={role} size={17} />
                </span>
                <span className="text-sm font-semibold text-navy-950">{config.label}</span>
              </span>
              <span className="text-xs leading-snug text-ink-muted">{config.blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
