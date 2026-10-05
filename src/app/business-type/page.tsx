import { Suspense } from "react";
import { BusinessTypeStep } from "@/components/auth/BusinessTypeStep";

export const metadata = {
  title: "Choose your business type — Lumticket",
};

export default function BusinessTypePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-14 sm:px-6">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <BusinessTypeStep />
      </Suspense>
    </div>
  );
}