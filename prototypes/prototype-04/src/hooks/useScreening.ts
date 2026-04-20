import { useCallback, useRef } from "react";
import type { AppBskyFeedDefs } from "@atproto/api";
import { agent } from "@/lib/agent";
import { useScreeningStore } from "@/stores/screeningStore";
import { useSettingsStore, DISCOVER_FEED_URI, strengthToThreshold } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { applyKeywordFilter } from "@/lib/filters/keywordFilter";
import { ollamaFilterService } from "@/lib/filters/ollamaFilter";

/**
 * 吟味パイプラインの中核フック。
 * 「読み始める」ボタンに紐付けて使う。
 *
 * フロー:
 *   API取得 → キーワード除外 → Ollama LLM吟味（2件並列）
 *   → 通過した投稿を screeningStore に順次追加 → 全件完了で号を固定
 */
export function useScreening() {
  const session = useAuthStore((s) => s.session);
  const editionSettings = useSettingsStore((s) => s.editionSettings);
  const filterSettings = useSettingsStore((s) => s.filterSettings);

  const setFetching = useScreeningStore((s) => s.setFetching);
  const startScreening = useScreeningStore((s) => s.startScreening);
  const addApprovedPost = useScreeningStore((s) => s.addApprovedPost);
  const incrementScreened = useScreeningStore((s) => s.incrementScreened);
  const finishScreening = useScreeningStore((s) => s.finishScreening);
  const setFetchError = useScreeningStore((s) => s.setFetchError);

  // 中断フラグ（reset() 呼び出し時に進行中の吟味を止める）
  const abortedRef = useRef(false);

  const startEdition = useCallback(async () => {
    if (!session) return;

    abortedRef.current = false;
    setFetching();

    try {
      // ─── Step 1: Bluesky API から投稿を多めに取得 ───
      const { feedSource, customFeedUri, size, includeReposts } = editionSettings;

      // 承認目標件数の 2.5 倍を取得（通過率 ~50% を想定し余裕を持たせる）
      const fetchLimit = Math.min(size * 3, 100);

      let fetched: AppBskyFeedDefs.FeedViewPost[];

      if (feedSource === "following") {
        const res = await agent.getTimeline({ limit: fetchLimit });
        fetched = res.data.feed;
      } else {
        const feedUri =
          feedSource === "discover" ? DISCOVER_FEED_URI : customFeedUri.trim();
        if (!feedUri) { setFetchError("フィードURIが設定されていません"); return; }
        const res = await agent.app.bsky.feed.getFeed({ feed: feedUri, limit: fetchLimit });
        fetched = res.data.feed;
      }

      // リポストを除外
      if (!includeReposts) {
        fetched = fetched.filter(
          (item) => item.reason?.$type !== "app.bsky.feed.defs#reasonRepost"
        );
      }

      // 自分の投稿を除外
      fetched = fetched.filter((item) => item.post.author.did !== session.did);

      // ─── Step 2: キーワードフィルタ（即時除外） ───
      const { enabled, filterStrength, customKeywords } = filterSettings;
      const threshold = strengthToThreshold(filterStrength);

      let candidates = fetched;
      if (enabled) {
        candidates = fetched.filter((item) => {
          const text = item.post.record && typeof item.post.record === "object"
            ? (item.post.record as { text?: string }).text ?? ""
            : "";
          const result = applyKeywordFilter(text, customKeywords);
          return !result.filtered; // フィルタに引っかかったものは除外
        });
      }

      if (abortedRef.current) return;

      // ─── Step 3: Ollama LLM 吟味（並列） ───
      startScreening(candidates.length);

      // Ollama が使えない場合はそのまま全件承認して号を確定
      const { selectedModel } = filterSettings;
      const ollamaReady = await ollamaFilterService.checkAvailability(selectedModel);
      if (!ollamaReady) {
        for (const post of candidates) {
          if (abortedRef.current) return;
          addApprovedPost(post);
        }
        finishScreening();
        return;
      }

      // 承認目標件数に達したら残りをスキップするための変数
      let approvedCount = 0;
      const targetCount = size;

      // 各投稿を並列で吟味（同時実行数は ollamaFilterService 内部のセマフォで制御）
      const tasks = candidates.map((post) => async () => {
        if (abortedRef.current) return;
        if (approvedCount >= targetCount) {
          // 目標件数に達したら残りは吟味せず完了カウントだけ進める
          incrementScreened();
          return;
        }

        const text = post.post.record && typeof post.post.record === "object"
          ? (post.post.record as { text?: string }).text ?? ""
          : "";

        if (!enabled) {
          // フィルタ無効なら全件通過
          approvedCount++;
          addApprovedPost(post);
          incrementScreened();
          return;
        }

        const result = await ollamaFilterService.analyze(text, threshold, selectedModel);
        if (abortedRef.current) return;

        incrementScreened();

        if (!result.filtered) {
          approvedCount++;
          addApprovedPost(post);
        }
      });

      // 全タスクを同時に起動（並列数は ollamaFilterService のセマフォが制御）
      await Promise.all(tasks.map((t) => t()));

      if (!abortedRef.current) {
        finishScreening();
      }
    } catch (e) {
      if (!abortedRef.current) {
        setFetchError(e instanceof Error ? e.message : "フィードの取得に失敗しました");
      }
    }
  }, [
    session,
    editionSettings,
    filterSettings,
    setFetching,
    startScreening,
    addApprovedPost,
    incrementScreened,
    finishScreening,
    setFetchError,
  ]);

  const abort = useCallback(() => {
    abortedRef.current = true;
  }, []);

  return { startEdition, abort };
}
