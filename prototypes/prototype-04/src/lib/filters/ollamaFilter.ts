import type { FilterResult } from "./keywordFilter";

export type OllamaModelStatus = "idle" | "checking" | "ready" | "unavailable" | "error";

export interface StressAnalysis {
  stress_score: number;      // 0.0〜1.0
  category: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

const OLLAMA_BASE_URL = "http://localhost:11434";
const MODEL_NAME = "qwen3.5:9b";

// Few-shot プロンプト：具体例でスコアのスケール感を固定する
const SYSTEM_PROMPT = `あなたはSNS投稿の吟味AIです。投稿を読んで、閲覧者がストレスを感じる可能性を0.0から1.0の小数で評価してください。

判定基準：
- 攻撃的・侮辱的な表現
- 脅迫・ハラスメント
- ヘイトスピーチ（特定の属性への差別）
- 自傷・自殺に関する表現
- 極端な扇動・煽り
- 不安・恐怖を過度に煽る内容
- 論争を呼ぶ政治的・宗教的主張

【出力例】
投稿: 今日は天気がよくて散歩してきた☀️
→ {"stress_score": 0.02, "category": "問題なし", "reason": "穏やかな日常の共有。", "confidence": "high"}

投稿: あの会社のサービス使いにくすぎる、改善してほしい
→ {"stress_score": 0.20, "category": "不満表現", "reason": "製品への不満だが攻撃性は低い。", "confidence": "high"}

投稿: 政治家は全員嘘つきだ、信用できない
→ {"stress_score": 0.50, "category": "論争的主張", "reason": "政治的な一般化だが暴力的表現はない。", "confidence": "medium"}

投稿: あいつは本当に使えない、なんで生きてるんだ
→ {"stress_score": 0.85, "category": "攻撃的表現", "reason": "特定個人への侮辱と存在否定を含む。", "confidence": "high"}

投稿: 〇〇人は出て行け、この国に要らない
→ {"stress_score": 0.96, "category": "ヘイトスピーチ", "reason": "特定の民族・属性への排除表現。", "confidence": "high"}

必ず以下のJSON形式だけで回答してください。JSON以外のテキストは出力しないでください：
{"stress_score": 数値, "category": "カテゴリ", "reason": "理由を1文で", "confidence": "high/medium/low"}`;

type StatusListener = (status: OllamaModelStatus) => void;

class OllamaFilterService {
  private _status: OllamaModelStatus = "idle";
  private statusListeners: Set<StatusListener> = new Set();
  private checkPromise: Promise<void> | null = null;

  // 並列リクエスト数の上限（M1 Pro 16GB に合わせた設定）
  private readonly MAX_CONCURRENT = 2;
  private activeRequests = 0;
  private queue: Array<() => void> = [];

  get status(): OllamaModelStatus {
    return this._status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: OllamaModelStatus) {
    this._status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  async checkAvailability(): Promise<boolean> {
    if (this.checkPromise) {
      await this.checkPromise;
      return this._status === "ready";
    }

    this.setStatus("checking");
    this.checkPromise = (async () => {
      try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) { this.setStatus("unavailable"); return; }

        const data = await res.json() as { models: { name: string }[] };
        const hasModel = data.models.some((m) => m.name.startsWith("qwen3.5"));
        this.setStatus(hasModel ? "ready" : "unavailable");
      } catch {
        this.setStatus("unavailable");
      } finally {
        this.checkPromise = null;
      }
    })();

    await this.checkPromise;
    return this._status === "ready";
  }

  // 並列数を制御するセマフォ
  private async acquireSlot(): Promise<void> {
    if (this.activeRequests < this.MAX_CONCURRENT) {
      this.activeRequests++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(() => { this.activeRequests++; resolve(); });
    });
  }

  private releaseSlot() {
    this.activeRequests--;
    const next = this.queue.shift();
    if (next) next();
  }

  private async callOllama(text: string): Promise<StressAnalysis | null> {
    await this.acquireSlot();
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          stream: false,
          think: false,
          options: { temperature: 0.1, num_predict: 150 },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: `投稿: ${text}` },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) throw new Error(`Ollama API error: ${res.status}`);

      const data = await res.json() as { message: { content: string } };
      const content = data.message.content.trim();

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[OllamaFilter] JSON not found:", content);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]) as StressAnalysis;

      // モデルが 0〜10 スケールで返した場合に正規化
      if (parsed.stress_score > 1) {
        parsed.stress_score = Math.min(parsed.stress_score / 10, 1.0);
      }

      return parsed;
    } catch (e) {
      console.error("[OllamaFilter] Error:", e);
      return null;
    } finally {
      this.releaseSlot();
    }
  }

  /** 詳細な分析結果を返す（研究ページ用） */
  async analyzeDetailed(text: string): Promise<StressAnalysis | null> {
    if (this._status === "idle") await this.checkAvailability();
    if (this._status !== "ready") return null;
    return this.callOllama(text);
  }

  /** 吟味結果を FilterResult 形式で返す（パイプライン用） */
  async analyze(text: string, threshold: number): Promise<FilterResult> {
    if (this._status === "idle") await this.checkAvailability();
    if (this._status !== "ready") return { filtered: false, reason: null };

    const analysis = await this.callOllama(text);
    if (!analysis) return { filtered: false, reason: null };

    if (analysis.stress_score >= threshold) {
      return {
        filtered: true,
        reason: "ml_negative",
        score: analysis.stress_score,
        matchedLabel: analysis.category,
      };
    }
    return { filtered: false, reason: null, score: analysis.stress_score };
  }

  reset() {
    this._status = "idle";
    this.checkPromise = null;
  }
}

export const ollamaFilterService = new OllamaFilterService();
