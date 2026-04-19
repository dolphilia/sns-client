import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FilterSettings {
  enabled: boolean;
  /** LLM フィルターの強度 0.0（弱）〜 1.0（強）。内部で threshold に変換 */
  filterStrength: number;
  customKeywords: string[];
}

/** filterStrength（0〜1）→ stress_score 閾値（0.05〜0.95）に変換 */
export function strengthToThreshold(strength: number): number {
  return Math.round((0.95 - strength * 0.9) * 100) / 100;
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

  editionSettings: EditionSettings;
  setEditionSettings: (v: Partial<EditionSettings>) => void;
}

const defaultFilterSettings: FilterSettings = {
  enabled: true,
  filterStrength: 0.5, // 中程度（threshold = 0.50）
  customKeywords: [],
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
