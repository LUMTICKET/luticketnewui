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
        <h1 className="text-3xl font-bold tracking-tight text-navy-950">{title}</h1>
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
  return <div className={`rounded-3xl bg-navy-50/70 p-6 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  featured = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "warning";
  featured?: boolean;
}) {
  // A folder-style tile: the tab on the top-left shares the body's colour.
  const fill = featured ? "bg-navy-950" : "bg-navy-50";
  return (
    <div className="relative mt-3">
      <span aria-hidden className={`absolute -top-3 left-0 h-6 w-24 rounded-t-2xl ${fill}`} />
      <div className={`relative flex h-full min-h-32 flex-col justify-between rounded-3xl rounded-tl-none p-5 ${fill}`}>
        <p className={`text-sm font-medium ${featured ? "text-navy-200" : "text-ink-muted"}`}>{label}</p>
        <div className="mt-4">
          <p
            className={`text-2xl font-bold ${
              featured ? "text-white" : tone === "warning" ? "text-warning" : "text-navy-950"
            }`}
          >
            {value}
          </p>
          {hint && <p className={`mt-1 text-xs ${featured ? "text-navy-200" : "text-ink-muted"}`}>{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns }: { columns: string[] }) {
  return (
    <thead className="border-b border-navy-200 text-xs text-ink-faint">
      <tr>
        {columns.map((column, index) => (
          <th key={index} className="px-4 py-3 font-medium">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const cell = "px-4 py-3";
export const rowClass = "border-b border-navy-100 transition-colors last:border-0 hover:bg-navy-50";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm focus:border-navy-950";
