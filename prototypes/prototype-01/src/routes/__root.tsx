import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import { Toaster } from "@/components/ui/sonner";

function RootLayout() {
  const session = useAuthStore((s) => s.session);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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
