import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/axios";
import { auth, GoogleAuthProvider, signInWithPopup } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import type { AdminUser } from "../types";

export function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const firebaseToken = await result.user.getIdToken();

      const res = await api.post<{ access_token: string; is_new_user: boolean; user: AdminUser }>(
        "/auth/google",
        { firebase_token: firebaseToken }
      );

      if (res.data.user.role !== "admin") {
        await auth.signOut();
        toast.error("Access denied — admin accounts only");
        return;
      }

      setUser(res.data.user, res.data.access_token);
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-teal">Edyrix</h1>
          <p className="text-ink-3 text-sm mt-1 font-body">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-8">
          <h2 className="font-display font-bold text-xl text-ink mb-1">Admin Sign In</h2>
          <p className="text-sm text-ink-3 mb-6 font-body">Google accounts with admin role only</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 border border-ink/15 rounded-lg font-body font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-ink border-t-transparent animate-spin" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>
        </div>

        <p className="text-center text-xs text-ink-3 mt-6 font-body">
          Student? Go to{" "}
          <a href={import.meta.env.VITE_STUDENT_APP_URL ?? "/"} className="text-teal underline">
            edyrix.in
          </a>
        </p>
      </div>
    </div>
  );
}
