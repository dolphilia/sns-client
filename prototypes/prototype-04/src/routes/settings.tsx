import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { X, Plus, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore, strengthToThreshold, RECOMMENDED_MODELS } from "@/stores/settingsStore";
import type { EditionSize, FeedSource } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { ollamaFilterService } from "@/lib/filters/ollamaFilter";
import type { InstalledModel } from "@/lib/filters/ollamaFilter";

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
    editionSettings,
    setEditionSettings,
  } = useSettingsStore();

  const [newKeyword, setNewKeyword] = useState("");
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const loadInstalledModels = async () => {
    setLoadingModels(true);
    try {
      const models = await ollamaFilterService.getInstalledModels();
      setInstalledModels(models);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    loadInstalledModels();
  }, []);

  const editionSizeOptions: EditionSize[] = [10, 20, 30, 50];
  const feedSourceOptions: { value: FeedSource; label: string; description: string }[] = [
    { value: "following", label: "フォロー中", description: "フォローしているユーザーの新着投稿" },
    { value: "discover", label: "Discover", description: "Bluesky のおすすめフィード" },
    { value: "custom", label: "カスタム", description: "フィードURIを直接指定" },
  ];

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

        {/* 吟味フィルター */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            吟味フィルター
          </h2>
          <div className="space-y-4">

            {/* 吟味の有効・無効 */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">LLM 吟味を有効にする</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ローカル LLM（{filterSettings.selectedModel}）が投稿を吟味し、通過したものだけ届けます
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

                {/* 吟味の強度 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">吟味の強さ</p>
                    <span className="text-xs text-muted-foreground">
                      {filterSettings.filterStrength < 0.1 ? "オフ"
                        : filterSettings.filterStrength < 0.35 ? "弱"
                        : filterSettings.filterStrength < 0.65 ? "中"
                        : filterSettings.filterStrength < 0.85 ? "強"
                        : "最強"}
                      （内部閾値 {strengthToThreshold(filterSettings.filterStrength).toFixed(2)}）
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={filterSettings.filterStrength}
                    onChange={(e) =>
                      setFilterSettings({ filterStrength: parseFloat(e.target.value) })
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>弱（多めに届く）</span>
                    <span>強（厳選して届く）</span>
                  </div>
                </div>

                {/* LLM モデル選択 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">使用する LLM モデル</p>
                    <button
                      onClick={loadInstalledModels}
                      disabled={loadingModels}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="インストール済みモデルを再読み込み"
                    >
                      <RefreshCw size={13} className={loadingModels ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Ollama にインストール済みのモデルから選択します
                  </p>
                  <div className="space-y-1.5">
                    {RECOMMENDED_MODELS.map((rec) => {
                      const installed = installedModels.find(
                        (m) => m.name === rec.name || m.name.startsWith(rec.name.split(":")[0])
                      );
                      const isSelected = filterSettings.selectedModel === rec.name;
                      return (
                        <label
                          key={rec.name}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : installed
                              ? "border-border hover:border-foreground/40"
                              : "border-border opacity-40 cursor-not-allowed"
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedModel"
                            value={rec.name}
                            checked={isSelected}
                            disabled={!installed}
                            onChange={() => setFilterSettings({ selectedModel: rec.name })}
                            className="accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium">{rec.label}</span>
                              <span className="text-xs text-muted-foreground">{rec.sizeGb}GB</span>
                              <span className="text-xs text-muted-foreground">— {rec.note}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{rec.name}</p>
                          </div>
                          {installed ? (
                            <span className="text-[10px] text-green-600 font-medium shrink-0">インストール済み</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0">未インストール</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {loadingModels && (
                    <p className="text-xs text-muted-foreground mt-1.5">モデル情報を読み込み中…</p>
                  )}
                  {!loadingModels && installedModels.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Ollama に接続できないか、モデルが見つかりません。Ollama が起動しているか確認してください。
                    </p>
                  )}
                </div>

                {/* 前段キーワードフィルター */}
                <div>
                  <p className="text-sm font-medium mb-0.5">除外キーワード</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    LLM より前に即座に除外するキーワード（速度向上・確実な除外）
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                      placeholder="除外したいキーワードを追加"
                      className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button size="sm" variant="outline" onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                      <Plus size={14} />
                    </Button>
                  </div>
                  {filterSettings.customKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filterSettings.customKeywords.map((kw) => (
                        <span key={kw} className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
                          {kw}
                          <button onClick={() => removeCustomKeyword(kw)} className="text-muted-foreground hover:text-destructive ml-0.5">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">キーワードはまだ追加されていません</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </section>

        {/* エディション設定 */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            フィード（号）の設定
          </h2>
          <div className="space-y-4">
            {/* フィードソース */}
            <div>
              <p className="text-sm font-medium mb-1">取得元フィード</p>
              <p className="text-xs text-muted-foreground mb-2">
                号として読み込むフィードを選択します
              </p>
              <div className="space-y-2">
                {feedSourceOptions.map(({ value, label, description }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="feedSource"
                      value={value}
                      checked={editionSettings.feedSource === value}
                      onChange={() => setEditionSettings({ feedSource: value })}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {editionSettings.feedSource === "custom" && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={editionSettings.customFeedUri}
                    onChange={(e) => setEditionSettings({ customFeedUri: e.target.value })}
                    placeholder="at://did:plc:.../app.bsky.feed.generator/..."
                    className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              )}
            </div>

            {/* 号のサイズ */}
            <div>
              <p className="text-sm font-medium mb-1">1号あたりの件数</p>
              <p className="text-xs text-muted-foreground mb-2">
                「読み始める」で取得する投稿数を選択します
              </p>
              <div className="flex gap-2 flex-wrap">
                {editionSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => setEditionSettings({ size })}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      editionSettings.size === size
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {size}件
                  </button>
                ))}
              </div>
            </div>

            {/* リポストを含めるか */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">リポストを号に含める</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オフにするとフォロー中の人の原文のみ表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={editionSettings.includeReposts}
                onChange={(e) => setEditionSettings({ includeReposts: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            {/* 環境同期 */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">時間帯に応じた背景色</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  朝・昼・夕・夜でアプリの質感が変化します
                </p>
              </div>
              <input
                type="checkbox"
                checked={editionSettings.ambientSyncEnabled}
                onChange={(e) => setEditionSettings({ ambientSyncEnabled: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>
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
