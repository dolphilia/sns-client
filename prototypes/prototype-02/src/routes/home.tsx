import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PostCard } from "@/components/post/PostCard";
import { PostForm } from "@/components/post/PostForm";
import { Button } from "@/components/ui/button";
import { useTimeline } from "@/hooks/useTimeline";
import { useMLFilterInit, useMLFilterPosts } from "@/hooks/useMLFilter";
import { useAuthStore } from "@/stores/authStore";
import type { AppBskyFeedDefs } from "@atproto/api";

function HomePage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useTimeline();
  const parentRef = useRef<HTMLDivElement>(null);

  const allPosts: AppBskyFeedDefs.FeedViewPost[] = data?.pages.flatMap((p) => p.data.feed) ?? [];

  // ML フィルタの初期化と非同期分析
  useMLFilterInit();
  useMLFilterPosts(allPosts);

  const virtualizer = useVirtualizer({
    count: allPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">ホーム</h1>
      </header>

      {/* 投稿フォーム */}
      <PostForm />

      {/* タイムライン */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            読み込み中...
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">
            タイムラインの取得に失敗しました
          </div>
        )}

        {!isLoading && allPosts.length > 0 && (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = allPosts[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <PostCard item={item} />
                </div>
              );
            })}
          </div>
        )}

        {/* もっと読む */}
        {!isLoading && (
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
              allPosts.length > 0 && (
                <p className="text-xs text-muted-foreground">すべて読みました</p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/home")({ component: HomePage });
