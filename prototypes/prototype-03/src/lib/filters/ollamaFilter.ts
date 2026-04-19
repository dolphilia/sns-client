import type { FilterResult } from "./keywordFilter";

export type OllamaModelStatus = "idle" | "checking" | "ready" | "unavailable" | "error";

export interface StressAnalysis {
  stress_score: number;      // 0.0〜1.0
  category: string;          // ストレス要因のカテゴリ
  reason: string;            // 判定理由（日本語）
  confidence: "high" | "medium" | "low";
}

const OLLAMA_BASE_URL = "http://localhost:11434";
const MODEL_NAME = "qwen3.5:9b";

const STRESS_DETECTION_PROMPT = `あなたはSNS投稿のストレス検出AIです。
以下の投稿テキストを分析し、閲覧者がストレスを感じる可能性を0.0から1.0の小数で評価してください。

判定基準：
- 攻撃的・侮辱的な表現
- 脅迫・ハラスメント
- ヘイトスピーチ（特定の属性への差別）
- 自傷・自殺に関する表現
- 極端な扇動・煽り
- 不安・恐怖を過度に煽る内容
- 論争を呼ぶ政治的・宗教的主張

スコア例：0.0=全く問題なし、0.3=やや気になる、0.6=問題あり、0.9=非常に有害

必ず以下のJSON形式だけで回答してください。JSON以外のテキストは出力しないでください：
{"stress_score": 0.0以上1.0以下の小数, "category": "攻撃的表現/脅迫/ヘイトスピーチ/自傷関連/扇動/不安煽り/論争的主張/問題なし のいずれか", "reason": "判定理由を1文で", "confidence": "high/medium/low のいずれか"}

投稿テキスト：
`;

type StatusListener = (status: OllamaModelStatus) => void;

class OllamaFilterService {
  private _status: OllamaModelStatus = "idle";
  private statusListeners: Set<StatusListener> = new Set();
  private checkPromise: Promise<void> | null = null;

  get status(): OllamaModelStatus {
    return this._status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: OllamaModelStatus) {
    this._status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
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
        if (!res.ok) {
          this.setStatus("unavailable");
          return;
        }
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

  private async callOllama(text: string): Promise<StressAnalysis | null> {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          stream: false,
          think: false,       // 思考モード無効（qwen3 系はデフォルトで有効）
          options: {
            temperature: 0.1,
            num_predict: 300,  // 思考なしなら300で十分
          },
          messages: [
            {
              role: "user",
              content: STRESS_DETECTION_PROMPT + text,
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) throw new Error(`Ollama API error: ${res.status}`);

      const data = await res.json() as { message: { content: string; thinking?: string } };
      const content = data.message.content.trim();

      console.debug("[OllamaFilter] raw content:", content);

      // JSON部分を抽出（モデルが余分なテキストを出力した場合に対応）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[OllamaFilter] JSON not found in:", content);
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
    }
  }

  async analyzeDetailed(text: string): Promise<StressAnalysis | null> {
    if (this._status === "idle") await this.checkAvailability();
    if (this._status !== "ready") return null;
    return this.callOllama(text);
  }

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
