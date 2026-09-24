"use client";

import { createContext, useContext } from "react";
import type { AuthUser, BusinessProfile } from "@/lib/auth";
import type { WorkspaceRole } from "@/lib/workspace-nav";

export interface WorkspaceValue {
  role: WorkspaceRole;
  token: string;
  user: AuthUser | null;
  /** undefined while loading, null when the account has no business profile yet. */
  profile: BusinessProfile | null | undefined;
  profileError: string;
  reloadProfile: () => Promise<void>;
  /** Staff console is open without a server-side staff signal (see staffAccess). */
  staffPreview: boolean;
}

export const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside a workspace shell");
  return value;
}
