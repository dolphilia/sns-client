import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FilterSettings {
  enabled: boolean;
  layer1Enabled: boolean;
  layer2Enabled: boolean;
  threshold: number;
  customKeywords: string[];
  detectionLabels: string[];
}

export type EditionSize = 10 | 20 | 30 | 50;
export type FeedSource = "following" | "discover" | "custom";

// Bluesky公式DiscoverフィードのURI
export const DISCOVER_FEED_URI =
  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";

export interface EditionSettings {
  size: EditionSize;
  includeReposts: boolean;
  ambientSyncEnabled: boolean;
  feedSource: FeedSource;
  customFeedUri: string;
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

  editionSettings: EditionSettings;
  setEditionSettings: (v: Partial<EditionSettings>) => void;
}

const defaultFilterSettings: FilterSettings = {
  enabled: true,
  layer1Enabled: true,
  layer2Enabled: false,
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

const defaultEditionSettings: EditionSettings = {
  size: 30,
  includeReposts: false,
  ambientSyncEnabled: true,
  feedSource: "following",
  customFeedUri: "",
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
          filterSettings: { ...s.filterSettings, customKeywords: [...current, trimmed] },
        }));
      },

      removeCustomKeyword: (keyword) =>
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            customKeywords: s.filterSettings.customKeywords.filter((k) => k !== keyword),
          },
        })),

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

      removeDetectionLabel: (label) =>
        set((s) => ({
          filterSettings: {
            ...s.filterSettings,
            detectionLabels: s.filterSettings.detectionLabels.filter((l) => l !== label),
          },
        })),

      editionSettings: defaultEditionSettings,
      setEditionSettings: (v) =>
        set((s) => ({ editionSettings: { ...s.editionSettings, ...v } })),
    }),
    {
      name: "bsky-settings",
      merge: (persisted: unknown, current: SettingsState): SettingsState => {
        const p = persisted as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          filterSettings: { ...current.filterSettings, ...p.filterSettings },
          editionSettings: { ...current.editionSettings, ...p.editionSettings },
        };
      },
    }
  )
);
