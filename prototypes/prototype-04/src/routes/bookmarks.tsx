import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post/PostCard";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useAuthStore } from "@/stores/authStore";
import { agent } from "@/lib/agent";

function BookmarksPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks", bookmarks],
    queryFn: async () => {
      if (bookmarks.length === 0) return [];
      const results = await Promise.allSettled(
        bookmarks.map((uri) => agent.getPosts({ uris: [uri] }))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof agent.getPosts>>> =>
          r.status === "fulfilled"
        )
        .flatMap((r) => r.value.data.posts)
        .map((post) => ({ post, reply: undefined, reason: undefined }));
    },
    enabled: bookmarks.length > 0,
  });

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">ブックマーク</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            保存した投稿はまだありません
          </div>
        )}

        {isLoading && bookmarks.length > 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            読み込み中...
          </div>
        )}

        {data?.map((item) => (
          <PostCard key={item.post.uri} item={item} />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/bookmarks")({ component: BookmarksPage });
