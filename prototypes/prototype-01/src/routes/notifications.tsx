import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, Repeat2, UserPlus, MessageCircle, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { agent } from "@/lib/agent";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import type { AppBskyNotificationListNotifications } from "@atproto/api";

type Notification = AppBskyNotificationListNotifications.Notification;

const reasonIcon: Record<string, React.ReactNode> = {
  like:     <Heart size={16} className="text-red-500" />,
  repost:   <Repeat2 size={16} className="text-green-500" />,
  follow:   <UserPlus size={16} className="text-blue-500" />,
  mention:  <MessageCircle size={16} className="text-sky-500" />,
  reply:    <MessageCircle size={16} className="text-sky-500" />,
  quote:    <Quote size={16} className="text-purple-500" />,
};

const reasonLabel: Record<string, string> = {
  like:    "がいいねしました",
  repost:  "がリポストしました",
  follow:  "がフォローしました",
  mention: "があなたをメンションしました",
  reply:   "が返信しました",
  quote:   "が引用しました",
};

function NotificationsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => agent.listNotifications({ limit: 50 }),
  });

  // 画面を開いたら既読にする
  const seenMutation = useMutation({
    mutationFn: () => agent.updateSeenNotifications(new Date().toISOString()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    seenMutation.mutate();
  }, []);

  const notifications = data?.data.notifications ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">通知</h1>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          読み込み中...
        </div>
      )}

      {notifications.map((notif: Notification) => (
        <div
          key={notif.uri}
          className="flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors"
        >
          <div className="mt-1 w-5 shrink-0 flex justify-center">
            {reasonIcon[notif.reason] ?? <MessageCircle size={16} className="text-muted-foreground" />}
          </div>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={notif.author.avatar} alt={notif.author.handle} />
            <AvatarFallback className="text-xs">
              {notif.author.handle.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">
                {notif.author.displayName ?? notif.author.handle}
              </span>
              {reasonLabel[notif.reason] ?? ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(notif.indexedAt), { addSuffix: true, locale: ja })}
            </p>
          </div>
        </div>
      ))}

      {!isLoading && notifications.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          通知はありません
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });
