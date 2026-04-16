import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

function IndexRedirect() {
  const session = useAuthStore((s) => s.session);
  return <Navigate to={session ? "/home" : "/login"} replace />;
}

export const Route = createFileRoute("/")({ component: IndexRedirect });
