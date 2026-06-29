import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post/PostCard";
import { FeedContent, FeedPosts } from "@/components/feed/FeedLayout";
import { useAuthStore } from "@/stores/authStore";
import { useTimeline } from "@/hooks/useTimeline";

function HomePage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTimeline();

  const posts = data?.pages.flatMap((page) => page.feed) ?? [];

  useEffect(() => {
    const root = scrollRootRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root,
        rootMargin: "480px 0px",
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-base">ホーム</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              新着は自動で差し込まれません
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            更新
          </Button>
        </div>
      </header>

      <div ref={scrollRootRef} className="flex-1 overflow-y-auto">
        <FeedContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            読み込み中...
          </div>
        )}

        {error && (
          <div className="px-4 py-6 text-sm text-destructive">
            フィードの取得に失敗しました
          </div>
        )}

        {!isLoading && posts.length === 0 && !error && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            表示できる投稿がありません
          </div>
        )}

        <FeedPosts>
          {posts.map((item) => (
            <PostCard key={item.post.uri} item={item} />
          ))}
        </FeedPosts>

        <div ref={loadMoreRef} className="flex justify-center py-6">
          {hasNextPage ? (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "読み込み中..." : "過去の投稿を読み込む"}
            </Button>
          ) : (
            posts.length > 0 && (
              <p className="text-xs text-muted-foreground">これ以上読み込めません</p>
            )
          )}
        </div>
        </FeedContent>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/home")({ component: HomePage });
