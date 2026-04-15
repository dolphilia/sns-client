import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  hideEngagementCounts: boolean;
  setHideEngagementCounts: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hideEngagementCounts: true, // デフォルトで数値を非表示
      setHideEngagementCounts: (v) => set({ hideEngagementCounts: v }),
    }),
    { name: "bsky-settings" }
  )
);
