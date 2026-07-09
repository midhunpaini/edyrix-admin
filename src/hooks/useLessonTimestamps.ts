import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { LessonTimestamp } from "../types";

export function useContentItemTimestamps(contentItemId: string | undefined) {
  return useQuery<LessonTimestamp[]>({
    queryKey: ["content-item-timestamps", contentItemId],
    queryFn: () =>
      api
        .get("/admin/lesson-timestamps", { params: { content_item_id: contentItemId } })
        .then((r) => r.data),
    enabled: !!contentItemId,
  });
}

export function useCreateTimestamp() {
  const qc = useQueryClient();
  return useMutation<
    LessonTimestamp,
    Error,
    { content_item_id: string; topic_id: string; start_seconds: number; end_seconds?: number }
  >({
    mutationFn: (body) =>
      api.post("/admin/lesson-timestamps", body).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["content-item-timestamps", vars.content_item_id] });
    },
  });
}

export function useUpdateTimestamp() {
  const qc = useQueryClient();
  return useMutation<
    LessonTimestamp,
    Error,
    { id: string; content_item_id: string; topic_id?: string; start_seconds?: number; end_seconds?: number }
  >({
    mutationFn: ({ id, content_item_id: _cid, ...body }) =>
      api.put(`/admin/lesson-timestamps/${id}`, body).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["content-item-timestamps", vars.content_item_id] });
    },
  });
}

export function useDeleteTimestamp() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; content_item_id: string }>({
    mutationFn: ({ id }) =>
      api.delete(`/admin/lesson-timestamps/${id}`).then(() => undefined),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["content-item-timestamps", vars.content_item_id] });
    },
  });
}
