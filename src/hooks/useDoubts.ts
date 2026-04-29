import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { AdminDoubt } from "../types";

interface DoubtListResponse {
  total: number;
  doubts: AdminDoubt[];
}

export interface DoubtStats {
  pending_count: number;
  avg_response_hours: number;
  answered_today: number;
  oldest_pending_hours: number;
  sla_breached_count: number;
  by_subject: { subject: string; pending: number }[];
}

export function useAdminDoubts(
  status?: string,
  assigned_to?: string,
  subject_id?: string,
  chapter_id?: string,
  sort: "oldest" | "newest" = "oldest"
) {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (assigned_to) params.assigned_to = assigned_to;
  if (subject_id) params.subject_id = subject_id;
  if (chapter_id) params.chapter_id = chapter_id;
  params.sort = sort;

  return useQuery<DoubtListResponse>({
    queryKey: ["admin", "doubts", status, assigned_to, subject_id, chapter_id, sort],
    queryFn: () => api.get("/admin/doubts", { params }).then((r) => r.data),
  });
}

export function useDoubtStats() {
  return useQuery<DoubtStats>({
    queryKey: ["admin", "doubts", "stats"],
    queryFn: () => api.get("/admin/doubts/stats").then((r) => r.data),
    refetchInterval: 60000,
  });
}

export function useAnswerDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answer_text }: { id: string; answer_text: string }) =>
      api
        .put<{ message: string; notification_sent: boolean }>(`/admin/doubts/${id}/answer`, { answer_text })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubts"] }),
  });
}

export function useAssignDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacher_id }: { id: string; teacher_id: string }) =>
      api.put(`/admin/doubts/${id}/assign`, { teacher_id }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubts"] }),
  });
}

export function useCloseDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/admin/doubts/${id}/close`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubts"] }),
  });
}

export function useBulkCloseDoubts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doubt_ids, reason }: { doubt_ids: string[]; reason: string }) =>
      api.post("/admin/doubts/bulk-close", { doubt_ids, reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubts"] }),
  });
}

export function useDoubtTemplates() {
  return useQuery<{ id: string; title: string; body: string }[]>({
    queryKey: ["admin", "doubt-templates"],
    queryFn: () => api.get("/admin/doubt-templates").then((r) => r.data),
  });
}

export function useCreateDoubtTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body: string; subject_id?: string }) =>
      api.post("/admin/doubt-templates", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubt-templates"] }),
  });
}

export function useDeleteDoubtTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/doubt-templates/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "doubt-templates"] }),
  });
}
