import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "../types";

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: AdminUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setUser: (user, token) => {
        if (user.role !== "admin") {
          set({ user: null, token: null });
          window.location.href = "/login";
          return;
        }
        set({ user, token });
      },
      clearAuth: () => set({ user: null, token: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "edyrix_admin_auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
