import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppBskyFeedDefs } from "@atproto/api";

export type EditionStatus = "reading" | "completed" | "paused";
export type CompletionType = "natural" | "manual";

export interface Edition {
  id: string;
  posts: AppBskyFeedDefs.FeedViewPost[];
  createdAt: string; // ISO 文字列。内部管理用。UI には表示しない
  readUntilIndex: number;
  status: EditionStatus;
  completionType?: CompletionType;
}

interface EditionStoreState {
  currentEdition: Edition | null;
  isFetching: boolean;
  fetchError: string | null;

  fetchEdition: (
    posts: AppBskyFeedDefs.FeedViewPost[]
  ) => void;
  markRead: (index: number) => void;
  completeEdition: (type: CompletionType) => void;
  resumeEdition: () => void;
  clearEdition: () => void;
  setFetching: (v: boolean) => void;
  setFetchError: (msg: string | null) => void;
}

export const useEditionStore = create<EditionStoreState>()(
  persist(
    (set) => ({
      currentEdition: null,
      isFetching: false,
      fetchError: null,

      fetchEdition: (posts) =>
        set({
          currentEdition: {
            id: crypto.randomUUID(),
            posts,
            createdAt: new Date().toISOString(),
            readUntilIndex: 0,
            status: "reading",
          },
          fetchError: null,
        }),

      markRead: (index) =>
        set((s) => {
          if (!s.currentEdition) return s;
          if (index <= s.currentEdition.readUntilIndex) return s;
          return {
            currentEdition: { ...s.currentEdition, readUntilIndex: index },
          };
        }),

      completeEdition: (type) =>
        set((s) => {
          if (!s.currentEdition) return s;
          return {
            currentEdition: {
              ...s.currentEdition,
              status: "completed",
              completionType: type,
              readUntilIndex: s.currentEdition.posts.length,
            },
          };
        }),

      resumeEdition: () =>
        set((s) => {
          if (!s.currentEdition) return s;
          return {
            currentEdition: { ...s.currentEdition, status: "reading" },
          };
        }),

      clearEdition: () => set({ currentEdition: null }),

      setFetching: (v) => set({ isFetching: v }),
      setFetchError: (msg) => set({ fetchError: msg }),
    }),
    {
      name: "bsky-edition",
      // posts 配列は大きいため、paused/completed 状態のときのみ保存
      partialize: (s) => ({ currentEdition: s.currentEdition }),
    }
  )
);
