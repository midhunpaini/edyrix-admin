import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { ContentChapter, ContentLesson, ContentSubject } from "../types";

export function useAdminSubjects() {
  return useQuery<ContentSubject[]>({
    queryKey: ["admin", "subjects"],
    queryFn: () => api.get("/classes/10/subjects").then((r) => r.data),
  });
}

export function useAdminChapters(subjectId: string | undefined) {
  return useQuery<{ id: string; name: string; chapters: ContentChapter[] }>({
    queryKey: ["admin", "chapters", subjectId],
    queryFn: () => api.get(`/admin/subjects/${subjectId}`).then((r) => r.data),
    enabled: !!subjectId,
  });
}

export function useAdminLessons(chapterId: string | undefined) {
  return useQuery<ContentLesson[]>({
    queryKey: ["admin", "lessons", chapterId],
    queryFn: () => api.get(`/admin/chapters/${chapterId}/lessons`).then((r) => r.data),
    enabled: !!chapterId,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      chapter_id: string;
      title: string;
      title_ml: string;
      youtube_video_id: string;
      duration_seconds?: number;
      is_free?: boolean;
      order_index?: number;
    }) => api.post<ContentLesson>("/admin/lessons", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "lessons"] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ContentLesson> & { id: string }) =>
      api.put<ContentLesson>(`/admin/lessons/${id}`, data).then((r) => r.data),
    onSuccess: (_result, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "lessons", vars.chapter_id] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; chapter_id: string }) =>
      api.delete(`/admin/lessons/${id}`),
    onSuccess: (_result, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "lessons", vars.chapter_id] }),
  });
}

export function usePublishLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; chapter_id: string }) =>
      api
        .patch<{ id: string; is_published: boolean }>(`/admin/lessons/${id}/publish`)
        .then((r) => r.data),
    onSuccess: (_result, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "lessons", vars.chapter_id] }),
  });
}

export function useBulkCreateLessons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      chapter_id: string;
      lessons: {
        title: string;
        title_ml: string;
        youtube_video_id: string;
        duration_seconds?: number | null;
        is_free?: boolean;
        order_index?: number;
      }[];
    }) =>
      api
        .post<{ created: number; errors: string[] }>("/admin/lessons/bulk", data)
        .then((r) => r.data),
    onSuccess: (_result, vars) =>
      qc.invalidateQueries({ queryKey: ["admin", "lessons", vars.chapter_id] }),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      name_ml: string;
      slug: string;
      class_number: number;
      icon: string;
      color: string;
      monthly_price_paise: number;
      order_index?: number;
    }) => api.post<ContentSubject>("/admin/subjects", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subjects"] }),
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject_id: string;
      chapter_number: number;
      title: string;
      title_ml: string;
      description?: string;
      order_index?: number;
    }) => api.post<ContentChapter>("/admin/chapters", data).then((r) => r.data),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "chapters", vars.subject_id] });
    },
  });
}

export function usePublishChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ id: string; is_published: boolean }>(`/admin/chapters/${id}/publish`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "chapters"] }),
  });
}

export function useUploadNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { chapterId: string; title: string; file: File; is_premium?: boolean }) => {
      const fd = new FormData();
      fd.append("file", vars.file);
      return api
        .post("/admin/notes/upload", fd, {
          params: { chapter_id: vars.chapterId, title: vars.title, is_premium: vars.is_premium ?? true },
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
