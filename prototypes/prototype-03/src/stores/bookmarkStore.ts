import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookmarkStoreState {
  bookmarks: string[]; // 保存した投稿の URI リスト
  addBookmark: (uri: string) => void;
  removeBookmark: (uri: string) => void;
  isBookmarked: (uri: string) => boolean;
}

export const useBookmarkStore = create<BookmarkStoreState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (uri) =>
        set((s) => {
          if (s.bookmarks.includes(uri)) return s;
          return { bookmarks: [...s.bookmarks, uri] };
        }),

      removeBookmark: (uri) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((u) => u !== uri) })),

      isBookmarked: (uri) => get().bookmarks.includes(uri),
    }),
    { name: "bsky-bookmarks" }
  )
);
