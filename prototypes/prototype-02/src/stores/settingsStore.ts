import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FilterSettings {
  enabled: boolean;
  layer1Enabled: boolean;
  layer2Enabled: boolean;
  threshold: number; // ML スコアの閾値 (0.5〜0.95)
  customKeywords: string[];
  detectionLabels: string[]; // ゼロショット分類で使う検出ラベル
}

interface SettingsState {
  hideEngagementCounts: boolean;
  setHideEngagementCounts: (v: boolean) => void;
  filterSettings: FilterSettings;
  setFilterSettings: (v: Partial<FilterSettings>) => void;
  addCustomKeyword: (keyword: string) => void;
  removeCustomKeyword: (keyword: string) => void;
  addDetectionLabel: (label: string) => void;
  removeDetectionLabel: (label: string) => void;
}

const defaultFilterSettings: FilterSettings = {
  enabled: true,
  layer1Enabled: true,
  layer2Enabled: false, // Layer 2 はモデルロード後に有効化
  threshold: 0.75,
  customKeywords: [],
  detectionLabels: [
    "侮辱・人身攻撃",
    "脅迫・威圧",
    "ヘイトスピーチ",
    "自傷・自殺に関する内容",
    "炎上・攻撃の扇動",
  ],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hideEngagementCounts: true,
      setHideEngagementCounts: (v) => set({ hideEngagementCounts: v }),

      filterSettings: defaultFilterSettings,
      setFilterSettings: (v) =>
        set((s) => ({ filterSettings: { ...s.filterSettings, ...v } })),

      addCustomKeyword: (keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;
        const current = get().filterSettings.customKeywords;
        if (current.includes(trimmed)) return;
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            customKeywords: [...current, trimmed],
          },
        }));
      },

      removeCustomKeyword: (keyword) => {
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            customKeywords: s.filterSettings.customKeywords.filter((k) => k !== keyword),
          },
        }));
      },

      addDetectionLabel: (label) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const current = get().filterSettings.detectionLabels;
        if (current.includes(trimmed)) return;
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            detectionLabels: [...s.filterSettings.detectionLabels, trimmed],
          },
        }));
      },

      removeDetectionLabel: (label) => {
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            detectionLabels: s.filterSettings.detectionLabels.filter((l) => l !== label),
          },
        }));
      },
    }),
    {
      name: "bsky-settings",
      // localStorage の古いデータに新フィールドが欠けていても
      // デフォルト値で補完されるよう filterSettings を深くマージする
      merge: (persisted: unknown, current: SettingsState): SettingsState => {
        const p = persisted as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          filterSettings: {
            ...current.filterSettings,
            ...p.filterSettings,
          },
        };
      },
    }
  )
);
