import { useEffect } from "react";
import { mlFilterService } from "@/lib/filters/mlFilter";
import { useFilterStore } from "@/stores/filterStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";

/**
 * ML フィルタサービスを初期化し、ステータス変化を filterStore に同期する。
 * home.tsx の最上位で一度だけ呼び出す。
 */
export function useMLFilterInit() {
  const setMLStatus = useFilterStore((s) => s.setMLStatus);
  const layer2Enabled = useSettingsStore((s) => s.filterSettings.layer2Enabled);

  useEffect(() => {
    if (!layer2Enabled) return;

    const unsub = mlFilterService.onStatusChange(setMLStatus);
    mlFilterService.init();

    return () => {
      unsub();
    };
  }, [layer2Enabled, setMLStatus]);
}

/**
 * 投稿リストを受け取り、未分析のものを ML で非同期分析する。
 */
export function useMLFilterPosts(posts: AppBskyFeedDefs.FeedViewPost[]) {
  const setMLResult = useFilterStore((s) => s.setMLResult);
  const mlResults = useFilterStore((s) => s.mlResults);
  const { filterSettings } = useSettingsStore();

  useEffect(() => {
    if (!filterSettings.enabled || !filterSettings.layer2Enabled) return;

    for (const item of posts) {
      const uri = item.post.uri;

      // すでに分析済みはスキップ
      if (mlResults[uri] !== undefined) continue;

      const record = item.post.record as AppBskyFeedPost.Record;
      // 短いテキストはスキップ（ほぼ日本語投稿の誤検知回避も兼ねる）
      if (!record.text || record.text.trim().length < 10) continue;

      mlFilterService
        .analyze(record.text, filterSettings.threshold, filterSettings.detectionLabels)
        .then((result) => setMLResult(uri, result))
        .catch(() => setMLResult(uri, { filtered: false, reason: null }));
    }
  }, [posts, filterSettings.enabled, filterSettings.layer2Enabled, filterSettings.threshold]);
}
