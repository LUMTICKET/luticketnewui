"use client";

import { useEffect, useRef, useState } from "react";
import { countries } from "@/lib/data";

export function CountrySwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(countries[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-ink hover:border-navy-300"
      >
        <span aria-hidden>{selected.flag}</span>
        <span>{selected.name}</span>
        <span className="text-ink-faint">{selected.currency}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-xl"
        >
          <li className="px-4 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            SADC region
          </li>
          {countries.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected.code === c.code}
                onClick={() => {
                  setSelected(c);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-surface-alt"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{c.flag}</span>
                  <span className="text-ink">{c.name}</span>
                </span>
                {c.live ? (
                  <span className="text-xs font-semibold text-success">
                    {c.currency}
                  </span>
                ) : (
                  <span className="text-xs text-ink-faint">Coming soon</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
