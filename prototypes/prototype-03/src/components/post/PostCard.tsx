import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { useLike } from "@/hooks/usePostActions";
import { useSettingsStore } from "@/stores/settingsStore";
import { useFilterStore } from "@/stores/filterStore";
import { applyKeywordFilter } from "@/lib/filters/keywordFilter";
import { FilteredPostCard } from "@/components/post/FilteredPostCard";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  skipFilter?: boolean;
}

export function PostCard({ item, skipFilter = false }: Props) {
  const { post } = item;
  const record = post.record as AppBskyFeedPost.Record;
  const author = post.author;
  const viewer = post.viewer;
  const hideEngagementCounts = useSettingsStore((s) => s.hideEngagementCounts);
  const filterSettings = useSettingsStore((s) => s.filterSettings);
  const mlResult = useFilterStore((s) => s.mlResults[post.uri]);
  const isException = useFilterStore((s) => s.exceptions.has(post.uri));
  const likeMutation = useLike();
  const navigate = useNavigate();

  // フィルタ判定
  if (!skipFilter && !isException && filterSettings.enabled) {
    if (filterSettings.layer1Enabled) {
      const result = applyKeywordFilter(record.text, filterSettings.customKeywords);
      if (result.filtered) {
        return (
          <FilteredPostCard
            item={item}
            reason={result.reason}
            matchedKeyword={result.matchedKeyword}
          />
        );
      }
    }
    if (filterSettings.layer2Enabled && mlResult?.filtered) {
      return (
        <FilteredPostCard
          item={item}
          reason={mlResult.reason}
          matchedLabel={mlResult.matchedLabel}
          score={mlResult.score}
        />
      );
    }
  }

  const liked = Boolean(viewer?.like);

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
      className="border-b border-border px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={author.avatar} alt={author.displayName ?? author.handle} />
          <AvatarFallback>
            {(author.displayName ?? author.handle).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-semibold text-sm truncate">
              {author.displayName ?? author.handle}
            </span>
            <span className="text-muted-foreground text-xs truncate">
              @{author.handle}
            </span>
            <span className="text-muted-foreground text-xs">・{relativeTime}</span>
          </div>

          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {record.text}
          </p>

          {/* アクションバー：いいね + ブックマークのみ */}
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
        </div>
      </div>
    </article>
  );
}
