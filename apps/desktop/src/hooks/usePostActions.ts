import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agent } from "@/lib/agent";
import type { AppBskyFeedDefs } from "@atproto/api";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

type FeedPage = { data: { feed: AppBskyFeedDefs.FeedViewPost[]; cursor?: string } };
type InfiniteData = { pages: FeedPage[]; pageParams: unknown[] };
type CacheSnapshot = { queryKey: QueryKey; data: unknown };

const postQueryRoots = new Set([
  "timeline",
  "discover",
  "my-likes",
  "my-posts",
  "author-feed",
  "bookmarks",
  "thread",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPostLikeTarget(value: Record<string, unknown>, uri: string) {
  return value.uri === uri && ("viewer" in value || "likeCount" in value || "author" in value);
}

function updatePostLikeValue<T>(value: T, uri: string, liked: boolean, likeUri?: string): T {
  function visit(current: unknown): unknown {
    if (Array.isArray(current)) {
      let changed = false;
      const next = current.map((item) => {
        const updated = visit(item);
        if (updated !== item) changed = true;
        return updated;
      });
      return changed ? next : current;
    }

    if (!isRecord(current)) return current;

    if (isPostLikeTarget(current, uri)) {
      const viewer = isRecord(current.viewer) ? current.viewer : {};
      const wasLiked = Boolean(viewer.like);
      const likeCount = typeof current.likeCount === "number" ? current.likeCount : 0;
      const delta = wasLiked === liked ? 0 : liked ? 1 : -1;

      return {
        ...current,
        likeCount: Math.max(0, likeCount + delta),
        viewer: {
          ...viewer,
          like: liked ? likeUri : undefined,
        },
      };
    }

    let changed = false;
    const next: Record<string, unknown> = { ...current };
    for (const [key, nested] of Object.entries(current)) {
      const updated = visit(nested);
      if (updated !== nested) {
        next[key] = updated;
        changed = true;
      }
    }

    return changed ? next : current;
  }

  return visit(value) as T;
}

function isPostQuery(queryKey: QueryKey) {
  return postQueryRoots.has(String(queryKey[0]));
}

async function cancelPostQueries(queryClient: QueryClient) {
  await queryClient.cancelQueries({ predicate: (query) => isPostQuery(query.queryKey) });
}

function snapshotPostQueries(queryClient: QueryClient): CacheSnapshot[] {
  return queryClient
    .getQueryCache()
    .findAll({ predicate: (query) => isPostQuery(query.queryKey) })
    .map((query) => ({
      queryKey: query.queryKey,
      data: queryClient.getQueryData(query.queryKey),
    }));
}

function updateLikeAcrossPostQueries(
  queryClient: QueryClient,
  uri: string,
  liked: boolean,
  likeUri?: string
) {
  queryClient
    .getQueryCache()
    .findAll({ predicate: (query) => isPostQuery(query.queryKey) })
    .forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old) =>
        old == null ? old : updatePostLikeValue(old, uri, liked, likeUri)
      );
    });
}

function restoreSnapshots(queryClient: QueryClient, snapshots: CacheSnapshot[]) {
  snapshots.forEach((snapshot) => {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
  });
}

function toggleRepostInCache(data: InfiniteData, uri: string, reposted: boolean, repostUri?: string): InfiniteData {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        feed: page.data.feed.map((item) => {
          if (item.post.uri !== uri) return item;
          return {
            ...item,
            post: {
              ...item.post,
              repostCount: (item.post.repostCount ?? 0) + (reposted ? 1 : -1),
              viewer: { ...item.post.viewer, repost: reposted ? repostUri : undefined },
            },
          };
        }),
      },
    })),
  };
}

export function useLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, cid, liked, likeUri }: { uri: string; cid: string; liked: boolean; likeUri?: string }) => {
      if (liked && likeUri) {
        await agent.deleteLike(likeUri);
        return { liked: false, likeUri: undefined };
      } else {
        const result = await agent.like(uri, cid);
        return { liked: true, likeUri: result.uri };
      }
    },
    onMutate: async ({ uri, liked, likeUri }) => {
      await cancelPostQueries(queryClient);
      const snapshots = snapshotPostQueries(queryClient);
      const nextLiked = !liked;
      const optimisticLikeUri = nextLiked
        ? likeUri ?? `optimistic-like:${encodeURIComponent(uri)}`
        : undefined;
      updateLikeAcrossPostQueries(queryClient, uri, nextLiked, optimisticLikeUri);
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshots) restoreSnapshots(queryClient, context.snapshots);
    },
    onSuccess: (result, vars) => {
      updateLikeAcrossPostQueries(queryClient, vars.uri, result.liked, result.likeUri);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["author-feed"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
    },
  });
}

export function useRepost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, cid, reposted, repostUri }: { uri: string; cid: string; reposted: boolean; repostUri?: string }) => {
      if (reposted && repostUri) {
        await agent.deleteRepost(repostUri);
        return { reposted: false };
      } else {
        const result = await agent.repost(uri, cid);
        return { reposted: true, repostUri: result.uri };
      }
    },
    onMutate: async ({ uri, reposted }) => {
      await queryClient.cancelQueries({ queryKey: ["timeline"] });
      const prev = queryClient.getQueryData<InfiniteData>(["timeline"]);
      queryClient.setQueryData<InfiniteData>(["timeline"], (old) =>
        old ? toggleRepostInCache(old, uri, !reposted) : old
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["timeline"], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}
