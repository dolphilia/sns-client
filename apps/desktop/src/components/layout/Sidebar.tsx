import { Home, Bell, User, Settings, LogOut, Bookmark, BookText, Heart, Users, Compass } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { agent } from "@/lib/agent";

const navItems = [
  { to: "/home",          icon: Home,      label: "ホーム" },
  { to: "/discover",      icon: Compass,   label: "発見" },
  { to: "/my-likes",      icon: Heart,     label: "いいね" },
  { to: "/bookmarks",     icon: Bookmark,  label: "ブックマーク" },
  { to: "/connections",   icon: Users,     label: "繋がり" },
  { to: "/notifications", icon: Bell,      label: "通知" },
  { to: "/my-posts",      icon: BookText,  label: "自分の投稿" },
  { to: "/profile",       icon: User,      label: "プロフィール" },
  { to: "/settings",      icon: Settings,  label: "設定" },
];

export function Sidebar() {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: profileData } = useQuery({
    queryKey: ["profile", session?.did],
    queryFn: () => agent.getProfile({ actor: session!.did }),
    enabled: Boolean(session?.did),
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileData?.data;
  const accountLabel = profile?.displayName || session?.handle;

  return (
    <aside className="h-dvh w-60 shrink-0 flex flex-col border-r border-border px-3 py-4">
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

      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar} alt={accountLabel} />
            <AvatarFallback className="text-xs">
              {accountLabel?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{accountLabel}</p>
            {profile?.displayName && (
              <p className="text-[11px] text-muted-foreground truncate">@{session?.handle}</p>
            )}
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
