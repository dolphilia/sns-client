import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { FeedSource } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { agent } from "@/lib/agent";
import { normalizeFeedUri } from "@/lib/bskyFeed";

function FeedLabel({ feedUri }: { feedUri: string }) {
  const normalizedFeedUri = normalizeFeedUri(feedUri);
  const { data, isLoading, error } = useQuery({
    queryKey: ["feed-generator", normalizedFeedUri],
    queryFn: () =>
      agent.app.bsky.feed.getFeedGenerator({
        feed: normalizedFeedUri,
      }),
    enabled: Boolean(normalizedFeedUri),
    staleTime: 10 * 60 * 1000,
  });

  const displayName = data?.data.view.displayName;

  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">
        {displayName ?? (isLoading ? "フィード名を取得中..." : "名称未取得")}
      </span>
      <span className="block break-all font-mono text-xs text-muted-foreground">
        {feedUri}
      </span>
      {error && (
        <span className="mt-0.5 block text-xs text-destructive">
          フィード名を取得できませんでした
        </span>
      )}
    </span>
  );
}

function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const {
    hideEngagementCounts,
    setHideEngagementCounts,
    followSafetySettings,
    setFollowSafetySettings,
    feedDisplaySettings,
    setFeedDisplaySettings,
    feedSettings,
    setFeedSettings,
    discoverSettings,
    setDiscoverSettings,
    mutedKeywords,
    addMutedKeyword,
    removeMutedKeyword,
  } = useSettingsStore();

  const [newKeyword, setNewKeyword] = useState("");
  const [newCustomFeedUri, setNewCustomFeedUri] = useState("");
  const [newDiscoverFeedUri, setNewDiscoverFeedUri] = useState("");

  const feedSourceOptions: { value: FeedSource; label: string; description: string }[] = [
    { value: "following", label: "フォロー中", description: "フォローしているユーザーの投稿" },
    { value: "discover", label: "Discover", description: "Bluesky のおすすめフィード" },
    { value: "custom", label: "カスタム", description: "フィード URI を直接指定" },
  ];

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    addMutedKeyword(newKeyword.trim());
    setNewKeyword("");
  };

  const handleAddCustomFeedUri = () => {
    const trimmed = newCustomFeedUri.trim();
    if (!trimmed || feedSettings.customFeedUris.includes(trimmed)) return;
    setFeedSettings({
      customFeedUris: [...feedSettings.customFeedUris, trimmed],
      selectedCustomFeedUri: feedSettings.selectedCustomFeedUri || trimmed,
      customFeedUri: feedSettings.customFeedUri || trimmed,
    });
    setNewCustomFeedUri("");
  };

  const handleRemoveCustomFeedUri = (feedUri: string) => {
    const nextFeedUris = feedSettings.customFeedUris.filter((uri) => uri !== feedUri);
    const selectedCustomFeedUri =
      feedSettings.selectedCustomFeedUri === feedUri
        ? nextFeedUris[0] ?? ""
        : feedSettings.selectedCustomFeedUri;
    setFeedSettings({
      customFeedUris: nextFeedUris,
      selectedCustomFeedUri,
      customFeedUri: selectedCustomFeedUri,
    });
  };

  const handleAddDiscoverFeedUri = () => {
    const trimmed = newDiscoverFeedUri.trim();
    if (!trimmed || discoverSettings.feedUris.includes(trimmed)) return;
    setDiscoverSettings({
      feedUris: [...discoverSettings.feedUris, trimmed],
      selectedFeedUri: discoverSettings.selectedFeedUri || trimmed,
    });
    setNewDiscoverFeedUri("");
  };

  const handleRemoveDiscoverFeedUri = (feedUri: string) => {
    const nextFeedUris = discoverSettings.feedUris.filter((uri) => uri !== feedUri);
    setDiscoverSettings({
      feedUris: nextFeedUris,
      selectedFeedUri:
        discoverSettings.selectedFeedUri === feedUri
          ? nextFeedUris[0] ?? ""
          : discoverSettings.selectedFeedUri,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">設定</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-4 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            ストレス低減
          </h2>
          <div className="space-y-4">
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

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">リポストをフィードから除外する</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オンにするとフォロー中の人の原文を中心に表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedSettings.excludeReposts}
                onChange={(e) => setFeedSettings({ excludeReposts: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">画像付きの投稿のみ表示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オンにするとホームと発見で画像を含む投稿だけを表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedSettings.onlyImagePosts}
                onChange={(e) => setFeedSettings({ onlyImagePosts: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">NSFW 投稿を除外する</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オンにするとホームと発見で NSFW 系ラベルのある投稿を表示しません
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedSettings.excludeNsfwPosts}
                onChange={(e) => setFeedSettings({ excludeNsfwPosts: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">投稿カードにミュートボタンを表示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オンにすると各投稿の右下に確認付きのミュート操作を表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedDisplaySettings.showMuteAction}
                onChange={(e) => setFeedDisplaySettings({ showMuteAction: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">フォロー解除後の再フォローを防止</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  フォロー解除したユーザーをこの端末に記録し、再フォロー用ボタンを無効にします
                </p>
              </div>
              <input
                type="checkbox"
                checked={followSafetySettings.preventRefollowAfterUnfollow}
                onChange={(e) =>
                  setFollowSafetySettings({
                    preventRefollowAfterUnfollow: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">フォロー解除時にミュートする</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  フォロー解除と同時に Bluesky のミュートも実行します
                </p>
              </div>
              <input
                type="checkbox"
                checked={followSafetySettings.muteOnUnfollow}
                onChange={(e) =>
                  setFollowSafetySettings({ muteOnUnfollow: e.target.checked })
                }
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            フィード表示
          </h2>
          <div className="space-y-5">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">フィードを幅いっぱいに表示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  オンにすると投稿一覧部分を右カラム全体に表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedDisplaySettings.fullWidth}
                onChange={(e) => setFeedDisplaySettings({ fullWidth: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">フィードの幅</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    幅いっぱい表示がオフのときの投稿一覧部分の最大幅です
                  </p>
                </div>
                <input
                  type="number"
                  min={480}
                  max={1200}
                  step={20}
                  value={feedDisplaySettings.feedWidth}
                  onChange={(e) =>
                    setFeedDisplaySettings({ feedWidth: Number(e.target.value) })
                  }
                  className="w-24 text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <input
                type="range"
                min={480}
                max={1200}
                step={20}
                value={feedDisplaySettings.feedWidth}
                onChange={(e) =>
                  setFeedDisplaySettings({ feedWidth: Number(e.target.value) })
                }
                className="mt-2 w-full accent-primary"
              />
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">投稿をグリッド表示にする</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  投稿カードを複数列で表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedDisplaySettings.grid}
                onChange={(e) => setFeedDisplaySettings({ grid: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">グリッド表示時の投稿サイズ</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    1 枚の投稿カードの最小幅です
                  </p>
                </div>
                <input
                  type="number"
                  min={220}
                  max={520}
                  step={20}
                  value={feedDisplaySettings.gridPostSize}
                  onChange={(e) =>
                    setFeedDisplaySettings({ gridPostSize: Number(e.target.value) })
                  }
                  className="w-24 text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <input
                type="range"
                min={220}
                max={520}
                step={20}
                value={feedDisplaySettings.gridPostSize}
                onChange={(e) =>
                  setFeedDisplaySettings({ gridPostSize: Number(e.target.value) })
                }
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">投稿カードに表示する項目</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["showAvatar", "アバター画像"],
                  ["showDisplayName", "ユーザー名"],
                  ["showHandle", "ユーザーID"],
                  ["showTimestamp", "投稿日時や時間"],
                  ["showText", "投稿の本文"],
                  ["showImages", "画像"],
                  ["showActions", "アクション領域"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        feedDisplaySettings[key as keyof typeof feedDisplaySettings] as boolean
                      }
                      onChange={(e) =>
                        setFeedDisplaySettings({ [key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium">画像を正方形にトリミング表示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  投稿画像をカードの横幅に合わせ、中央で正方形に切り抜いて表示します
                </p>
              </div>
              <input
                type="checkbox"
                checked={feedDisplaySettings.cropImagesToSquare}
                onChange={(e) =>
                  setFeedDisplaySettings({ cropImagesToSquare: e.target.checked })
                }
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            フィード
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">取得元フィード</p>
              <p className="text-xs text-muted-foreground mb-2">
                ホームに表示するフィードを選択します
              </p>
              <div className="space-y-2">
                {feedSourceOptions.map(({ value, label, description }) => (
                  <label key={value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="feedSource"
                      value={value}
                      checked={feedSettings.feedSource === value}
                      onChange={() => setFeedSettings({ feedSource: value })}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {feedSettings.feedSource === "custom" && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomFeedUri}
                      onChange={(e) => setNewCustomFeedUri(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomFeedUri()}
                      placeholder="https://bsky.app/profile/.../feed/... または at://..."
                      className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddCustomFeedUri}
                      disabled={!newCustomFeedUri.trim()}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  {feedSettings.customFeedUris.length > 0 ? (
                    <div className="space-y-2">
                      {feedSettings.customFeedUris.map((feedUri) => (
                        <label
                          key={feedUri}
                          className="flex items-start gap-3 rounded-md border border-border px-3 py-2"
                        >
                          <input
                            type="radio"
                            name="selectedCustomFeedUri"
                            checked={feedSettings.selectedCustomFeedUri === feedUri}
                            onChange={() =>
                              setFeedSettings({
                                selectedCustomFeedUri: feedUri,
                                customFeedUri: feedUri,
                              })
                            }
                            className="mt-1 accent-primary"
                          />
                          <FeedLabel feedUri={feedUri} />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomFeedUri(feedUri)}
                            className="mt-0.5 text-muted-foreground hover:text-destructive"
                            title="削除"
                          >
                            <X size={14} />
                          </button>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      カスタムフィードはまだ追加されていません
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-1">発見に使うカスタムフィード</p>
              <p className="text-xs text-muted-foreground mb-2">
                複数保存できます。選択中の 1 件から、まだフォローしていない投稿主の投稿を表示します。bsky.app のフィード URL もそのまま使えます。
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDiscoverFeedUri}
                  onChange={(e) => setNewDiscoverFeedUri(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDiscoverFeedUri()}
                  placeholder="https://bsky.app/profile/.../feed/... または at://..."
                  className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddDiscoverFeedUri}
                  disabled={!newDiscoverFeedUri.trim()}
                >
                  <Plus size={14} />
                </Button>
              </div>
              {discoverSettings.feedUris.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {discoverSettings.feedUris.map((feedUri) => (
                    <label
                      key={feedUri}
                      className="flex items-start gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <input
                        type="radio"
                        name="selectedDiscoverFeedUri"
                        checked={discoverSettings.selectedFeedUri === feedUri}
                        onChange={() => setDiscoverSettings({ selectedFeedUri: feedUri })}
                        className="mt-1 accent-primary"
                      />
                      <FeedLabel feedUri={feedUri} />
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscoverFeedUri(feedUri)}
                        className="mt-0.5 text-muted-foreground hover:text-destructive"
                        title="削除"
                      >
                        <X size={14} />
                      </button>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  カスタムフィードはまだ追加されていません
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-0.5">ミュートキーワード</p>
              <p className="text-xs text-muted-foreground mb-2">
                指定した言葉を含む投稿をローカルで非表示にします。AI 判定は使いません。
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  placeholder="非表示にしたいキーワードを追加"
                  className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" variant="outline" onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                  <Plus size={14} />
                </Button>
              </div>
              {mutedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mutedKeywords.map((kw) => (
                    <span key={kw} className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
                      {kw}
                      <button onClick={() => removeMutedKeyword(kw)} className="text-muted-foreground hover:text-destructive ml-0.5">
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
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            ローカル操作
          </h2>
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium">ブックマークはこの端末内に保存されます</p>
            <p className="text-xs text-muted-foreground">
              Bluesky には同期されず、相手にも通知されません。
            </p>
          </div>
        </section>

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
    </div>
  );
}

export const Route = createFileRoute("/settings")({ component: SettingsPage });
