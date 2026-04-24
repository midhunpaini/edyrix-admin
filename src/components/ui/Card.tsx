import { clsx } from "clsx";

export function Card({ children, className, padding = "md" }: { children: React.ReactNode; className?: string; padding?: "none" | "sm" | "md" | "lg" }) {
  return (
    <div className={clsx("bg-white rounded-xl border border-ink/8 shadow-sm", {
      "p-0": padding === "none",
      "p-3": padding === "sm",
      "p-5": padding === "md",
      "p-6": padding === "lg",
    }, className)}>
      {children}
    </div>
  );
}
