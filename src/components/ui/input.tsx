import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("mb-1 block text-xs font-medium text-neutral-600", className)}
    {...props}
  />
);
