import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import type { TreeClass } from "../types";

export function useContentTree(boardId: string | undefined) {
  return useQuery<TreeClass[]>({
    queryKey: ["admin", "content-tree", boardId],
    queryFn: () =>
      api.get("/admin/content/tree", { params: { board_id: boardId } }).then((r) => r.data),
    enabled: !!boardId,
  });
}
