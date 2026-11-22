"use client";

import { usePathname } from "next/navigation";
import { isWorkspacePath } from "@/lib/roles";

/** Hides the public site header/footer inside the role workspaces, which bring their own chrome. */
export function SiteChrome({
  children,
  hideOnHome = false,
}: {
  children: React.ReactNode;
  hideOnHome?: boolean;
}) {
  const pathname = usePathname();
  if (isWorkspacePath(pathname) || (hideOnHome && pathname === "/")) return null;
  return <>{children}</>;
}
