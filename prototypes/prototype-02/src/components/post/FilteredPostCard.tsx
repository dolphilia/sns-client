import { useState } from "react";
import { ShieldAlert, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/stores/filterStore";
import type { FilterReason } from "@/lib/filters/keywordFilter";
import type { AppBskyFeedDefs } from "@atproto/api";
import { PostCard } from "./PostCard";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  reason: FilterReason;
  matchedKeyword?: string;
  matchedLabel?: string;
  score?: number;
}

const reasonLabel: Record<NonNullable<FilterReason>, string> = {
  keyword:     "有害なキーワードが含まれています",
  ml_negative: "強いネガティブ感情が検出されました",
  ml_toxic:    "攻撃的なコンテンツが検出されました",
};

export function FilteredPostCard({ item, reason, matchedKeyword, matchedLabel, score }: Props) {
  const [expanded, setExpanded] = useState(false);
  const addException = useFilterStore((s) => s.addException);
  const incrementFilteredCount = useFilterStore((s) => s.incrementFilteredCount);

  // マウント時にフィルタ件数をカウント
  useState(() => { incrementFilteredCount(); });

  if (expanded) {
    return (
      <div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          <ShieldAlert size={13} />
          <span className="flex-1">
            {matchedLabel
              ? `「${matchedLabel}」と判定されました`
              : reason
              ? reasonLabel[reason]
              : ""}
            {score != null && (
              <span className="ml-1 opacity-70">（確信度: {Math.round(score * 100)}%）</span>
            )}
          </span>
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            onClick={() => addException(item.post.uri)}
            title="誤検知として報告（今後この投稿はフィルタしません）"
          >
            誤検知
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-amber-700 hover:bg-amber-100"
            onClick={() => setExpanded(false)}
          >
            折り畳む
          </Button>
        </div>
        <PostCard item={item} skipFilter />
      </div>
    );
  }

  return (
    <div
      className="border-b border-border px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => setExpanded(true)}
    >
      <ShieldAlert size={15} className="shrink-0 text-amber-500" />
      <span className="flex-1 text-xs text-muted-foreground">
        {matchedLabel
          ? `「${matchedLabel}」と判定されました`
          : reason
          ? reasonLabel[reason]
          : "フィルタされた投稿"}
        {matchedKeyword && (
          <span className="ml-1 opacity-60">（「{matchedKeyword}」）</span>
        )}
        {score != null && (
          <span className="ml-1 opacity-60">（確信度: {Math.round(score * 100)}%）</span>
        )}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs shrink-0 gap-1"
        onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
      >
        <ChevronDown size={13} />
        展開
      </Button>
    </div>
  );
}
