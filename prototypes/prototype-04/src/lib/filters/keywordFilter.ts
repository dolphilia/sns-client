import builtinWords from "@/data/blockWords.json";

export type FilterReason = "keyword" | "ml_negative" | "ml_toxic" | null;

export interface FilterResult {
  filtered: boolean;
  reason: FilterReason;
  matchedKeyword?: string;
  matchedLabel?: string; // ゼロショット分類でマッチしたラベル名
  score?: number;
}

const BUILTIN_STRINGS: string[] = builtinWords.strings;
const BUILTIN_PATTERNS: RegExp[] = builtinWords.patterns.map((p) => new RegExp(p, "i"));

export function applyKeywordFilter(text: string, customKeywords: string[]): FilterResult {
  const lower = text.toLowerCase();

  // ビルトインの文字列リスト
  for (const word of BUILTIN_STRINGS) {
    if (lower.includes(word.toLowerCase())) {
      return { filtered: true, reason: "keyword", matchedKeyword: word };
    }
  }

  // ビルトインの正規表現パターン
  for (const pattern of BUILTIN_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { filtered: true, reason: "keyword", matchedKeyword: match[0] };
    }
  }

  // ユーザーが追加したカスタムキーワード
  for (const word of customKeywords) {
    if (word.trim() && lower.includes(word.trim().toLowerCase())) {
      return { filtered: true, reason: "keyword", matchedKeyword: word.trim() };
    }
  }

  return { filtered: false, reason: null };
}
