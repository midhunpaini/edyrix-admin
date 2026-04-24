import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { AdminDoubt } from "../types";

interface DoubtListResponse {
  total: number;
  doubts: AdminDoubt[];
}

export function useAdminDoubts(status?: string) {
  return useQuery<DoubtListResponse>({
    queryKey: ["admin", "doubts", status],
    queryFn: () =>
      api
        .get("/admin/doubts", { params: status ? { status } : undefined })
        .then((r) => r.data),
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
