# プロトタイプ 02 計画書

作成日: 2026-04-16  
ステータス: 計画中

---

## 目的

このプロトタイプで検証したいことは **2 つ**に絞る。

1. **コンテンツフィルタリングの有効性確認**  
   ルールベース（Layer 1）＋ローカル ML 推論（Layer 2）の組み合わせで、タイムライン上の有害・ネガティブコンテンツを実際に減らせるか確認する。

2. **フィルタ UI の体験確認**  
   フィルタされた投稿を「折り畳み表示」にしてワンクリックで展開できるデザインが、ストレス低減と情報の透明性を両立できるか体感する。

---

## スコープ

### 作るもの

| 機能 | 説明 |
|---|---|
| Layer 1 フィルタ | キーワード・正規表現によるルールベースフィルタ（日本語・英語対応） |
| Layer 2 フィルタ | Transformers.js による感情分析・毒性スコアのローカル推論 |
| 折り畳み表示 | フィルタ対象の投稿を非表示ではなく「理由付きで折り畳む」 |
| フィルタ設定 | 強度スライダー・カテゴリ別オン/オフ・カスタムキーワードリスト |
| フィルタ統計 | セッション中にフィルタされた件数の表示 |

### ストレス低減の検証軸（prototype-01 から引き継ぐ）

| 対策 | 内容 |
|---|---|
| エンゲージメント数の非表示 | prototype-01 から継続 |
| 時系列タイムライン | prototype-01 から継続 |
| ページネーション | prototype-01 から継続 |
| 通知のバッチ表示 | prototype-01 から継続 |

### 作らないもの（スコープ外）

- Layer 3（Perspective API・OpenAI Moderation API など外部クラウド API）
  - プライバシー面・プロキシ実装コストを考慮し、今回は見送る
- 画像フィルタリング（nsfwjs など）
  - テキストフィルタリングの体験検証に集中するため、今回は見送る
- カスタム ML モデルのファインチューニング
- フォロー・アンフォロー操作（prototype-01 から引き続きスコープ外）
- OAuth 認証（App Password で継続）

---

## フィルタリング設計

### Layer 1：ルールベース

```
src/lib/filters/keywordFilter.ts
```

- 事前定義のブロックワードリスト（日本語・英語）を JSON ファイルで管理
- 正規表現パターンで表記ゆれ・記号置換を検出
- ユーザーがカスタムキーワードを追加・削除できる（settingsStore に永続化）
- 処理速度: 1 投稿あたり < 1ms（同期処理）

### Layer 2：ローカル ML 推論

```
src/lib/filters/mlFilter.ts
src/workers/mlFilter.worker.ts
```

- **モデル**: `Xenova/distilbert-base-uncased-finetuned-sst-2-english`（感情分析）
  - サイズ: 約 67MB（量子化 INT8 版）
  - 精度: SST-2 で 91% 超
  - 初回起動時にキャッシュ、以降はオフライン動作
- Web Worker で推論を実行し、メインスレッドをブロックしない
- スコアが閾値（デフォルト 0.75）を超えた投稿を「ネガティブ」と判定
- 日本語投稿は Layer 1 のみ適用（今回のプロトタイプでは割り切り）

### フィルタ結果の型

```typescript
type FilterResult = {
  filtered: boolean;       // フィルタ対象かどうか
  reason: FilterReason;    // 'keyword' | 'ml_negative' | 'ml_toxic' | null
  score?: number;          // ML スコア（0〜1）
  matchedKeyword?: string; // マッチしたキーワード（Layer 1 の場合）
};
```

---

## 画面構成

Prototype-01 の画面構成を引き継ぎ、フィルタリング機能を追加する。

```
/login        (ログイン画面・変更なし)
/home         (タイムライン・PostCard にフィルタ表示を追加)
/notifications (通知・変更なし)
/profile/:handle (プロフィール・変更なし)
/post/:handle/:rkey (投稿詳細・変更なし)
/settings     (設定・フィルタ設定セクションを追加)
```

