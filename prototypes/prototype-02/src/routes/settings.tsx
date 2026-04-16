import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";

function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const {
    hideEngagementCounts,
    setHideEngagementCounts,
    filterSettings,
    setFilterSettings,
    addCustomKeyword,
    removeCustomKeyword,
    addDetectionLabel,
    removeDetectionLabel,
  } = useSettingsStore();

  const [newKeyword, setNewKeyword] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    addCustomKeyword(newKeyword.trim());
    setNewKeyword("");
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">設定</h1>
      </header>

      <div className="px-4 py-4 space-y-8">

        {/* ストレス低減 */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            ストレス低減
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">エンゲージメント数を非表示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  いいね数・リポスト数・返信数を表示しません
                </p>
              </div>
              <input
                type="checkbox"
                checked={hideEngagementCounts}
                onChange={(e) => setHideEngagementCounts(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        </section>

        {/* コンテンツフィルター */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            コンテンツフィルター
          </h2>

          <div className="space-y-4">
            {/* フィルター全体のオン/オフ */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">フィルターを有効にする</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  有害・攻撃的なコンテンツを折り畳み表示にします
                </p>
              </div>
              <input
                type="checkbox"
                checked={filterSettings.enabled}
                onChange={(e) => setFilterSettings({ enabled: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            {filterSettings.enabled && (
              <div className="pl-3 border-l-2 border-border space-y-4">
                {/* Layer 1 */}
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">キーワードフィルター</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      有害なキーワード・表現パターンで検出します
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterSettings.layer1Enabled}
                    onChange={(e) => setFilterSettings({ layer1Enabled: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                </label>

                {/* Layer 2 */}
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">AI 感情分析フィルター</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      機械学習モデルでネガティブ感情を検出します（英語のみ）
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterSettings.layer2Enabled}
                    onChange={(e) => setFilterSettings({ layer2Enabled: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                </label>

                {/* 閾値スライダー (Layer 2 が有効なときのみ) */}
                {filterSettings.layer2Enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">感度</p>
                      <span className="text-xs text-muted-foreground">
                        {filterSettings.threshold >= 0.85
                          ? "厳しい（誤検知多め）"
                          : filterSettings.threshold >= 0.65
                          ? "標準"
                          : "緩い（見落とし多め）"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={filterSettings.threshold}
                      onChange={(e) => setFilterSettings({ threshold: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>緩い</span>
                      <span>厳しい</span>
                    </div>
                  </div>
                )}

                {/* 検出ラベル（AI 感情分析フィルター用） */}
                {filterSettings.layer2Enabled && (
                  <div>
                    <p className="text-sm font-medium mb-0.5">検出ラベル</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      AI が判定する対象カテゴリを自由に追加・削除できます
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addDetectionLabel(newLabel);
                            setNewLabel("");
                          }
                        }}
                        placeholder="例：比較・マウント、FOMO を煽る"
                        className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { addDetectionLabel(newLabel); setNewLabel(""); }}
                        disabled={!newLabel.trim()}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filterSettings.detectionLabels.map((label) => (
                        <span
                          key={label}
                          className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1"
                        >
                          {label}
                          <button
                            onClick={() => removeDetectionLabel(label)}
                            className="text-muted-foreground hover:text-destructive ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* カスタムキーワード */}
                {filterSettings.layer1Enabled && (
                  <div>
                    <p className="text-sm font-medium mb-2">カスタムキーワード</p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                        placeholder="フィルターするキーワードを追加"
                        className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddKeyword}
                        disabled={!newKeyword.trim()}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    {filterSettings.customKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filterSettings.customKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1"
                          >
                            {kw}
                            <button
                              onClick={() => removeCustomKeyword(kw)}
                              className="text-muted-foreground hover:text-destructive ml-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        カスタムキーワードはまだ追加されていません
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* アカウント */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            アカウント
          </h2>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">ログイン中</p>
            <p className="text-sm font-medium mt-0.5">@{session.handle}</p>
          </div>
        </section>

      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings")({ component: SettingsPage });
