import type { FilterResult } from "./keywordFilter";

type PendingRequest = {
  resolve: (result: FilterResult) => void;
  reject: (error: Error) => void;
  threshold: number;
};

export type MLModelStatus = "idle" | "loading" | "ready" | "error";

type StatusListener = (status: MLModelStatus) => void;

class MLFilterService {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private counter = 0;
  private _status: MLModelStatus = "idle";
  private statusListeners: Set<StatusListener> = new Set();

  get status(): MLModelStatus {
    return this._status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: MLModelStatus) {
    this._status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  init() {
    if (this.worker) return;

    this.worker = new Worker(
      new URL("../../workers/mlFilter.worker.ts", import.meta.url),
      { type: "module" }
    );

    this.worker.onmessage = (e: MessageEvent) => {
      const data = e.data as
        | { type: "status"; status: string; message?: string }
        | {
            id: string;
            result?: { labels: string[]; scores: number[] };
            error?: string;
          };

      if ("type" in data && data.type === "status") {
        if (data.status === "loading") this.setStatus("loading");
        if (data.status === "ready") this.setStatus("ready");
        if (data.status === "error") this.setStatus("error");
        return;
      }

      if ("id" in data) {
        const pending = this.pending.get(data.id);
        if (!pending) return;
        this.pending.delete(data.id);

        if (data.error) {
          pending.reject(new Error(data.error));
          return;
        }

        const labels = data.result?.labels ?? [];
        const scores = data.result?.scores ?? [];

        if (labels.length === 0) {
          pending.resolve({ filtered: false, reason: null });
          return;
        }

        // ゼロショット分類の結果はスコア降順で返ってくる
        // scores[0] が最も確信度の高いラベル
        const topLabel = labels[0];
        const topScore = scores[0];

        if (topScore >= pending.threshold) {
          pending.resolve({
            filtered: true,
            reason: "ml_negative",
            score: topScore,
            matchedLabel: topLabel,
          });
        } else {
          pending.resolve({ filtered: false, reason: null, score: topScore });
        }
      }
    };

    this.worker.onerror = () => {
      this.setStatus("error");
    };

    this.setStatus("loading");
  }

  analyze(text: string, threshold: number, labels: string[]): Promise<FilterResult> {
    if (!this.worker) {
      this.init();
    }

    return new Promise((resolve, reject) => {
      const id = String(this.counter++);
      this.pending.set(id, { resolve, reject, threshold });
      this.worker!.postMessage({ id, text, labels });
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this._status = "idle";
  }
}

export const mlFilterService = new MLFilterService();
