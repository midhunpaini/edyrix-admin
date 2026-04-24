import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import type { StudentRow } from "../types";

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

export function useStudent(id: string | undefined) {
  return useQuery<StudentRow>({
    queryKey: ["admin", "student", id],
    queryFn: () => api.get(`/admin/students/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
