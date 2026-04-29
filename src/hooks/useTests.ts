import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { AdminTest } from "../types";

export interface TestListItem {
  id: string;
  title: string;
  chapter_id: string;
  chapter_title: string;
  subject_name: string;
  question_count: number;
  is_published: boolean;
  attempt_count: number;
  avg_score_pct: number;
}

export interface TestAnalytics {
  attempt_count: number;
  avg_score_pct: number;
  pass_rate: number;
  question_analytics: {
    question_index: number;
    question_text: string;
    correct_rate: number;
    option_distribution: Record<string, number>;
    correct_option: string;
  }[];
}

export function useAdminTests(chapterId: string | undefined) {
  return useQuery<AdminTest>({
    queryKey: ["admin", "test", chapterId],
    queryFn: () => api.get(`/admin/tests/chapter/${chapterId}`).then((r) => r.data),
    enabled: !!chapterId,
    retry: false,
  });
}

export function useAllTests(filters?: { subject_id?: string; chapter_id?: string; is_published?: boolean }) {
  const params: Record<string, string> = {};
  if (filters?.subject_id) params.subject_id = filters.subject_id;
  if (filters?.chapter_id) params.chapter_id = filters.chapter_id;
  if (filters?.is_published !== undefined) params.is_published = String(filters.is_published);

  return useQuery<TestListItem[]>({
    queryKey: ["admin", "tests", "all", filters],
    queryFn: () => api.get("/admin/tests", { params }).then((r) => r.data),
  });
}

export function useTestAnalytics(testId: string | undefined) {
  return useQuery<TestAnalytics>({
    queryKey: ["admin", "test", "analytics", testId],
    queryFn: () => api.get(`/admin/tests/${testId}/analytics`).then((r) => r.data),
    enabled: !!testId,
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

export function useDuplicateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ new_test_id: string }>(`/admin/tests/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tests", "all"] }),
  });
}
