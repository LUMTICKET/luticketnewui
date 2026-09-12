import {
  DashboardMobileNav,
  DashboardSidebar,
} from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardMobileNav />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
