import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { AdminTest } from "../types";

export function useAdminTests(chapterId: string | undefined) {
  return useQuery<AdminTest>({
    queryKey: ["admin", "test", chapterId],
    queryFn: () => api.get(`/admin/tests/chapter/${chapterId}`).then((r) => r.data),
    enabled: !!chapterId,
    retry: false,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      chapter_id: string;
      title: string;
      duration_minutes: number;
      total_marks: number;
      questions: object[];
    }) => api.post<AdminTest>("/admin/tests", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "test"] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminTest> & { id: string }) =>
      api.put<AdminTest>(`/admin/tests/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "test"] }),
  });
}

export function usePublishTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ id: string; is_published: boolean }>(`/admin/tests/${id}/publish`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "test"] }),
  });
}
