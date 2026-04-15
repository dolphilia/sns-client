import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agent } from "@/lib/agent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/post/PostCard";
import { useAuthStore } from "@/stores/authStore";

function ProfilePage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const { data: profileData } = useQuery({
    queryKey: ["profile", session.did],
    queryFn: () => agent.getProfile({ actor: session.did }),
  });

  const { data: feedData } = useQuery({
    queryKey: ["author-feed", session.did],
    queryFn: () => agent.getAuthorFeed({ actor: session.did, limit: 30, filter: "posts_no_replies" }),
  });

  const profile = profileData?.data;
  const posts = feedData?.data.feed ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">プロフィール</h1>
      </header>

      {/* バナー */}
      <div className="h-32 bg-muted">
        {profile?.banner && (
          <img src={profile.banner} alt="バナー" className="w-full h-full object-cover" />
        )}
      </div>

      {/* プロフィール情報 */}
      <div className="px-4 pb-4 border-b border-border">
        <Avatar className="w-16 h-16 -mt-8 ring-4 ring-background">
          <AvatarImage src={profile?.avatar} alt={profile?.handle} />
          <AvatarFallback className="text-xl">
            {profile?.handle?.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3">
          <p className="font-bold text-lg">{profile?.displayName ?? profile?.handle}</p>
          <p className="text-muted-foreground text-sm">@{profile?.handle}</p>
          {profile?.description && (
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{profile.description}</p>
          )}
          {/* フォロワー数は非表示。投稿数のみ表示 */}
          {profile?.postsCount != null && (
            <p className="mt-2 text-sm text-muted-foreground">
              投稿 <span className="text-foreground font-medium">{profile.postsCount}</span>
            </p>
          )}
        </div>
      </div>

      {/* 投稿一覧 */}
      {posts.map((item) => (
        <PostCard key={item.post.uri} item={item} />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/profile")({ component: ProfilePage });
