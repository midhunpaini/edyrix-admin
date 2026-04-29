import { useDashboardStats } from "../hooks/useDashboard";
import { StatCard } from "../components/ui/StatCard";
import { Skeleton } from "../components/ui/Skeleton";
import { Icons } from "../lib/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function RevenueChart({ data }: { data: { date: string; amount_paise: number }[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
      <h3 className="font-display font-bold text-base text-ink mb-4">Revenue — Last 30 Days</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100).toLocaleString("en-IN")}`} />
            <Tooltip
              contentStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              formatter={(v: unknown) => [`₹${((v as number) / 100).toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Bar dataKey="amount_paise" fill="#0D6E6E" opacity={0.7} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#e11d48";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-ink/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-body text-ink-3 w-10 text-right">{pct}%</span>
    </div>
  );
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
            <StatCard label="Total Students" value={stats?.total_students.toLocaleString("en-IN") ?? "—"} iconName={Icons.users} color="teal" />
            <StatCard label="Active Subscriptions" value={stats?.active_subscriptions.toLocaleString("en-IN") ?? "—"} iconName={Icons.growth} color="forest" />
            <StatCard label="MRR" value={stats ? formatRupees(stats.mrr_paise) : "—"} iconName={Icons.revenue} color="amber" />
            <StatCard label="Pending Doubts" value={stats?.pending_doubts ?? "—"} iconName={Icons.warning} color={stats?.pending_doubts ? "rose" : "teal"} />
          </>
        )}
      </div>

      {/* Retention metrics row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Trial Users</p>
              <p className="text-2xl font-display font-bold text-ink mt-1">{stats?.trial_users ?? 0}</p>
              <p className="text-xs font-body text-ink-3 mt-1">Active trials</p>
            </div>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Trial → Paid</p>
              <p className={`text-2xl font-display font-bold mt-1 ${
                (stats?.trial_conversion_rate ?? 0) >= 30 ? "text-forest" : (stats?.trial_conversion_rate ?? 0) > 0 ? "text-amber" : "text-ink"
              }`}>{stats?.trial_conversion_rate ?? 0}%</p>
              <p className="text-xs font-body text-ink-3 mt-1">Conversion rate</p>
            </div>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Churn This Month</p>
              <p className={`text-2xl font-display font-bold mt-1 ${
                (stats?.churn_this_month ?? 0) > 10 ? "text-rose" : (stats?.churn_this_month ?? 0) > 0 ? "text-amber" : "text-forest"
              }`}>{stats?.churn_this_month ?? 0}</p>
              <p className="text-xs font-body text-ink-3 mt-1">{stats?.churn_rate_pct ?? 0}% churn rate</p>
            </div>
          </>
        )}
      </div>

      {/* Revenue chart + Today panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div>
          {isLoading ? <Skeleton className="h-64 rounded-xl" /> : <RevenueChart data={stats?.revenue_last_30_days ?? []} />}
        </div>
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
          <h3 className="font-display font-bold text-base text-ink mb-4">Today</h3>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <span className="font-body text-sm text-ink-3">New sign-ups</span>
                <span className="font-display font-bold text-ink">{stats?.new_signups_today ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <span className="font-body text-sm text-ink-3">Unanswered doubts</span>
                <span className={`font-display font-bold ${(stats?.pending_doubts ?? 0) > 0 ? "text-rose" : "text-forest"}`}>{stats?.pending_doubts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-body text-sm text-ink-3">30-day revenue</span>
                <span className="font-display font-bold text-ink">{stats ? formatRupees(stats.revenue_last_30_days.reduce((s, d) => s + d.amount_paise, 0)) : "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Top Lessons */}
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
          <h3 className="font-display font-bold text-base text-ink mb-4">Top Lessons</h3>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : !stats?.top_lessons?.length ? (
            <p className="text-sm text-ink-3 font-body">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.top_lessons.map((lesson: { id: string; title: string; views: number; completion_pct: number }) => (
                <div key={lesson.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-ink truncate">{lesson.title}</p>
                    <p className="text-xs text-ink-3">{lesson.views} views</p>
                  </div>
                  <CompletionBar pct={lesson.completion_pct} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Completion Lessons */}
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
          <h3 className="font-display font-bold text-base text-rose mb-4">Needs Attention — Low Engagement</h3>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : !stats?.low_completion_lessons?.length ? (
            <p className="text-sm text-ink-3 font-body">All lessons performing well</p>
          ) : (
            <div className="space-y-3">
              {stats.low_completion_lessons.map((lesson: { id: string; title: string; views: number; completion_pct: number }) => (
                <div key={lesson.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-ink truncate">{lesson.title}</p>
                    <p className="text-xs text-ink-3">{lesson.views} views</p>
                  </div>
                  <CompletionBar pct={lesson.completion_pct} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject Engagement */}
      <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5">
        <h3 className="font-display font-bold text-base text-ink mb-4">Subject Engagement</h3>
        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : !stats?.subject_engagement?.length ? (
          <p className="text-sm text-ink-3 font-body">No data yet</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subject_engagement} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="subject" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                  formatter={(v: unknown, n: unknown) => [(n as string) === "active_students" ? `${v} students` : `${v}%`, (n as string) === "active_students" ? "Active Students" : "Avg Completion"]}
                />
                <Bar dataKey="active_students" fill="#0D6E6E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
