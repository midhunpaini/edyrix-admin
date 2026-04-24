import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("bg-ink/8 rounded-lg animate-pulse", className)} />;
}
