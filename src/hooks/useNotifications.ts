import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";

export function useSendNotification() {
  return useMutation({
    mutationFn: (vars: { user_id?: string; title: string; body: string }) =>
      api.post("/admin/notifications/send", vars).then((r) => r.data),
  });
}
