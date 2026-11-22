import { notFound } from "next/navigation";
import type { WorkspaceRole } from "@/lib/workspace-nav";
import { WORKSPACE_PAGES } from "./registry";

/** Resolves a workspace URL (the optional catch-all segments) to its screen. */
export function WorkspacePage({ role, slug }: { role: WorkspaceRole; slug?: string[] }) {
  const Page = WORKSPACE_PAGES[role][(slug ?? []).join("/")];
  if (!Page) notFound();
  return <Page />;
}
