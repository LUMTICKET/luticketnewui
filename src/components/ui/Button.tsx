import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-navy-950 text-white hover:bg-navy-800 focus-visible:bg-navy-800",
  accent:
    "bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:bg-gold-400",
  outline:
    "border border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-white",
  ghost: "text-navy-950 hover:bg-navy-950/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

interface LinkButtonProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
