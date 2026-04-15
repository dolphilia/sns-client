import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const { hideEngagementCounts, setHideEngagementCounts } = useSettingsStore();

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">設定</h1>
      </header>

      <div className="px-4 py-4 space-y-6">
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
