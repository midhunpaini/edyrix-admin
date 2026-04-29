import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  billing_cycle: string;
  price_paise: number;
  is_active: boolean;
}

export interface FeatureFlags {
  free_trial_enabled: boolean;
  trial_duration_days: number;
  whatsapp_share_enabled: boolean;
  maintenance_mode: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Settings {
  plans: Plan[];
  feature_flags: FeatureFlags;
  admin_users: AdminUser[];
}

export interface AuditLog {
  id: string;
  admin_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get("/admin/settings").then((r) => r.data),
  });
}

export function useUpdateFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ flag_name, value }: { flag_name: string; value: boolean | number | string }) =>
      api.put("/admin/settings/feature-flags", { flag_name, value }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

export function useAuditLog(filters: {
  page?: number;
  limit?: number;
  action?: string;
  admin_id?: string;
  resource_type?: string;
  from_date?: string;
  to_date?: string;
}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );
  return useQuery<{ total: number; logs: AuditLog[] }>({
    queryKey: ["admin", "audit-log", filters],
    queryFn: () => api.get("/admin/audit-log", { params }).then((r) => r.data),
  });
}