---

## コンポーネント設計

### 新規コンポーネント

```
src/components/post/FilteredPostCard.tsx
  - フィルタされた投稿の折り畳み表示
  - 「なぜ隠れているか」の理由表示
  - 「展開して見る」ボタン

src/components/filter/FilterSettings.tsx
  - 強度スライダー（0.5〜0.95）
  - カテゴリ別トグル（キーワード・ML感情・ML毒性）
  - カスタムキーワードリスト（追加・削除）

src/components/filter/FilterStats.tsx
  - 「今日のフィルタ数: X 件」表示
  - サイドバーまたは設定画面に配置
```

### 変更するコンポーネント

```
src/components/post/PostCard.tsx
  - フィルタ判定を呼び出す
  - 結果に応じて FilteredPostCard を描画

src/stores/settingsStore.ts
  - filterSettings を追加
    - enabled: boolean
    - layer1Enabled: boolean
    - layer2Enabled: boolean
    - threshold: number (0.5〜0.95)
    - customKeywords: string[]

src/stores/filterStatsStore.ts (新規)
  - filteredCount: number（セッション中のフィルタ件数）
  - filteredItems: FilteredItem[]（直近の記録）
```

---

## 技術スタック

Prototype-01 から引き継ぎ、以下を追加する。

| 項目 | 採用 | 追加理由 |
|---|---|---|
| @xenova/transformers | v3 | ブラウザ内 ML 推論（感情分析） |
| vite-plugin-top-level-await | - | Transformers.js の非同期初期化対応 |

---

## 実装フェーズ

### Phase 1：Prototype-01 の完成（〜2日）

prototype-01 で未実装だった機能を仕上げてベースラインを確立する。

- [ ] 投稿フォームの実装（RichText 対応）
- [ ] スレッド詳細・返信の実装
- [ ] プロフィール画面の実装
- [ ] 通知画面の完全実装
- [ ] ログアウト機能

### Phase 2：Layer 1 フィルタの実装（〜2日）

- [ ] ブロックワードリスト JSON の作成（日本語・英語）
- [ ] keywordFilter.ts の実装
- [ ] FilteredPostCard.tsx の実装（折り畳み・展開 UI）
- [ ] PostCard.tsx にフィルタ判定を組み込む
- [ ] settingsStore にフィルタ設定を追加
- [ ] 設定画面にカスタムキーワードリスト UI を追加

### Phase 3：Layer 2 フィルタの実装（〜3日）

- [ ] @xenova/transformers のセットアップ
- [ ] Web Worker の実装（mlFilter.worker.ts）
- [ ] mlFilter.ts の実装（モデル読み込み・推論）
- [ ] 推論結果を PostCard に反映
- [ ] モデル読み込み状態の表示（ローディングインジケータ）
- [ ] 閾値スライダーの実装

### Phase 4：統計・調整（〜1日）

- [ ] filterStatsStore の実装
- [ ] FilterStats コンポーネントの実装
- [ ] フィルタ理由の日本語表示
- [ ] 誤検知フィードバックボタン（ローカル例外リストに追加）

---

## 完成の定義（このプロトタイプが「終わった」と言える条件）

- キーワードフィルタが動作し、対象投稿が折り畳まれる
- ML モデルの推論がバックグラウンドで動作し、ネガティブ投稿が折り畳まれる
- フィルタ設定の変更が即座にタイムラインに反映される
- 1〜2 日実際に使ってみて、フィルタによる体験の変化を感じられる

---

## 次のプロトタイプに向けた判断軸

- 「フィルタされた件数は感覚と合っているか（過剰 / 不足）」
- 「折り畳み表示は情報の損失感があるか、それとも安心感があるか」
- 「ML 推論の遅延はタイムライン体験を損なうか」
- 「キーワードリストの管理はユーザーにとって負担か」
- 「日本語への ML 対応（Layer 2）は必要か」
