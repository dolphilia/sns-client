import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { cn } from "@/lib/utils";

interface Props {
  uri: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function BookmarkButton({ uri, onClick }: Props) {
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(uri));
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBookmarked) {
      removeBookmark(uri);
    } else {
      addBookmark(uri);
    }
    onClick?.(e);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0 hover:bg-amber-50",
        isBookmarked
          ? "text-amber-500"
          : "text-muted-foreground hover:text-amber-500"
      )}
      onClick={handleClick}
      title={isBookmarked ? "ブックマークを削除" : "ブックマークに保存"}
    >
      <Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />
    </Button>
  );
}
