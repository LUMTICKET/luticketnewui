import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "You're offline — Lumiticket",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-700"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 9l9-6 9 6M4 10v9h16v-9M9.5 21v-6h5v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 3l18 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold text-navy-950">
        You&apos;re offline
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        This page hasn&apos;t been saved for offline use yet. Recently
        viewed tickets and parcel status stay available without a
        connection — reconnect to search or book.
      </p>
      <LinkButton href="/" variant="primary" size="md" className="mt-6">
        Back to home
      </LinkButton>
      <p className="mt-4 text-xs text-ink-faint">
        <Link href="/parcels">Track a parcel</Link> and saved QR tickets may
        still work offline.
      </p>
    </div>
  );
}
