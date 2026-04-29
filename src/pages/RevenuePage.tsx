import { useState } from "react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRevenue, useRevenueForecast, useSubscriptionList, useRefundPayment } from "../hooks/useRevenue";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../lib/icons";

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

type Range = "7d" | "30d" | "90d" | "year";

function getDateRange(range: Range): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const d = new Date(now);
  if (range === "7d") d.setDate(d.getDate() - 7);
  else if (range === "30d") d.setDate(d.getDate() - 30);
  else if (range === "90d") d.setDate(d.getDate() - 90);
  else d.setMonth(d.getMonth() - 12);
  return { start: d.toISOString().slice(0, 10), end };
}

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "year": "Last 12 months",
};

export function RevenuePage() {
  const [range, setRange] = useState<Range>("30d");
  const [refundTarget, setRefundTarget] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const { start, end } = getDateRange(range);
  const { data: revenue, isLoading: revLoading } = useRevenue(start, end);
  const { data: forecast, isLoading: forecastLoading } = useRevenueForecast();
  const { data: subList, isLoading: subLoading } = useSubscriptionList({ limit: 50 });
  const refund = useRefundPayment();

  function handleRefundConfirm() {
    if (!refundTarget || !refundReason.trim()) return;
    refund.mutate(
      { paymentId: refundTarget.id, reason: refundReason },
      {
        onSuccess: () => {
          toast.success("Refund processed");
          setRefundTarget(null);
          setRefundReason("");
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Refund failed"),
      }
    );
  }

  const totalPlanRev = revenue?.plan_breakdown.reduce((s, p) => s + p.revenue_paise, 0) || 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Revenue</h2>
          <p className="text-ink-3 text-sm font-body mt-0.5">Payments and subscription analytics</p>
        </div>
        <div className="flex gap-1 bg-bg rounded-xl p-1">
          {(["7d", "30d", "90d", "year"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors ${
                range === r ? "bg-white text-ink shadow-sm" : "text-ink-3 hover:text-ink"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {revLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Net Revenue</p>
              <p className="text-2xl font-display font-bold text-ink mt-1">
                {revenue ? fmt(revenue.net_revenue_paise) : "—"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Successful Payments</p>
              <p className="text-2xl font-display font-bold text-forest mt-1">
                {revenue?.successful_payments ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Failed Payments</p>
              <p className="text-2xl font-display font-bold text-rose mt-1">
                {revenue?.failed_payments ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
              <p className="text-xs font-body text-ink-3">Refunded</p>
              <p className="text-2xl font-display font-bold text-amber mt-1">
                {revenue ? fmt(revenue.refunded_paise) : "—"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5 mb-6">
        <h3 className="font-display font-bold text-base text-ink mb-4">Revenue Over Time</h3>
        {revLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !revenue?.daily_breakdown.length ? (
          <div className="h-64 flex items-center justify-center text-ink-3 text-sm font-body">No revenue data for this period</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.daily_breakdown}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D6E6E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D6E6E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  }
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString("en-IN")}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: unknown, _: unknown, p: any) => [
                    `${fmt(v as number)} (${(p?.payload?.count ?? 0)} payments)`,
                    "Revenue",
                  ]}
                  labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                />
                <Area
                  type="monotone"
                  dataKey="revenue_paise"
                  stroke="#0D6E6E"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Plan Breakdown */}
      {!revLoading && revenue?.plan_breakdown.length ? (
        <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5 mb-6">
          <h3 className="font-display font-bold text-base text-ink mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {[...revenue.plan_breakdown]
              .sort((a, b) => b.revenue_paise - a.revenue_paise)
              .map((p) => {
                const pct = Math.round((p.revenue_paise / totalPlanRev) * 100);
                return (
                  <div key={p.plan_name} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <p className="text-sm font-body text-ink truncate">{p.plan_name}</p>
                      <p className="text-xs text-ink-3">{p.count} subs</p>
                    </div>
                    <div className="flex-1 h-2 bg-ink/5 rounded-full overflow-hidden">
                      <div className="h-full bg-teal rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-28 text-right flex-shrink-0">
                      <p className="text-sm font-body font-semibold text-ink">{fmt(p.revenue_paise)}</p>
                      <p className="text-xs text-ink-3">{pct}%</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-ink/8 shadow-sm p-5 mb-6">
        <h3 className="font-display font-bold text-base text-ink mb-4">Subscriptions</h3>
        {subLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !subList?.subscriptions.length ? (
          <p className="text-sm text-ink-3 font-body">No subscriptions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-ink/8">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Student</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Plan</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Amount</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Started</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Expires</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-3">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {subList.subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-ink/5 hover:bg-bg/50">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-ink">{sub.student_name}</p>
                      <p className="text-xs text-ink-3">{sub.student_phone ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4 text-ink">{sub.plan_name}</td>
                    <td className="py-3 pr-4 text-ink">{fmt(sub.amount_paise)}</td>
                    <td className="py-3 pr-4 text-ink-3">{new Date(sub.started_at).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 pr-4 text-ink-3">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={sub.status === "active" ? "forest" : sub.status === "cancelled" ? "rose" : "gray"}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {sub.payment_id && sub.status === "active" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setRefundTarget({ id: sub.payment_id!, name: sub.student_name, amount: sub.amount_paise })
                          }
                        >
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forecast Card */}
      {!forecastLoading && forecast && (
        <div className="bg-amber/5 border border-amber/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name={Icons.growth} size={20} className="text-amber" />
            <h3 className="font-display font-bold text-base text-ink">Revenue Forecast</h3>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-ink-3 font-body">Current MRR</p>
              <p className="text-lg font-display font-bold text-ink">{fmt(forecast.current_mrr_paise)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 font-body">Projected Next Month</p>
              <p className="text-lg font-display font-bold text-forest">{fmt(forecast.projected_next_month_paise)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 font-body">Expiring This Month</p>
              <p className="text-lg font-display font-bold text-ink">{forecast.subs_expiring_this_month} subs</p>
              <p className="text-xs text-ink-3">{forecast.projected_renewals} projected renewals</p>
            </div>
            <div>
              <p className="text-xs text-ink-3 font-body">At Risk</p>
              <p className="text-lg font-display font-bold text-rose">{fmt(forecast.at_risk_revenue_paise)}</p>
              <p className="text-xs text-ink-3">{Math.round(forecast.historical_renewal_rate * 100)}% renewal rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirm Modal */}
      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Confirm Refund" size="sm">
        {refundTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-rose/5 border border-rose/20 rounded-lg">
              <p className="text-sm font-body text-rose">
                Refund <strong>{fmt(refundTarget.amount)}</strong> to <strong>{refundTarget.name}</strong>?
                This cannot be undone.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold font-body text-ink mb-1">Reason</label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-lg border border-ink/20 p-3 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none"
                placeholder="Reason for refund"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRefundTarget(null)}>Cancel</Button>
              <Button
                variant="secondary"
                className="text-rose"
                disabled={!refundReason.trim() || refund.isPending}
                loading={refund.isPending}
                onClick={handleRefundConfirm}
              >
                Process Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
