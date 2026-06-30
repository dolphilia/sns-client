import { useInfiniteQuery } from "@tanstack/react-query";
import { agent } from "@/lib/agent";
import { DISCOVER_FEED_URI, useSettingsStore } from "@/stores/settingsStore";
import { applyKeywordFilter } from "@/lib/filters/keywordFilter";
import { isNsfwPost } from "@/lib/filters/nsfwFilter";
import { normalizeFeedUri } from "@/lib/bskyFeed";
import { hasPostImage } from "@/lib/postEmbeds";

const PAGE_SIZE = 30;

export function useTimeline() {
  const feedSettings = useSettingsStore((s) => s.feedSettings);
  const mutedKeywords = useSettingsStore((s) => s.mutedKeywords);

  return useInfiniteQuery({
    queryKey: ["timeline", feedSettings, mutedKeywords],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const {
        feedSource,
        customFeedUri,
        selectedCustomFeedUri,
        excludeReposts,
        onlyImagePosts,
        excludeNsfwPosts,
      } = feedSettings;
      const normalizedCustomFeedUri = normalizeFeedUri(
        selectedCustomFeedUri || customFeedUri
      );

      const res =
        feedSource === "following"
          ? await agent.getTimeline({ limit: PAGE_SIZE, cursor })
          : await agent.app.bsky.feed.getFeed({
              feed:
                feedSource === "discover"
                  ? DISCOVER_FEED_URI
                  : normalizedCustomFeedUri,
              limit: PAGE_SIZE,
              cursor,
            });

      const feed = res.data.feed.filter((item) => {
        if (excludeReposts && item.reason?.$type === "app.bsky.feed.defs#reasonRepost") {
          return false;
        }

        if (onlyImagePosts && !hasPostImage(item.post)) {
          return false;
        }

        if (excludeNsfwPosts && isNsfwPost(item.post)) {
          return false;
        }

        const text =
          item.post.record && typeof item.post.record === "object"
            ? (item.post.record as { text?: string }).text ?? ""
            : "";
        return !applyKeywordFilter(text, mutedKeywords).filtered;
      });

      return { feed, cursor: res.data.cursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled:
      feedSettings.feedSource !== "custom" ||
      Boolean(
        normalizeFeedUri(
          feedSettings.selectedCustomFeedUri || feedSettings.customFeedUri
        )
      ),
  });
}
