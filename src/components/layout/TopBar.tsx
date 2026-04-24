import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/content": "Content Manager",
  "/students": "Students",
  "/tests": "Question Editor",
  "/doubts": "Doubt Queue",
};

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="h-16 bg-white border-b border-ink/8 flex items-center px-6 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="sidebar:hidden p-1.5 rounded-lg hover:bg-ink/5 text-ink-3"
      >
        <Menu size={20} />
      </button>

      <h2 className="font-display font-bold text-lg text-ink flex-1">{title}</h2>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold font-body text-ink leading-none">{user?.name}</p>
          <p className="text-xs text-ink-3 font-body mt-0.5">Admin</p>
        </div>
        {user?.avatar_url ? (
          <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
        )}
      </div>
    </header>
  );
}
