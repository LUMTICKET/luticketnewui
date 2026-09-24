import { Badge } from "@/components/ui/Badge";

export function DemoBadge() {
  return <Badge tone="warning">Sample data — not yet wired to a live backend</Badge>;
}

export function PageHeader({
  title,
  description,
  demo = false,
  action,
}: {
  title: string;
  description?: string;
  demo?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-navy-950">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {demo && <DemoBadge />}
        {action}
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-2xl border border-line bg-surface p-6 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "warning" ? "text-warning" : "text-navy-950"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns }: { columns: string[] }) {
  return (
    <thead className="border-b border-line bg-surface-alt text-xs uppercase tracking-wide text-ink-faint">
      <tr>
        {columns.map((column, index) => (
          <th key={index} className="px-4 py-3 font-semibold">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const cell = "px-4 py-3";
export const rowClass = "border-b border-line last:border-0";

export const inputClass =
  "h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-navy-400";
