import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import type { DashboardStats, RevenueDay } from "../types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useRevenueData() {
  const { data } = useDashboardStats();
  return data?.revenue_last_30_days ?? ([] as RevenueDay[]);
}
