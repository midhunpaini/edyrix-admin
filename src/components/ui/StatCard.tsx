import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "teal" | "amber" | "forest" | "rose";
}

export function StatCard({ label, value, icon: Icon, trend, color = "teal" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-3 font-body">{label}</p>
          <p className="text-2xl font-display font-bold text-ink mt-1">{value}</p>
          {trend && (
            <p className={clsx("text-xs font-body mt-1", trend.value >= 0 ? "text-forest" : "text-rose")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={clsx("p-2.5 rounded-lg", {
          "bg-teal/10": color === "teal",
          "bg-amber-pale": color === "amber",
          "bg-forest/10": color === "forest",
          "bg-rose/10": color === "rose",
        })}>
          <Icon size={20} className={clsx({
            "text-teal": color === "teal",
            "text-amber-dark": color === "amber",
            "text-forest": color === "forest",
            "text-rose": color === "rose",
          })} />
        </div>
      </div>
    </div>
  );
}
