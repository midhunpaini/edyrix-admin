import { useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Icons } from "../../lib/icons";
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
  const roleLabel = user?.role?.replace(/_/g, " ") ?? "Admin";

  return (
    <header className="h-16 bg-white border-b border-ink/8 flex items-center px-4 gap-2 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="sidebar:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-ink/5 active:scale-95 transition-all"
        aria-label="Open menu"
      >
        <Icon name={Icons.menu} size={24} />
      </button>

      <h2 className="font-display font-bold text-lg text-ink flex-1 ml-2">{title}</h2>

      <div className="flex items-center gap-1">
        <button
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-ink/5 active:scale-95 transition-all text-ink-3"
          aria-label="Notifications"
        >
          <Icon name={Icons.notification} size={24} />
        </button>
        <button
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-ink/5 active:scale-95 transition-all text-ink-3"
          aria-label="Settings"
        >
          <Icon name={Icons.settings} size={24} />
        </button>

        <div className="flex items-center gap-3 ml-1 pl-3 border-l border-ink/8">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold font-body text-ink leading-none">{user?.name}</p>
            <p className="text-xs text-ink-3 font-body mt-0.5 capitalize">{roleLabel}</p>
          </div>
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
