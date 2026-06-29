import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import { Toaster } from "@/components/ui/sonner";

function RootLayout() {
  const session = useAuthStore((s) => s.session);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const hasRestoredSession = useAuthStore((s) => s.hasRestoredSession);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    if (hasHydrated && !hasRestoredSession) {
      restoreSession();
    }
  }, [hasHydrated, hasRestoredSession, restoreSession]);

  if (!hasHydrated || !hasRestoredSession || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        セッションを確認しています...
      </div>
    );
  }

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
      <main className="min-w-0 flex-1">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout });
