import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export interface NotificationLog {
  id: string;
  title: string;
  target_segment: string;
  target_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { title: string; body: string; target_segment: string; data?: Record<string, string> }) =>
      api.post("/admin/notifications/send", vars).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "notifications", "history"] }),
  });
}

export function useNotificationHistory() {
  return useQuery<NotificationLog[]>({
    queryKey: ["admin", "notifications", "history"],
    queryFn: () => api.get("/admin/notifications/history").then((r) => r.data),
  });
}
