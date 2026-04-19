import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { agent } from "@/lib/agent";
import type { AppBskyFeedDefs } from "@atproto/api";

function MyPostsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["my-posts", session.handle],
      queryFn: ({ pageParam }) =>
        agent.getAuthorFeed({
          actor: session.handle,
          limit: 30,
          cursor: pageParam as string | undefined,
          filter: "posts_no_replies",
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.data.cursor,
    });

  const posts: AppBskyFeedDefs.FeedViewPost[] =
    data?.pages.flatMap((p) => p.data.feed) ?? [];

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">自分の投稿</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            読み込み中...
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            投稿がありません
          </div>
        )}

        {posts.map((item) => (
          <PostCard key={item.post.uri} item={item} />
        ))}

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
      </div>
    </div>
  );
}

export const Route = createFileRoute("/my-posts")({ component: MyPostsPage });
