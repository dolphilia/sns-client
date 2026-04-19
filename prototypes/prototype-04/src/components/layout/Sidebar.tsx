import { Home, Bell, User, Settings, LogOut, ShieldCheck, Bookmark, BookText } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useScreeningStore } from "@/stores/screeningStore";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home",          icon: Home,      label: "ホーム" },
  { to: "/my-posts",      icon: BookText,  label: "自分の投稿" },
  { to: "/bookmarks",     icon: Bookmark,  label: "ブックマーク" },
  { to: "/notifications", icon: Bell,      label: "通知" },
  { to: "/profile",       icon: User,      label: "プロフィール" },
  { to: "/settings",      icon: Settings,  label: "設定" },
];

export function Sidebar() {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const filterEnabled = useSettingsStore((s) => s.filterSettings.enabled);
  const screeningState = useScreeningStore((s) => s.screeningState);
  const approvedCount = useScreeningStore((s) => s.approvedPosts.length);
  const screenedCount = useScreeningStore((s) => s.screenedCount);

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border px-3 py-4">
      <div className="px-3 mb-6">
        <span className="text-xl font-bold tracking-tight">🦋 bsky</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = currentPath.startsWith(to);
          return (
            <Link key={to} to={to}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={20} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {filterEnabled && screeningState !== "idle" && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck size={13} className="text-amber-500" />
            <span className="font-medium text-foreground">吟味フィルター</span>
            {screeningState === "screening" && (
              <span className="ml-auto text-[10px] text-blue-500">吟味中…</span>
            )}
          </div>
          <p>
            {approvedCount} 件 届きました
            {screenedCount > 0 && ` / ${screenedCount} 件吟味済`}
          </p>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt={session?.handle} />
            <AvatarFallback className="text-xs">
              {session?.handle?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{session?.handle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={logout}
            title="ログアウト"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
