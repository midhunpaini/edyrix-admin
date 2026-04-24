import { AlertCircle, IndianRupee, TrendingUp, Users } from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboard";
import { StatCard } from "../components/ui/StatCard";
import { Skeleton } from "../components/ui/Skeleton";

function RevenueChart({ data }: { data: { date: string; amount_paise: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.amount_paise), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
      <h3 className="font-display font-bold text-base text-ink mb-4">
        Revenue — Last 30 Days
      </h3>
      <div className="relative h-40">
        <svg viewBox={`0 0 100 40`} preserveAspectRatio="none" className="w-full h-full">
          {data.map((d, i) => {
            const height = (d.amount_paise / max) * 36;
            return (
              <rect
                key={i}
                x={i * barWidth + 0.3}
                y={40 - height}
                width={barWidth - 0.6}
                height={height}
                rx="0.5"
                fill="#0D6E6E"
                opacity="0.75"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-ink-3 font-body mt-2">
        <span>
          {data[0]
            ? new Date(data[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : ""}
        </span>
        <span>
          {data[data.length - 1]
            ? new Date(data[data.length - 1].date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : ""}
        </span>
      </div>
    </div>
  );
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Dashboard</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Overview of Edyrix platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Students"
              value={stats?.total_students.toLocaleString("en-IN") ?? "—"}
              icon={Users}
              color="teal"
            />
            <StatCard
              label="Active Subscriptions"
              value={stats?.active_subscriptions.toLocaleString("en-IN") ?? "—"}
              icon={TrendingUp}
              color="forest"
            />
            <StatCard
              label="MRR"
              value={stats ? formatRupees(stats.mrr_paise) : "—"}
              icon={IndianRupee}
              color="amber"
            />
            <StatCard
              label="Pending Doubts"
              value={stats?.pending_doubts ?? "—"}
              icon={AlertCircle}
              color={stats?.pending_doubts ? "rose" : "teal"}
            />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <RevenueChart data={stats?.revenue_last_30_days ?? []} />
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
          <h3 className="font-display font-bold text-base text-ink mb-4">Today</h3>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <span className="font-body text-sm text-ink-3">New sign-ups</span>
                <span className="font-display font-bold text-ink">
                  {stats?.new_signups_today ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <span className="font-body text-sm text-ink-3">Unanswered doubts</span>
                <span
                  className={`font-display font-bold ${
                    (stats?.pending_doubts ?? 0) > 0 ? "text-rose" : "text-forest"
                  }`}
                >
                  {stats?.pending_doubts ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-body text-sm text-ink-3">30-day revenue</span>
                <span className="font-display font-bold text-ink">
                  {stats
                    ? formatRupees(
                        stats.revenue_last_30_days.reduce((s, d) => s + d.amount_paise, 0)
                      )
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
