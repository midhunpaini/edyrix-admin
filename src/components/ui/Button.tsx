import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-body font-semibold transition-colors",
        {
          "bg-teal text-white hover:bg-teal-dark": variant === "primary",
          "bg-white border border-ink/20 text-ink hover:bg-ink/5": variant === "secondary",
          "text-ink hover:bg-ink/5": variant === "ghost",
          "bg-rose text-white hover:opacity-90": variant === "danger",
          "h-8 px-3 text-sm gap-1.5": size === "sm",
          "h-9 px-4 text-sm gap-2": size === "md",
          "h-11 px-5 text-base gap-2": size === "lg",
          "opacity-50 cursor-not-allowed": disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}
