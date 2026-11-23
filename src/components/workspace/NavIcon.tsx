/** Small line icons for workspace navigation, keyed by nav slug. */
const PATHS: Record<string, React.ReactNode> = {
  "": <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  profile: <><path d="M4 20V8l8-4 8 4v12" /><path d="M9 20v-5h6v5M9 11h.01M15 11h.01" /></>,
  schedules: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
  bookings: <><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" /><path d="M14.5 6.5v11" strokeDasharray="1.8 2.2" /></>,
  dispatch: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>,
  scanning: <><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" /></>,
  compliance: <><path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  trips: <><rect x="4" y="4" width="16" height="13" rx="2.5" /><path d="M4 11h16" /><circle cx="8" cy="19.5" r="1.2" /><circle cx="16" cy="19.5" r="1.2" /></>,
  "trips/new": <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  events: <><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" /></>,
  "events/new": <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  reports: <><path d="M5 20V10M12 20V4M19 20v-7" /></>,
  finance: <><rect x="3.5" y="6" width="17" height="13" rx="2.5" /><path d="M3.5 10h17M16 14.5h1.5" /></>,
  team: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 6.3a3 3 0 010 5.4M17.5 14.7c1.8.5 2.8 1.8 3.2 4.3" /></>,
  audit: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  parcels: <><path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z" /><path d="M4 7.2l8 4.3 8-4.3M12 11.5V21" /></>,
  sell: <><path d="M3.5 12.5V4.5h8l9 9-8 8-9-9z" /><circle cx="8" cy="9" r="1.2" /></>,
  transactions: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></>,
  reconciliation: <><path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5" /></>,
  kyc: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-1.6 1.7-2.3 3-2.3s2.5.7 3 2.3M14.5 10h3M14.5 13h3" /></>,
  operators: <><rect x="3.5" y="7.5" width="17" height="12" rx="2.5" /><path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5M3.5 13h17" /></>,
  commission: <><path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" /></>,
  roles: <><circle cx="8.5" cy="14.5" r="4" /><path d="M11.5 11.5L20 3M16 7l3 3" /></>,
  support: <><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></>,
};

export function NavIcon({ slug, size = 18 }: { slug: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[slug] ?? <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}
