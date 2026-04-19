import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppBskyFeedDefs } from "@atproto/api";

// 号の状態遷移
// idle → fetching → screening → reading → completed
export type ScreeningState =
  | "idle"        // 待機中（「読み始める」待ち）
  | "fetching"    // Bluesky API から投稿を取得中
  | "screening"   // LLM が吟味中（投稿が届き始めている）
  | "reading"     // 吟味完了・号が固定・読書中
  | "completed";  // 読み終わり

export type CompletionType = "natural" | "manual";

interface ScreeningStoreState {
  // 状態マシン
  screeningState: ScreeningState;

  // 吟味の進行
  approvedPosts: AppBskyFeedDefs.FeedViewPost[]; // LLM を通過した投稿（順次追加）
  screenedCount: number;   // 吟味が完了した件数（通過 + 却下）
  fetchedTotal: number;    // 取得した投稿の総数
  isScreeningDone: boolean;

  // 読書位置
  readUntilIndex: number;
  completionType: CompletionType | null;

  // エラー
  fetchError: string | null;

  // ── アクション ──

  /** fetching 開始（「読み始める」ボタン押下時） */
  setFetching: () => void;

  /** API 取得完了 → 吟味開始。取得した全投稿数を記録 */
  startScreening: (fetchedTotal: number) => void;

  /** LLM を通過した投稿を 1 件追加 */
  addApprovedPost: (post: AppBskyFeedDefs.FeedViewPost) => void;

  /** 1 件の吟味が完了（通過・却下いずれも） */
  incrementScreened: () => void;

  /** 全件の吟味完了 → reading に移行 */
  finishScreening: () => void;

  /** 読み位置の更新 */
  markRead: (index: number) => void;

  /** 完了を宣言 */
  completeEdition: (type: CompletionType) => void;

  /** エラー */
  setFetchError: (msg: string | null) => void;

  /** 初期化（次の号へ） */
  reset: () => void;
}

const initialState = {
  screeningState: "idle" as ScreeningState,
  approvedPosts: [],
  screenedCount: 0,
  fetchedTotal: 0,
  isScreeningDone: false,
  readUntilIndex: 0,
  completionType: null,
  fetchError: null,
};

export const useScreeningStore = create<ScreeningStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setFetching: () =>
        set({ ...initialState, screeningState: "fetching", fetchError: null }),

      startScreening: (fetchedTotal) =>
        set({ screeningState: "screening", fetchedTotal }),

      addApprovedPost: (post) =>
        set((s) => ({ approvedPosts: [...s.approvedPosts, post] })),

      incrementScreened: () =>
        set((s) => ({ screenedCount: s.screenedCount + 1 })),

      finishScreening: () =>
        set({ screeningState: "reading", isScreeningDone: true }),

      markRead: (index) =>
        set((s) => {
          if (index <= s.readUntilIndex) return s;
          return { readUntilIndex: index };
        }),

      completeEdition: (type) =>
        set({ screeningState: "completed", completionType: type }),

      setFetchError: (msg) =>
        set({ fetchError: msg, screeningState: "idle" }),

      reset: () => set(initialState),
    }),
    {
      name: "bsky-screening",
      // 吟味途中でアプリを閉じた場合、届いた投稿と読み位置を復元できるように保存
      partialize: (s) => ({
        screeningState:
          // fetching/screening 中にアプリを閉じた場合は reading として復元
          s.screeningState === "fetching" || s.screeningState === "screening"
            ? "reading"
            : s.screeningState,
        approvedPosts: s.approvedPosts,
        fetchedTotal: s.fetchedTotal,
        isScreeningDone: true, // 復元時は常に吟味完了扱い
        readUntilIndex: s.readUntilIndex,
        completionType: s.completionType,
        screenedCount: s.screenedCount,
        fetchError: null,
      }),
    }
  )
);
