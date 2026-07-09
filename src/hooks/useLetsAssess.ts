import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { LetsAssessAdminQuestion } from "../types";

export function useAdminLetsAssess(chapterId: string | undefined) {
  return useQuery<LetsAssessAdminQuestion[]>({
    queryKey: ["lets-assess", chapterId],
    queryFn: () =>
      api
        .get("/admin/lets-assess", { params: { chapter_id: chapterId } })
        .then((r) => r.data.data),
    enabled: !!chapterId,
  });
}

interface CreateLetsAssessBody {
  chapter_id: string;
  topic_id?: string;
  question_number: number;
  question_text: string;
  question_text_ml?: string;
  marks?: number;
  model_answer: string;
  model_answer_ml?: string;
  walkthrough_video_id?: string;
  walkthrough_start_seconds?: number;
  order_index?: number;
}

interface UpdateLetsAssessBody {
  id: string;
  chapter_id: string;
  topic_id?: string;
  question_number?: number;
  question_text?: string;
  question_text_ml?: string;
  marks?: number;
  model_answer?: string;
  model_answer_ml?: string;
  walkthrough_video_id?: string;
  walkthrough_start_seconds?: number;
  order_index?: number;
}

export function useCreateLetsAssess() {
  const qc = useQueryClient();
  return useMutation<LetsAssessAdminQuestion, Error, CreateLetsAssessBody>({
    mutationFn: (body) => api.post("/admin/lets-assess", body).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lets-assess", vars.chapter_id] });
    },
  });
}

export function useUpdateLetsAssess() {
  const qc = useQueryClient();
  return useMutation<LetsAssessAdminQuestion, Error, UpdateLetsAssessBody>({
    mutationFn: ({ id, chapter_id: _cid, ...body }) =>
      api.put(`/admin/lets-assess/${id}`, body).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lets-assess", vars.chapter_id] });
    },
  });
}

export function useDeleteLetsAssess() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; chapter_id: string }>({
    mutationFn: ({ id }) => api.delete(`/admin/lets-assess/${id}`).then(() => undefined),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lets-assess", vars.chapter_id] });
    },
  });
}
