import { create } from "zustand";
import type { AtpSessionData } from "@atproto/api";
import { agent } from "@/lib/agent";
import {
  deleteStoredSession,
  loadStoredSession,
  saveStoredSession,
} from "@/lib/secureSessionStorage";

interface AuthState {
  session: AtpSessionData | null;
  isLoading: boolean;
  hasHydrated: boolean;
  hasRestoredSession: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  markHydrated: () => void;
}

async function saveSessionBestEffort(session: AtpSessionData) {
  try {
    await saveStoredSession(session);
  } catch (error) {
    console.warn("Failed to save Bluesky session.", error);
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  isLoading: false,
  hasHydrated: true,
  hasRestoredSession: false,
  error: null,

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await agent.login({ identifier, password });
      const session = { ...result.data, active: result.data.active ?? true };
      await saveSessionBestEffort(session);
      set({
        session,
        isLoading: false,
        hasRestoredSession: true,
      });
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
    await deleteStoredSession();
    set({ session: null, hasRestoredSession: true });
  },

  restoreSession: async () => {
    let session: AtpSessionData | null = null;
    try {
      session = await loadStoredSession();
    } catch (error) {
      console.warn("Failed to load Bluesky session.", error);
    }
    if (!session) {
      set({ hasRestoredSession: true });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await agent.resumeSession(session);
      const restoredSession = agent.session ?? session;
      const activeSession = { ...restoredSession, active: restoredSession.active ?? true };
      await saveSessionBestEffort(activeSession);
      set({
        session: activeSession,
        isLoading: false,
        hasRestoredSession: true,
      });
    } catch {
      // セッション復元失敗 → ログアウト扱い
      await deleteStoredSession();
      set({ session: null, isLoading: false, hasRestoredSession: true });
    }
  },

  markHydrated: () => set({ hasHydrated: true }),
}));
