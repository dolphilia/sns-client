import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agent } from "@/lib/agent";
import type { AppBskyFeedDefs } from "@atproto/api";

type FeedPage = { data: { feed: AppBskyFeedDefs.FeedViewPost[]; cursor?: string } };
type InfiniteData = { pages: FeedPage[]; pageParams: unknown[] };

function toggleLikeInCache(data: InfiniteData, uri: string, liked: boolean, likeUri?: string): InfiniteData {
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
              likeCount: (item.post.likeCount ?? 0) + (liked ? 1 : -1),
              viewer: { ...item.post.viewer, like: liked ? likeUri : undefined },
            },
          };
        }),
      },
    })),
  };
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
      await queryClient.cancelQueries({ queryKey: ["timeline"] });
      const prev = queryClient.getQueryData<InfiniteData>(["timeline"]);
      queryClient.setQueryData<InfiniteData>(["timeline"], (old) =>
        old ? toggleLikeInCache(old, uri, !liked, liked ? undefined : likeUri) : old
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
