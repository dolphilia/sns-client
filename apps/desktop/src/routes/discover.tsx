import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FeedContent, FeedPosts } from "@/components/feed/FeedLayout";
import { PostCard } from "@/components/post/PostCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { agent } from "@/lib/agent";
import { normalizeFeedUri } from "@/lib/bskyFeed";
import { applyKeywordFilter } from "@/lib/filters/keywordFilter";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";

const PAGE_SIZE = 30;
const MAX_POSTS_PER_AUTHOR_PER_PAGE = 2;

function getPostText(item: AppBskyFeedDefs.FeedViewPost) {
  return item.post.record && typeof item.post.record === "object"
    ? (item.post.record as AppBskyFeedPost.Record).text ?? ""
    : "";
}

function filterDiscoverFeed(
  feed: AppBskyFeedDefs.FeedViewPost[],
  sessionDid: string,
  mutedKeywords: string[]
) {
  const seenPostUris = new Set<string>();
  const authorCounts = new Map<string, number>();

  return feed.filter((item) => {
    const { post } = item;
    const authorDid = post.author.did;

    if (seenPostUris.has(post.uri)) return false;
    seenPostUris.add(post.uri);

    if (authorDid === sessionDid) return false;
    if (post.author.viewer?.following) return false;

    const text = getPostText(item);
    if (applyKeywordFilter(text, mutedKeywords).filtered) return false;

    const authorCount = authorCounts.get(authorDid) ?? 0;
    if (authorCount >= MAX_POSTS_PER_AUTHOR_PER_PAGE) return false;
    authorCounts.set(authorDid, authorCount + 1);

    return true;
  });
}

function DiscoverPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const navigate = useNavigate();
  const discoverSettings = useSettingsStore((s) => s.discoverSettings);
  const mutedKeywords = useSettingsStore((s) => s.mutedKeywords);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feedUri = normalizeFeedUri(
    discoverSettings.selectedFeedUri || discoverSettings.feedUris[0] || ""
  );
  const isConfigured = Boolean(feedUri);

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["discover", session.did, feedUri, mutedKeywords],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.feed.getFeed({
        feed: feedUri,
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      });

      return {
        feed: filterDiscoverFeed(res.data.feed, session.did, mutedKeywords),
        cursor: res.data.cursor,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: isConfigured,
  });

  const posts = useMemo(() => {
    const seen = new Set<string>();
    const items = data?.pages.flatMap((page) => page.feed) ?? [];
    return items.filter((item) => {
      if (seen.has(item.post.uri)) return false;
      seen.add(item.post.uri);
      return true;
    });
  }, [data]);

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
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold">発見</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              登録フィードから、まだフォローしていない投稿主を見つけます
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetch()}
            disabled={!isConfigured || isRefetching}
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            更新
          </Button>
        </div>
      </header>

      <div ref={scrollRootRef} className="flex-1 overflow-y-auto">
        <FeedContent>
        {!isConfigured && (
          <div className="px-4 py-10">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">発見に使うフィード URI が未設定です</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                設定画面で Bluesky のカスタムフィード URI を登録すると、未フォロー投稿主の投稿を表示します。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate({ to: "/settings" })}
              >
                設定を開く
              </Button>
            </div>
          </div>
        )}

        {isConfigured && isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            読み込み中...
          </div>
        )}

        {isConfigured && error && (
          <div className="px-4 py-6 text-sm text-destructive">
            発見フィードの取得に失敗しました
          </div>
        )}

        {isConfigured && !isLoading && !error && posts.length === 0 && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            表示できる投稿がありません
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

        {isConfigured && !isLoading && !error && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
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
        )}
        </FeedContent>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/discover")({ component: DiscoverPage });
