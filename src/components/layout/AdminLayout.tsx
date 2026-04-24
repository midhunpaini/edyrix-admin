import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PenLine,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "../../store/authStore";
import { useAdminDoubts } from "../../hooks/useDoubts";
import { TopBar } from "./TopBar";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/content", icon: BookOpen, label: "Content" },
  { to: "/students", icon: Users, label: "Students" },
  { to: "/tests", icon: PenLine, label: "Tests" },
  { to: "/doubts", icon: MessageCircle, label: "Doubts" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: doubts } = useAdminDoubts("pending");
  const pendingCount = doubts?.total ?? 0;

  return (
    <div className="flex flex-col h-full bg-teal text-white w-60">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight">Edyrix</h1>
            <p className="text-white/60 text-xs font-body mt-0.5">Admin Portal</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors",
                isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {label === "Doubts" && pendingCount > 0 && (
              <span className="bg-amber text-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => { clearAuth(); navigate("/login"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden sidebar:flex sidebar:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sidebar:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
