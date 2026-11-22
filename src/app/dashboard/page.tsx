"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getStoredRole, roleLanding } from "@/lib/roles";

/** Legacy entry point: sends people to the workspace for their account type. */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAuthSession() ? roleLanding(getStoredRole()) : "/login");
  }, [router]);

  return <p className="px-4 py-16 text-center text-sm text-ink-muted">Opening your workspace…</p>;
}
