import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { useLike } from "@/hooks/usePostActions";
import { useSettingsStore } from "@/stores/settingsStore";
import type {
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atproto/api";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  headerAction?: React.ReactNode;
}

type PostEmbed = NonNullable<AppBskyFeedDefs.PostView["embed"]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImagesView(embed: unknown): embed is AppBskyEmbedImages.View {
  return (
    isRecord(embed) &&
    embed.$type === "app.bsky.embed.images#view" &&
    Array.isArray(embed.images)
  );
}

function isRecordWithMediaView(embed: unknown): embed is AppBskyEmbedRecordWithMedia.View {
  return (
    isRecord(embed) &&
    embed.$type === "app.bsky.embed.recordWithMedia#view" &&
    isRecord(embed.media)
  );
}

function getFirstImage(embed: PostEmbed | undefined): AppBskyEmbedImages.ViewImage | null {
  if (isImagesView(embed)) {
    return embed.images[0] ?? null;
  }

  if (isRecordWithMediaView(embed) && isImagesView(embed.media)) {
    return embed.media.images[0] ?? null;
  }

  return null;
}

// 投稿カード内では AI 判定を行わず、通常の SNS 操作を最小限に絞る。
export function PostCard({ item, headerAction }: Props) {
  const { post } = item;
  const record = post.record as AppBskyFeedPost.Record;
  const author = post.author;
  const viewer = post.viewer;
  const hideEngagementCounts = useSettingsStore((s) => s.hideEngagementCounts);
  const display = useSettingsStore((s) => s.feedDisplaySettings);
  const likeMutation = useLike();
  const navigate = useNavigate();

  const liked = Boolean(viewer?.like);
  const firstImage = getFirstImage(post.embed);

  const relativeTime = formatDistanceToNow(new Date(record.createdAt), {
    addSuffix: true,
    locale: ja,
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate({
      uri: post.uri,
      cid: post.cid,
      liked,
      likeUri: viewer?.like,
    });
  };

  const handleCardClick = () => {
    const rkey = post.uri.split("/").pop();
    navigate({
      to: "/post/$handle/$rkey",
      params: { handle: author.handle, rkey: rkey! },
    });
  };

  return (
    <article
      className={cn(
        "cursor-pointer border-border px-4 py-3 transition-colors hover:bg-muted/30",
        display.grid ? "h-full rounded-md border bg-background" : "border-b"
      )}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        {display.showAvatar && (
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={author.avatar} alt={author.displayName ?? author.handle} />
            <AvatarFallback>
              {(author.displayName ?? author.handle).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-baseline gap-1 flex-wrap min-w-0">
              {display.showDisplayName && (
                <span className="font-semibold text-sm truncate">
                  {author.displayName ?? author.handle}
                </span>
              )}
              {display.showHandle && (
                <span className="text-muted-foreground text-xs truncate">
                  @{author.handle}
                </span>
              )}
              {display.showTimestamp && (
                <span className="text-muted-foreground text-xs">
                  {(display.showDisplayName || display.showHandle) && "・"}
                  {relativeTime}
                </span>
              )}
            </div>
            {display.showActions && headerAction && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {headerAction}
              </div>
            )}
          </div>

          {display.showText && (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {record.text}
            </p>
          )}

          {display.showImages && firstImage && (
            <div
              className={cn(
                "mt-3 overflow-hidden rounded-md border border-border bg-muted/30",
                display.cropImagesToSquare && "aspect-square"
              )}
            >
              <img
                src={firstImage.thumb}
                alt={firstImage.alt || "投稿画像"}
                loading="lazy"
                className={cn(
                  "block w-full object-cover",
                  display.cropImagesToSquare ? "h-full" : "max-h-[360px]"
                )}
              />
            </div>
          )}

          {/* アクションバー：いいね + ブックマークのみ */}
          {display.showActions && (
          <div className="flex items-center gap-1 mt-2 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 hover:bg-red-50",
                liked
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
              onClick={handleLike}
              disabled={likeMutation.isPending}
            >
              <Heart size={16} className={liked ? "fill-current" : ""} />
              {!hideEngagementCounts && post.likeCount != null && (
                <span className="text-xs">{post.likeCount}</span>
              )}
            </Button>

            <BookmarkButton uri={post.uri} />
          </div>
          )}
        </div>
      </div>
    </article>
  );
}
