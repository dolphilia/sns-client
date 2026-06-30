import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post/PostCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { FeedContent, FeedPosts } from "@/components/feed/FeedLayout";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { agent } from "@/lib/agent";
import type { AppBskyFeedDefs } from "@atproto/api";

function MyLikesPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["my-likes", session.did],
      queryFn: ({ pageParam }) =>
        agent.app.bsky.feed.getActorLikes({
          actor: session.did,
          limit: 30,
          cursor: pageParam as string | undefined,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.data.cursor,
    });

  const posts: AppBskyFeedDefs.FeedViewPost[] =
    data?.pages.flatMap((p) => p.data.feed) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">いいね</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          自分がいいねした投稿
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FeedContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            読み込み中...
          </div>
        )}

        {error && (
          <div className="px-4 py-6 text-sm text-destructive">
            いいね一覧の取得に失敗しました
          </div>
        )}

        {!isLoading && posts.length === 0 && !error && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            いいねした投稿はまだありません
          </div>
        )}

        <FeedPosts>
          {posts.map((item) => (
            <PostCard
              key={item.post.uri}
              item={item}
              headerAction={<FollowButton actor={item.post.author} />}
            />
          ))}
        </FeedPosts>

        <div className="flex justify-center py-6">
          {hasNextPage ? (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "読み込み中..." : "もっと読む"}
            </Button>
          ) : (
            posts.length > 0 && (
              <p className="text-xs text-muted-foreground">すべて表示しました</p>
            )
          )}
        </div>
        </FeedContent>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/my-likes")({ component: MyLikesPage });
