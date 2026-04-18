import { create } from "zustand";
import type { FilterResult } from "@/lib/filters/keywordFilter";
import type { MLModelStatus } from "@/lib/filters/mlFilter";

interface FilterStoreState {
  /** post URI → ML フィルタ結果 */
  mlResults: Record<string, FilterResult>;
  setMLResult: (uri: string, result: FilterResult) => void;

  /** 今セッションでフィルタされた件数 */
  filteredCount: number;
  incrementFilteredCount: () => void;
  resetFilteredCount: () => void;

  /** ML モデルの読み込み状態 */
  mlStatus: MLModelStatus;
  setMLStatus: (status: MLModelStatus) => void;

  /** ユーザーが「誤検知」と報告した URI セット（ローカル例外リスト） */
  exceptions: Set<string>;
  addException: (uri: string) => void;
}

export const useFilterStore = create<FilterStoreState>()((set) => ({
  mlResults: {},
  setMLResult: (uri, result) =>
    set((s) => ({ mlResults: { ...s.mlResults, [uri]: result } })),

  filteredCount: 0,
  incrementFilteredCount: () => set((s) => ({ filteredCount: s.filteredCount + 1 })),
  resetFilteredCount: () => set({ filteredCount: 0 }),

  mlStatus: "idle",
  setMLStatus: (status) => set({ mlStatus: status }),

  exceptions: new Set(),
  addException: (uri) =>
    set((s) => ({ exceptions: new Set([...s.exceptions, uri]) })),
}));
