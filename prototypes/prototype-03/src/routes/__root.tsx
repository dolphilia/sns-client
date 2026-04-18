import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Toaster } from "@/components/ui/sonner";

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "morning";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  if (h >= 21) return "night";
  return "late-night"; // 0〜5時
}

function RootLayout() {
  const session = useAuthStore((s) => s.session);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const ambientSyncEnabled = useSettingsStore(
    (s) => s.editionSettings.ambientSyncEnabled
  );

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 環境同期：時間帯クラスを html 要素に付与
  useEffect(() => {
    const applyTimeOfDay = () => {
      const tod = ambientSyncEnabled ? getTimeOfDay() : "day";
      document.documentElement.dataset.timeOfDay = tod;
    };
    applyTimeOfDay();
  }, [ambientSyncEnabled]);

  if (!session) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-[640px]">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout });
