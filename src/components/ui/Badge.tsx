import { clsx } from "clsx";

export function Badge({ children, variant = "gray", className }: { children: React.ReactNode; variant?: "teal" | "amber" | "rose" | "forest" | "gray"; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold", {
      "bg-teal/10 text-teal-dark": variant === "teal",
      "bg-amber-pale text-amber-dark": variant === "amber",
      "bg-rose/10 text-rose": variant === "rose",
      "bg-forest/10 text-forest": variant === "forest",
      "bg-ink/8 text-ink-2": variant === "gray",
    }, className)}>
      {children}
    </span>
  );
}
