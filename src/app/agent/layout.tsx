import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Agent workspace — Lumticket",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell role="agent">{children}</WorkspaceShell>;
}
