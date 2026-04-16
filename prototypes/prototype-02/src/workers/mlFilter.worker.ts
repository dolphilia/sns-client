import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

type ZeroShotPipeline = Awaited<ReturnType<typeof pipeline>>;
let classifier: ZeroShotPipeline | null = null;
let loadingPromise: Promise<void> | null = null;

async function initModel() {
  if (classifier) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    self.postMessage({ type: "status", status: "loading" });
    classifier = await pipeline(
      "zero-shot-classification",
      "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
      { device: "wasm" }
    );
    self.postMessage({ type: "status", status: "ready" });
  })();

  return loadingPromise;
}

initModel().catch((e) => {
  self.postMessage({ type: "status", status: "error", message: String(e) });
});

self.onmessage = async (event: MessageEvent) => {
  const { id, text, labels } = event.data as {
    id: string;
    text: string;
    labels: string[];
  };

  try {
    await initModel();
    if (!classifier) {
      self.postMessage({ id, error: "モデルが読み込まれていません" });
      return;
    }
    if (!labels || labels.length === 0) {
      self.postMessage({ id, result: { labels: [], scores: [] } });
      return;
    }

    // multi_label: false → ラベルを排他的に扱い、合計スコアが 1 になる
    const result = await (classifier as any)(text, labels, { multi_label: false });
    self.postMessage({ id, result });
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
