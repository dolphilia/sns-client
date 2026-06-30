import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDesktopFileStorage } from "@/lib/persistStorage";

export type FeedSource = "following" | "discover" | "custom";

// Bluesky 公式 Discover フィードの URI
export const DISCOVER_FEED_URI =
  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot";

export interface FeedSettings {
  includeReposts: boolean;
  onlyImagePosts: boolean;
  feedSource: FeedSource;
  customFeedUri: string;
  customFeedUris: string[];
  selectedCustomFeedUri: string;
}

export interface DiscoverSettings {
  feedUris: string[];
  selectedFeedUri: string;
}

export interface FeedDisplaySettings {
  fullWidth: boolean;
  feedWidth: number;
  grid: boolean;
  gridPostSize: number;
  showAvatar: boolean;
  showDisplayName: boolean;
  showHandle: boolean;
  showTimestamp: boolean;
  showText: boolean;
  showImages: boolean;
  cropImagesToSquare: boolean;
  showActions: boolean;
}

export interface FollowSafetySettings {
  preventRefollowAfterUnfollow: boolean;
  muteOnUnfollow: boolean;
}

interface SettingsState {
  hideEngagementCounts: boolean;
  setHideEngagementCounts: (v: boolean) => void;

  feedSettings: FeedSettings;
  setFeedSettings: (v: Partial<FeedSettings>) => void;

  discoverSettings: DiscoverSettings;
  setDiscoverSettings: (v: Partial<DiscoverSettings>) => void;

  feedDisplaySettings: FeedDisplaySettings;
  setFeedDisplaySettings: (v: Partial<FeedDisplaySettings>) => void;

  followSafetySettings: FollowSafetySettings;
  setFollowSafetySettings: (v: Partial<FollowSafetySettings>) => void;

  mutedKeywords: string[];
  addMutedKeyword: (keyword: string) => void;
  removeMutedKeyword: (keyword: string) => void;
}

const defaultFeedSettings: FeedSettings = {
  includeReposts: false,
  onlyImagePosts: false,
  feedSource: "following",
  customFeedUri: "",
  customFeedUris: [],
  selectedCustomFeedUri: "",
};

const defaultDiscoverSettings: DiscoverSettings = {
  feedUris: [],
  selectedFeedUri: "",
};

const defaultFeedDisplaySettings: FeedDisplaySettings = {
  fullWidth: true,
  feedWidth: 720,
  grid: false,
  gridPostSize: 320,
  showAvatar: true,
  showDisplayName: true,
  showHandle: true,
  showTimestamp: true,
  showText: true,
  showImages: true,
  cropImagesToSquare: false,
  showActions: true,
};

const defaultFollowSafetySettings: FollowSafetySettings = {
  preventRefollowAfterUnfollow: true,
  muteOnUnfollow: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hideEngagementCounts: true,
      setHideEngagementCounts: (v) => set({ hideEngagementCounts: v }),

      feedSettings: defaultFeedSettings,
      setFeedSettings: (v) =>
        set((s) => {
          const next = { ...s.feedSettings, ...v };
          return {
            feedSettings: {
              ...next,
              selectedCustomFeedUri:
                next.selectedCustomFeedUri ||
                next.customFeedUris[0] ||
                next.customFeedUri ||
                defaultFeedSettings.selectedCustomFeedUri,
            },
          };
        }),

      discoverSettings: defaultDiscoverSettings,
      setDiscoverSettings: (v) =>
        set((s) => {
          const next = { ...s.discoverSettings, ...v };
          return {
            discoverSettings: {
              ...next,
              selectedFeedUri:
                next.selectedFeedUri || next.feedUris[0] || defaultDiscoverSettings.selectedFeedUri,
            },
          };
        }),

      feedDisplaySettings: defaultFeedDisplaySettings,
      setFeedDisplaySettings: (v) =>
        set((s) => ({
          feedDisplaySettings: { ...s.feedDisplaySettings, ...v },
        })),

      followSafetySettings: defaultFollowSafetySettings,
      setFollowSafetySettings: (v) =>
        set((s) => ({
          followSafetySettings: { ...s.followSafetySettings, ...v },
        })),

      mutedKeywords: [],
      addMutedKeyword: (keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;
        const current = get().mutedKeywords;
        if (current.includes(trimmed)) return;
        set({ mutedKeywords: [...current, trimmed] });
      },
      removeMutedKeyword: (keyword) =>
        set((s) => ({
          mutedKeywords: s.mutedKeywords.filter((k) => k !== keyword),
        })),
    }),
    {
      name: "bsky-settings",
      storage: createJSONStorage(() => createDesktopFileStorage()),
      merge: (persisted: unknown, current: SettingsState): SettingsState => {
        const p = persisted as Partial<SettingsState> & {
          editionSettings?: Partial<FeedSettings>;
          filterSettings?: { customKeywords?: string[] };
        };
        const feedSettings = {
          ...current.feedSettings,
          ...p.feedSettings,
          ...p.editionSettings,
        };
        const customFeedUris = [
          ...feedSettings.customFeedUris,
          ...(feedSettings.customFeedUri ? [feedSettings.customFeedUri] : []),
        ].filter((uri, index, uris) => uri && uris.indexOf(uri) === index);
        const discoverSettings = {
          ...current.discoverSettings,
          ...p.discoverSettings,
        };

        return {
          ...current,
          ...p,
          feedSettings: {
            ...feedSettings,
            customFeedUris,
            selectedCustomFeedUri:
              feedSettings.selectedCustomFeedUri ||
              customFeedUris[0] ||
              feedSettings.customFeedUri ||
              "",
          },
          discoverSettings: {
            ...discoverSettings,
            selectedFeedUri:
              discoverSettings.selectedFeedUri || discoverSettings.feedUris[0] || "",
          },
          feedDisplaySettings: {
            ...current.feedDisplaySettings,
            ...p.feedDisplaySettings,
          },
          followSafetySettings: {
            ...current.followSafetySettings,
            ...p.followSafetySettings,
          },
          mutedKeywords:
            p.mutedKeywords ?? p.filterSettings?.customKeywords ?? current.mutedKeywords,
        };
      },
    }
  )
);
