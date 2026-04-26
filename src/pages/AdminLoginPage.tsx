import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import api from "../api/axios";
import { isAdminUser, useAuthStore } from "../store/authStore";
import type { AdminUser } from "../types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const res = await api.post<{ access_token: string; user: AdminUser }>(
        "/auth/admin/login",
        { email: values.email, password: values.password }
      );

      if (!isAdminUser(res.data.user)) {
        toast.error("Access denied — admin accounts only");
        return;
      }

      setUser(res.data.user, res.data.access_token);
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Invalid email or password");
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
          <p className="text-sm text-ink-3 mb-6 font-body">Enter your admin credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="admin@edyrix.in"
                className="w-full h-11 px-3 rounded-lg border border-ink/15 font-body text-sm text-ink bg-white placeholder:text-ink-3 focus:outline-none focus:border-teal transition-colors"
              />
              {errors.email && (
                <p className="font-body text-xs text-rose mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 px-3 pr-10 rounded-lg border border-ink/15 font-body text-sm text-ink bg-white placeholder:text-ink-3 focus:outline-none focus:border-teal transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="font-body text-xs text-rose mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-teal text-white rounded-lg font-body font-semibold text-sm transition-all hover:bg-teal-dark active:scale-[0.98] disabled:opacity-60 flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
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
