import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { StudentRow, StudentDetail } from "../types";

interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  class_number?: number | null;
  subscription_status?: string | null;
}

interface StudentListResponse {
  total: number;
  students: StudentRow[];
}

export function useStudents(filters: StudentFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );
  return useQuery<StudentListResponse>({
    queryKey: ["admin", "students", filters],
    queryFn: () => api.get("/admin/students", { params }).then((r) => r.data),
  });
}

export function useStudentDetail(id: string | undefined) {
  return useQuery<StudentDetail>({
    queryKey: ["admin", "student", "detail", id],
    queryFn: () => api.get(`/admin/students/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useGrantAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, plan_id, duration_days, reason }: { studentId: string; plan_id: string; duration_days: number; reason: string }) =>
      api.post(`/admin/students/${studentId}/grant-access`, { plan_id, duration_days, reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "student", "detail"] }),
  });
}

export function useRevokeAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      api.post(`/admin/students/${studentId}/revoke-access`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "student", "detail"] }),
  });
}

export function useSuspendStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, reason }: { studentId: string; reason: string }) =>
      api.put(`/admin/students/${studentId}/suspend`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "student", "detail"] }),
  });
}

export function useUnsuspendStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      api.put(`/admin/students/${studentId}/unsuspend`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "student", "detail"] }),
  });
}
