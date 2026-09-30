import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Bus operator workspace — Lumticket",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell role="bus-operator">{children}</WorkspaceShell>;
}
