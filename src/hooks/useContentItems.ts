import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { ContentItem } from "../types";

export function useContentItems(lessonId: string | undefined) {
  return useQuery<ContentItem[]>({
    queryKey: ["admin", "content-items", lessonId],
    queryFn: () =>
      api.get("/admin/content-items", { params: { lesson_id: lessonId } }).then((r) => r.data),
    enabled: !!lessonId,
  });
}

export function useCreateVideoItem() {
  const qc = useQueryClient();
  return useMutation<
    ContentItem,
    Error,
    {
      lesson_id: string;
      title: string;
      title_ml?: string;
      youtube_video_id: string;
      duration_seconds?: number | null;
      thumbnail_url?: string | null;
      is_free?: boolean;
      order_index?: number;
    }
  >({
    mutationFn: (body) => api.post("/admin/content-items/video", body).then((r) => r.data),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "content-items", vars.lesson_id] }),
  });
}

export function useUpdateContentItem() {
  const qc = useQueryClient();
  return useMutation<
    ContentItem,
    Error,
    {
      id: string;
      lesson_id: string;
      title?: string;
      title_ml?: string;
      is_free?: boolean;
      is_active?: boolean;
      order_index?: number;
      youtube_video_id?: string;
      duration_seconds?: number | null;
      thumbnail_url?: string | null;
    }
  >({
    mutationFn: ({ id, lesson_id: _lesson_id, ...body }) =>
      api.put(`/admin/content-items/${id}`, body).then((r) => r.data),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "content-items", vars.lesson_id] }),
  });
}

export function useDeleteContentItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; lesson_id: string }>({
    mutationFn: ({ id }) => api.delete(`/admin/content-items/${id}`).then(() => undefined),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "content-items", vars.lesson_id] }),
  });
}

export function useReorderContentItems() {
  const qc = useQueryClient();
  return useMutation<void, Error, { lesson_id: string; ordered_ids: string[] }>({
    mutationFn: ({ ordered_ids }) =>
      api.put("/admin/content-items/reorder", { ordered_ids }).then(() => undefined),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "content-items", vars.lesson_id] }),
  });
}
