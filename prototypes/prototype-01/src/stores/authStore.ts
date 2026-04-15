import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AtpSessionData } from "@atproto/api";
import { agent } from "@/lib/agent";

interface AuthState {
  session: AtpSessionData | null;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await agent.login({ identifier, password });
          set({ session: { ...result.data, active: result.data.active ?? true }, isLoading: false });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "ログインに失敗しました";
          set({ error: msg, isLoading: false });
        }
      },

      logout: async () => {
        try {
          await agent.logout();
        } catch {
          // エラーは無視してローカルセッションを破棄
        }
        set({ session: null });
      },

      restoreSession: async () => {
        const { session } = get();
        if (!session) return;
        try {
          await agent.resumeSession(session);
        } catch {
          // セッション復元失敗 → ログアウト扱い
          set({ session: null });
        }
      },
    }),
    {
      name: "bsky-auth",
      partialize: (state) => ({ session: state.session }),
    }
  )
);
