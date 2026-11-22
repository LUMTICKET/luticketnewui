"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getStoredRole, roleLanding } from "@/lib/roles";
import { isWorkspaceRole, workspaceHasPage, workspaceHref } from "@/lib/workspace-nav";

/** Legacy /dashboard/* URLs: keep the same section when the user's workspace has it, else land on the overview. */
export default function DashboardLegacyRedirect(props: PageProps<"/dashboard/[...slug]">) {
  const { slug } = use(props.params);
  const router = useRouter();

  useEffect(() => {
    if (!getAuthSession()) {
      router.replace("/login");
      return;
    }
    const role = getStoredRole();
    const path = slug.join("/");
    router.replace(
      isWorkspaceRole(role) && workspaceHasPage(role, path) ? workspaceHref(role, path) : roleLanding(role),
    );
  }, [router, slug]);

  return <p className="px-4 py-16 text-center text-sm text-ink-muted">Opening your workspace…</p>;
}
