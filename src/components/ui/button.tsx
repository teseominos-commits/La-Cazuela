import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-black/10 hover:bg-black/5",
  ghost: "text-[var(--color-text)] hover:bg-black/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
