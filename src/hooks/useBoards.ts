import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { Board } from "../types";

export function useBoards() {
  return useQuery<Board[]>({
    queryKey: ["admin", "boards"],
    queryFn: () => api.get("/admin/boards").then((r) => r.data),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation<
    Board,
    Error,
    { name: string; code: string; display_order?: number; is_active?: boolean }
  >({
    mutationFn: (body) => api.post("/admin/boards", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "boards"] }),
  });
}
