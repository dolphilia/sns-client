import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { WaitingScreen } from "@/components/edition/WaitingScreen";
import { EditionReader } from "@/components/edition/EditionReader";
import { useEditionStore } from "@/stores/editionStore";
import { useSettingsStore, DISCOVER_FEED_URI } from "@/stores/settingsStore";
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
      const { feedSource, customFeedUri, size, includeReposts } = editionSettings;

      let posts: AppBskyFeedDefs.FeedViewPost[];

      if (feedSource === "following") {
        const res = await agent.getTimeline({ limit: size });
        posts = res.data.feed;
      } else {
        const feedUri =
          feedSource === "discover" ? DISCOVER_FEED_URI : customFeedUri.trim();
        if (!feedUri) {
          setFetchError("フィードURIが設定されていません");
          return;
        }
        const res = await agent.app.bsky.feed.getFeed({ feed: feedUri, limit: size });
        posts = res.data.feed;
      }

      if (!includeReposts) {
        posts = posts.filter(
          (item) => item.reason?.$type !== "app.bsky.feed.defs#reasonRepost"
        );
      }

      const myDid = session.did;
      posts = posts.filter((item) => item.post.author.did !== myDid);

      fetchEdition(posts);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "フィードの取得に失敗しました"
      );
    } finally {
      setFetching(false);
    }
  }, [
    editionSettings,
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
