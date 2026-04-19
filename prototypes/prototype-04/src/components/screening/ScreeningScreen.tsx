import { useEffect, useRef, useCallback, useState } from "react";
import { BreathingDots } from "@/components/screening/BreathingDots";
import { PostCard } from "@/components/post/PostCard";
import { EditionProgress } from "@/components/edition/EditionProgress";
import { Button } from "@/components/ui/button";
import { useScreeningStore } from "@/stores/screeningStore";
import type { CompletionType } from "@/stores/screeningStore";

interface Props {
  onReset: () => void;
}

/**
 * 吟味〜読書の統合画面。
 *
 * screeningState に応じて表示が変化する：
 *   fetching  → 呼吸ドット + 「今日の投稿を集めています」
 *   screening → 呼吸ドット + 届いた投稿が順次フェードイン + 「まだ届いています…」
 *   reading   → プログレスバー + 投稿リスト（固定）
 *   completed → 完了メッセージ
 */
export function ScreeningScreen({ onReset }: Props) {
  const screeningState = useScreeningStore((s) => s.screeningState);
  const approvedPosts = useScreeningStore((s) => s.approvedPosts);
  const isScreeningDone = useScreeningStore((s) => s.isScreeningDone);
  const readUntilIndex = useScreeningStore((s) => s.readUntilIndex);
  const markRead = useScreeningStore((s) => s.markRead);
  const completeEdition = useScreeningStore((s) => s.completeEdition);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLDivElement>(null);
  const prevApprovedCount = useRef(0);

  // インライン完了表示の管理
  const [completionType, setCompletionType] = useState<CompletionType | null>(null);

  // 新しい投稿が届いたとき、吟味中かつユーザーが最下部付近にいれば自動スクロール
  useEffect(() => {
    const newCount = approvedPosts.length;
    if (newCount <= prevApprovedCount.current) return;
    prevApprovedCount.current = newCount;

    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if ((screeningState === "fetching" || screeningState === "screening") && isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [approvedPosts.length, screeningState]);

  // スクロール量から読み位置を更新
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || approvedPosts.length === 0) return;
    const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
    const index = Math.floor(ratio * approvedPosts.length);
    markRead(Math.max(index, readUntilIndex));
  }, [approvedPosts.length, readUntilIndex, markRead]);

  // 底への到達を検知 → 自然完了（reading モード時のみ）
  useEffect(() => {
    if (screeningState !== "reading") return;
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
  }, [screeningState, completionType]);

  // 完了表示が現れたら store に記録してスクロール
  useEffect(() => {
    if (!completionType) return;
    completeEdition(completionType);
    const el = completionRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [completionType, completeEdition]);

  // 「今日はここまで」ボタン
  const handleManualComplete = useCallback(() => {
    setCompletionType("manual");
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // ヘッダーのラベル
  const headerLabel = () => {
    if (screeningState === "fetching") return "今日の投稿を集めています";
    if (screeningState === "screening") {
      return approvedPosts.length === 0
        ? "吟味しています…"
        : `${approvedPosts.length}件 届きました`;
    }
    return "フィード";
  };

  const isActive = screeningState === "fetching" || screeningState === "screening";
  const completionMessages: Record<CompletionType, string> = {
    natural: "読み終えました。",
    manual: "今日はここまで。",
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
          {isActive ? (
            // 吟味中：呼吸ドット + ラベル
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BreathingDots />
              <span className="transition-all duration-500">{headerLabel()}</span>
            </div>
          ) : (
            // 読書中：通常ヘッダー
            <>
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
            </>
          )}
        </div>

        {/* 吟味完了後のみプログレスバーを表示 */}
        {isScreeningDone && (
          <EditionProgress
            current={readUntilIndex}
            total={approvedPosts.length}
          />
        )}
      </header>

      {/* メインコンテンツ */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* 投稿が1件も届いていない fetching 状態 */}
        {approvedPosts.length === 0 && isActive && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
            <BreathingDots className="text-muted-foreground/60" />
          </div>
        )}

        {/* 投稿リスト：吟味中は1件ずつフェードイン、読書中は通常表示 */}
        {approvedPosts.map((item, i) => (
          <div
            key={item.post.uri}
            className={
              // 吟味中に届いた投稿にのみ到着アニメーションを適用
              screeningState === "screening"
                ? "animate-in fade-in slide-in-from-bottom-2 duration-500"
                : undefined
            }
            // 遅延を重ねると重くなるため、到着インデックスが大きいほど最小限の遅延
            style={screeningState === "screening"
              ? { animationDelay: `${Math.min(i * 30, 200)}ms` }
              : undefined}
          >
            <PostCard item={item} />
          </div>
        ))}

        {/* 吟味完了検知用の番兵 */}
        <div ref={bottomRef} className="h-px" />

        {/* 吟味継続中インジケーター */}
        {screeningState === "screening" && approvedPosts.length > 0 && (
          <div className="flex items-center gap-2 justify-center py-6 text-muted-foreground/50 text-xs">
            <BreathingDots className="text-muted-foreground/40" />
            <span>まだ届いています…</span>
          </div>
        )}

        {/* インライン完了メッセージ */}
        {completionType && (
          <div
            ref={completionRef}
            className="flex flex-col items-center justify-center gap-8 px-8 py-16 animate-in fade-in duration-700"
          >
            <p className="text-xl font-light text-foreground/70 tracking-wide">
              {completionMessages[completionType]}
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onReset}
              >
                閉じる
              </Button>
              <Button variant="outline" size="sm" onClick={onReset}>
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
