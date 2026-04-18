import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { WaitingScreen } from "@/components/edition/WaitingScreen";
import { EditionReader } from "@/components/edition/EditionReader";
import { useEditionStore } from "@/stores/editionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { agent } from "@/lib/agent";
import type { AppBskyFeedDefs } from "@atproto/api";
import type { CompletionType } from "@/stores/editionStore";

function HomePage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const edition = useEditionStore((s) => s.currentEdition);
  const isFetching = useEditionStore((s) => s.isFetching);
  const fetchError = useEditionStore((s) => s.fetchError);
  const fetchEdition = useEditionStore((s) => s.fetchEdition);
  const clearEdition = useEditionStore((s) => s.clearEdition);
  const setFetching = useEditionStore((s) => s.setFetching);
  const setFetchError = useEditionStore((s) => s.setFetchError);

  const editionSettings = useSettingsStore((s) => s.editionSettings);

  const handleStart = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await agent.getTimeline({ limit: editionSettings.size });
      let posts: AppBskyFeedDefs.FeedViewPost[] = res.data.feed;

      // リポストを除外（設定に応じて）
      if (!editionSettings.includeReposts) {
        posts = posts.filter(
          (item) => item.reason?.$type !== "app.bsky.feed.defs#reasonRepost"
        );
      }

      // 自分の投稿を除外（タイムラインには含めない）
      const myDid = session.did;
      posts = posts.filter((item) => item.post.author.did !== myDid);

      // Layer 1 フィルタを事前適用（フィルタ済み投稿は号から除外ではなく、PostCard 側で折り畳み）
      // ※ 除外はせず PostCard の既存フィルタ表示ロジックに委ねる

      fetchEdition(posts);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "フィードの取得に失敗しました"
      );
    } finally {
      setFetching(false);
    }
  }, [
    editionSettings.size,
    editionSettings.includeReposts,
    fetchEdition,
    setFetching,
    setFetchError,
    session.did,
  ]);

  const handleClose = useCallback((_type: CompletionType) => {
    clearEdition();
  }, [clearEdition]);

  if (!edition || edition.status === "completed") {
    return (
      <div className="flex flex-col h-screen">
        <WaitingScreen
          onStart={handleStart}
          isLoading={isFetching}
          error={fetchError}
        />
      </div>
    );
  }

  return <EditionReader onClose={handleClose} />;
}

export const Route = createFileRoute("/home")({ component: HomePage });
