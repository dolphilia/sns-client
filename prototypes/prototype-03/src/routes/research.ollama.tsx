import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ollamaFilterService, type OllamaModelStatus } from "@/lib/filters/ollamaFilter";


export const Route = createFileRoute("/research/ollama")({
  component: OllamaResearchPage,
});

const TEST_POSTS = [
  "今日もいい天気ですね！散歩してきました🌸",
  "あいつは本当に使えない。なんでこんな奴が生きてるんだ",
  "政治家は全員腐敗している。国民を騙し続けるな",
  "最近なんか疲れてて、消えちゃいたいなって思う",
  "新しいカフェ行ってきた☕️めちゃくちゃ美味しかった",
  "〇〇人は出て行け。この国に要らない",
  "締め切り間に合わなかった…もう終わりだ…",
  "今日のランチは手作り弁当！卵焼きうまくできた😊",
];

interface TestResult {
  text: string;
  score: number;
  category: string;
  reason: string;
  confidence: string;
  filtered: boolean;
  latencyMs: number;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 0.7 ? "bg-red-500" : score >= 0.4 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-sm font-mono">{score.toFixed(2)}</span>
    </div>
  );
}

// フィルター強度（0〜1）を内部閾値（stress_score）に変換
// 強度 0 → 閾値 0.95（ほぼ何もフィルタしない）
// 強度 1 → 閾値 0.05（ほぼ全件フィルタ）
function strengthToThreshold(strength: number): number {
  return Math.round((0.95 - strength * 0.9) * 100) / 100;
}

function strengthLabel(strength: number): string {
  if (strength < 0.1) return "オフ";
  if (strength < 0.35) return "弱";
  if (strength < 0.65) return "中";
  if (strength < 0.85) return "強";
  return "最強";
}

function OllamaResearchPage() {
  const [status, setStatus] = useState<OllamaModelStatus>("idle");
  const [customText, setCustomText] = useState("");
  const [filterStrength, setFilterStrength] = useState(0.5); // デフォルト「中」
  const threshold = strengthToThreshold(filterStrength);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [singleResult, setSingleResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const unsub = ollamaFilterService.onStatusChange(setStatus);
    ollamaFilterService.checkAvailability();
    return unsub;
  }, []);

  async function runSingle(text: string): Promise<TestResult> {
    const start = Date.now();
    const analysis = await ollamaFilterService.analyzeDetailed(text);
    const latencyMs = Date.now() - start;

    const score = analysis?.stress_score ?? 0;
    return {
      text,
      score,
      category: analysis?.category ?? "問題なし",
      reason: analysis?.reason ?? "",
      confidence: analysis?.confidence ?? "",
      filtered: score >= threshold,
      latencyMs,
    };
  }

  async function runAllTests() {
    setRunning(true);
    setResults([]);
    const newResults: TestResult[] = [];
    for (const text of TEST_POSTS) {
      const r = await runSingle(text);
      newResults.push(r);
      setResults([...newResults]);
    }
    setRunning(false);
  }

  async function runCustomTest() {
    if (!customText.trim()) return;
    setRunning(true);
    const r = await runSingle(customText.trim());
    setSingleResult(r);
    setRunning(false);
  }

  const statusColor: Record<OllamaModelStatus, string> = {
    idle: "text-gray-400",
    checking: "text-yellow-500",
    ready: "text-green-500",
    unavailable: "text-red-500",
    error: "text-red-500",
  };

  const statusLabel: Record<OllamaModelStatus, string> = {
    idle: "未確認",
    checking: "確認中…",
    ready: "接続済み（qwen3.5:9b）",
    unavailable: "Ollama 未起動 / モデル未取得",
    error: "エラー",
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold">Ollama ストレス検出 研究ページ</h1>
        <p className="text-sm text-gray-500 mt-1">qwen3.5:9b を使ったローカル LLM フィルターの検証</p>
      </div>

      {/* ステータス */}
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Ollama ステータス：</span>
          <span className={`text-sm ${statusColor[status]}`}>{statusLabel[status]}</span>
          {status === "unavailable" && (
            <button
              className="text-xs text-blue-500 underline ml-2"
              onClick={() => ollamaFilterService.checkAvailability()}
            >
              再確認
            </button>
          )}
        </div>
        {status === "unavailable" && (
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded p-2">
            $ ollama serve<br />
            $ ollama pull qwen3.5:9b
          </p>
        )}
      </div>

      {/* フィルター強度設定 */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">フィルター強度</span>
          <span className="text-sm font-bold">{strengthLabel(filterStrength)}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={filterStrength}
            onChange={(e) => setFilterStrength(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
            <span>弱</span>
            <span>強</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          スライダーを右に動かすほどフィルタリングが強くなります（内部閾値：{threshold.toFixed(2)}）
        </p>
      </div>

      {/* カスタムテスト */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium">任意テキストを検証</h2>
        <textarea
          className="w-full border rounded p-2 text-sm h-20 resize-none"
          placeholder="SNS投稿テキストを入力…"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
        />
        <button
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-40"
          onClick={runCustomTest}
          disabled={running || status !== "ready" || !customText.trim()}
        >
          {running ? "解析中…" : "解析する"}
        </button>
        {singleResult && (
          <div className="bg-gray-50 rounded p-3 space-y-1">
            <ScoreBar score={singleResult.score} />
            <p className="text-sm">カテゴリ：{singleResult.category}</p>
            <p className="text-xs text-gray-500">
              {singleResult.filtered ? "⛔ フィルタリング対象" : "✅ 通過"} ／ {singleResult.latencyMs}ms
            </p>
          </div>
        )}
      </div>

      {/* バッチテスト */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">サンプル投稿バッチテスト（{TEST_POSTS.length}件）</h2>
          <button
            className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded disabled:opacity-40"
            onClick={runAllTests}
            disabled={running || status !== "ready"}
          >
            {running ? "実行中…" : "全件テスト"}
          </button>
        </div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`rounded p-3 text-sm space-y-1 ${r.filtered ? "bg-red-50" : "bg-green-50"}`}>
              <p className="font-medium truncate">{r.text}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                <ScoreBar score={r.score} />
                <span className="text-xs text-gray-600 font-medium">{r.category}</span>
                {r.confidence && (
                  <span className="text-xs text-gray-400">確信度: {r.confidence}</span>
                )}
                <span className="text-xs text-gray-400">{r.latencyMs}ms</span>
              </div>
              {r.reason && (
                <p className="text-xs text-gray-500 mt-1">{r.reason}</p>
              )}
            </div>
          ))}
          {running && results.length < TEST_POSTS.length && (
            <div className="text-xs text-gray-400 animate-pulse">
              解析中… ({results.length}/{TEST_POSTS.length})
            </div>
          )}
        </div>
        {results.length === TEST_POSTS.length && (
          <div className="text-xs text-gray-500 border-t pt-2">
            平均レイテンシ：{Math.round(results.reduce((a, r) => a + r.latencyMs, 0) / results.length)}ms ／
            フィルタリング率：{results.filter((r) => r.filtered).length}/{results.length}件
          </div>
        )}
      </div>
    </div>
  );
}
