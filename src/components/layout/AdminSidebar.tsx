import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { Icon } from "../ui/Icon";
import { Icons } from "../../lib/icons";
import { useAuthStore } from "../../store/authStore";
import { useDoubtStats } from "../../hooks/useDoubts";
import { TopBar } from "./TopBar";

const NAV_ITEMS = [
  { to: "/dashboard", iconName: Icons.dashboard, label: "Dashboard" },
  { to: "/content", iconName: Icons.content, label: "Content" },
  { to: "/students", iconName: Icons.students, label: "Students" },
  { to: "/tests", iconName: Icons.questions, label: "Tests" },
  { to: "/doubts", iconName: Icons.doubtQueue, label: "Doubts" },
  { to: "/revenue", iconName: Icons.revenue, label: "Revenue" },
  { to: "/notifications", iconName: Icons.notifications, label: "Notifications" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: stats } = useDoubtStats();
  const pendingCount = stats?.pending_count ?? 0;

  return (
    <div className="flex flex-col h-full bg-white border-r border-ink/8 w-60">
      <div className="px-5 py-5 border-b border-ink/8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-teal">Edyrix</h1>
            <p className="text-ink-3 text-xs font-body mt-0.5">Admin Portal</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-ink/5 active:scale-95 transition-all" aria-label="Close menu">
              <Icon name={Icons.close} size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, iconName, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 rounded-xl min-h-[48px] text-sm font-body font-medium transition-colors",
                isActive ? "bg-teal text-white" : "text-ink-2 hover:bg-ink/5"
              )
            }
          >
            <Icon name={iconName} size={24} aria-hidden />
            <span className="flex-1">{label}</span>
            {label === "Doubts" && pendingCount > 0 && (
              <span className="bg-rose text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-ink/8">
        <button
          onClick={() => { clearAuth(); navigate("/login"); }}
          className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-body font-medium text-ink-2 hover:bg-ink/5 transition-colors"
        >
          <Icon name={Icons.logout} size={24} aria-hidden />
          Sign Out
        </button>
      </div>

      {/* Settings - separated */}
      <div className="px-3 pb-4">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 px-3 rounded-xl min-h-[48px] text-sm font-body font-medium transition-colors border-t border-ink/8 pt-3 mt-3",
              isActive ? "bg-teal text-white" : "text-ink-2 hover:bg-ink/5"
            )
          }
        >
          <Icon name={Icons.settings} size={24} aria-hidden />
          <span className="flex-1">Settings</span>
        </NavLink>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-overflow-hidden">
      <div className="hidden sidebar:flex sidebar:flex-shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sidebar:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
