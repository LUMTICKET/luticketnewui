type Tone = "neutral" | "gold" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-navy-50 text-navy-700",
  gold: "bg-gold-100 text-gold-800",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  error: "bg-error-surface text-error",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
