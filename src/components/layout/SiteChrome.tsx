"use client";

import { usePathname } from "next/navigation";
import { isWorkspacePath } from "@/lib/roles";

/** Hides the public site header/footer inside the role workspaces, which bring their own chrome. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isWorkspacePath(pathname)) return null;
  return <>{children}</>;
}
