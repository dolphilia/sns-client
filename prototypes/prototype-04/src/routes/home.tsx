import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { WaitingScreen } from "@/components/edition/WaitingScreen";
import { ScreeningScreen } from "@/components/screening/ScreeningScreen";
import { useAuthStore } from "@/stores/authStore";
import { useScreeningStore } from "@/stores/screeningStore";
import { useScreening } from "@/hooks/useScreening";

function HomePage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const screeningState = useScreeningStore((s) => s.screeningState);
  const fetchError = useScreeningStore((s) => s.fetchError);
  const reset = useScreeningStore((s) => s.reset);

  const { startEdition, abort } = useScreening();

  // 「読み始める」ボタン
  const handleStart = useCallback(async () => {
    await startEdition();
  }, [startEdition]);

  // 完了後に「次のフィードを取得する」または「閉じる」を押したとき
  const handleReset = useCallback(() => {
    abort();
    reset();
  }, [abort, reset]);

  // 待機画面：idle または completed
  if (screeningState === "idle" || screeningState === "completed") {
    return (
      <div className="flex flex-col h-screen">
        <WaitingScreen
          onStart={handleStart}
          isLoading={false}
          error={fetchError}
        />
      </div>
    );
  }

  // 吟味中 / 読書中：ScreeningScreen が状態に応じて表示を切り替える
  return <ScreeningScreen onReset={handleReset} />;
}

export const Route = createFileRoute("/home")({ component: HomePage });
