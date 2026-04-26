import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "../types";

const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "content_manager"]);

export function isAdminUser(user: AdminUser | null): user is AdminUser {
  return !!user && ADMIN_ROLES.has(user.role);
}

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
        if (!isAdminUser(user)) {
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
