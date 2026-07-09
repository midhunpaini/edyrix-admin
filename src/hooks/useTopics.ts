import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { Topic } from "../types";

export function useTopics(chapterId: string | undefined) {
  return useQuery<Topic[]>({
    queryKey: ["topics", chapterId],
    queryFn: () =>
      api.get("/admin/topics", { params: { chapter_id: chapterId } }).then((r) => r.data),
    enabled: !!chapterId,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, chapterId: string) {
  qc.invalidateQueries({ queryKey: ["topics", chapterId] });
  qc.invalidateQueries({ queryKey: ["admin", "content-tree"] });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation<
    Topic,
    Error,
    { chapter_id: string; lesson_id?: string | null; title: string; title_ml?: string; order_index?: number }
  >({
    mutationFn: (body) => api.post("/admin/topics", body).then((r) => r.data),
    onSuccess: (_, vars) => invalidate(qc, vars.chapter_id),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation<
    Topic,
    Error,
    { id: string; chapter_id: string; lesson_id?: string | null; title?: string; title_ml?: string; order_index?: number }
  >({
    mutationFn: ({ id, chapter_id: _c, ...body }) => api.put(`/admin/topics/${id}`, body).then((r) => r.data),
    onSuccess: (_, vars) => invalidate(qc, vars.chapter_id),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; chapter_id: string }>({
    mutationFn: ({ id }) => api.delete(`/admin/topics/${id}`).then(() => undefined),
    onSuccess: (_, vars) => invalidate(qc, vars.chapter_id),
  });
}
