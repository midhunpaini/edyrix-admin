import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export interface RevenueData {
  total_revenue_paise: number;
  successful_payments: number;
  failed_payments: number;
  refunded_paise: number;
  net_revenue_paise: number;
  daily_breakdown: { date: string; revenue_paise: number; count: number }[];
  plan_breakdown: { plan_name: string; count: number; revenue_paise: number }[];
}

export interface RevenueForecast {
  current_mrr_paise: number;
  projected_next_month_paise: number;
  subs_expiring_this_month: number;
  historical_renewal_rate: number;
  projected_renewals: number;
  at_risk_revenue_paise: number;
}

export interface SubscriptionItem {
  id: string;
  student_name: string;
  student_phone: string | null;
  plan_name: string;
  amount_paise: number;
  started_at: string;
  expires_at: string | null;
  status: string;
  payment_id: string | null;
}

export function useRevenue(startDate?: string, endDate?: string, planId?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (planId) params.plan_id = planId;

  return useQuery<RevenueData>({
    queryKey: ["admin", "revenue", startDate, endDate, planId],
    queryFn: () => api.get("/admin/revenue", { params }).then((r) => r.data),
  });
}

export function useRevenueForecast() {
  return useQuery<RevenueForecast>({
    queryKey: ["admin", "revenue", "forecast"],
    queryFn: () => api.get("/admin/revenue/forecast").then((r) => r.data),
  });
}

export function useSubscriptionList(filters: {
  page?: number;
  limit?: number;
  status?: string;
  plan_id?: string;
  search?: string;
}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );
  return useQuery<{ total: number; subscriptions: SubscriptionItem[] }>({
    queryKey: ["admin", "subscriptions", filters],
    queryFn: () => api.get("/admin/subscriptions", { params }).then((r) => r.data),
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      api.post(`/admin/payments/${paymentId}/refund`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}
