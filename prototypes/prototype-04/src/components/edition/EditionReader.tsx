import { useEffect, useRef, useCallback, useState } from "react";
import { PostCard } from "@/components/post/PostCard";
import { EditionProgress } from "@/components/edition/EditionProgress";
import { Button } from "@/components/ui/button";
import { useEditionStore } from "@/stores/editionStore";
import { useMLFilterInit, useMLFilterPosts } from "@/hooks/useMLFilter";
import type { CompletionType } from "@/stores/editionStore";

interface Props {
  onClose: (type: CompletionType) => void;
}

export function EditionReader({ onClose }: Props) {
  const edition = useEditionStore((s) => s.currentEdition)!;
  const markRead = useEditionStore((s) => s.markRead);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLDivElement>(null);

  const [completionType, setCompletionType] = useState<CompletionType | null>(null);

  useMLFilterInit();
  useMLFilterPosts(edition.posts);

  // スクロール量からプログレスを更新
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || edition.posts.length === 0) return;
    const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
    const index = Math.floor(ratio * edition.posts.length);
    markRead(Math.max(index, edition.readUntilIndex));
  }, [edition.posts.length, edition.readUntilIndex, markRead]);

  // スクロール底への到達を検知 → インライン完了表示
  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !completionType) {
          setCompletionType("natural");
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(bottom);
    return () => observer.disconnect();
  }, [completionType]);

  // 完了表示が現れたらスクロールして見えるようにする
  useEffect(() => {
    if (!completionType) return;
    const el = completionRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [completionType]);

  // 「今日はここまで」ボタン → スクロール底へ移動してインライン完了表示
  const handleManualComplete = useCallback(() => {
    setCompletionType("manual");
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // 前回の読み位置にスクロール復元
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || edition.readUntilIndex === 0 || edition.posts.length === 0) return;
    const ratio = edition.readUntilIndex / edition.posts.length;
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const messages: Record<CompletionType, string> = {
    natural: "読み終えました。",
    manual: "今日はここまで。",
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-semibold text-base">フィード</h1>
          {!completionType && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={handleManualComplete}
            >
              今日はここまで
            </Button>
          )}
        </div>
        <EditionProgress
          current={edition.readUntilIndex}
          total={edition.posts.length}
        />
      </header>

      {/* 投稿リスト */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {edition.posts.map((item) => (
          <PostCard key={item.post.uri} item={item} />
        ))}

        {/* 自然完了検知用の番兵要素 */}
        <div ref={bottomRef} className="h-px" />

        {/* インライン完了メッセージ */}
        {completionType && (
          <div
            ref={completionRef}
            className="flex flex-col items-center justify-center gap-8 px-8 py-16 animate-in fade-in duration-700"
          >
            <p className="text-xl font-light text-foreground/70 tracking-wide">
              {messages[completionType]}
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onClose(completionType)}
              >
                閉じる
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClose(completionType)}
              >
                次のフィードを取得する
              </Button>
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
