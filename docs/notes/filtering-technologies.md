# コンテンツフィルタリング技術調査

作成日: 2026-04-15  
参照: [client-countermeasures.md](client-countermeasures.md)

> 「ストレスを減らす SNS クライアント」において、投稿のテキスト・画像を自動的に解析・フィルタリングするために使える技術・手法を幅広く調査する。クライアントアプリとして実装する視点から、利用可能なライブラリ・API・モデルの選択肢も具体的に整理する。

---

## 1. フィルタリング処理の全体像

フィルタリングは大きく「**テキスト解析**」と「**画像解析**」に分かれ、さらに両者を組み合わせた「**マルチモーダル解析**」もある。また処理の実行場所によって「クライアントサイド（端末内）」と「サーバーサイド（外部 API）」に分かれる。

```
SNS API から受け取った投稿データ
        │
        ▼
┌──────────────────────────────┐
│  Layer 1: ルールベース        │  高速・オフライン可
│  キーワード / 正規表現        │  実装コスト：低
└──────────────┬───────────────┘
               │ パスしたもの
               ▼
┌──────────────────────────────┐
│  Layer 2: ML モデル（軽量）   │  感情分析・毒性検出
│  ローカル推論（WASM/GPU）     │  実装コスト：中
└──────────────┬───────────────┘
               │ 判定が難しいもの（オプション）
               ▼
┌──────────────────────────────┐
│  Layer 3: クラウド API        │  高精度・プライバシー考慮要
│  Perspective / Rekognition等  │  実装コスト：高
└──────────────────────────────┘
```

クライアントアプリとしては、**Layer 1・2 の組み合わせ**をまず実装し、必要に応じて Layer 3 を検討するのが現実的な進め方。

---

## 2. テキスト解析・フィルタリング

### 2-1. ルールベース：キーワード・正規表現

最もシンプルな手法。特定の語や表現パターンに一致したコンテンツを弾く。

**仕組み**

- ブロックワードリスト（BAD WORDS リスト）と照合する
- 正規表現（Regex）で「ひらがな混じりの表記ゆれ」「記号置換（l33tspeak）」なども検出する

**利点**

- 実装が容易で追加の依存がない
- オフライン動作・ゼロレイテンシー
- ロジックが透明で説明可能

**限界**

- 表記ゆれ・文脈を考慮できない（「死ぬほど楽しい」を誤検知するなど）
- 新語・隠語・絵文字への対応が追いつきにくい
- 閾値が低すぎると過剰フィルタ（False Positive）が増える

**実装イメージ（JavaScript）**

```javascript
const blockWords = ['殺す', '消えろ', /(\bk[i1]ll\b)/i];

function matchesBlock(text) {
  return blockWords.some(pattern =>
    typeof pattern === 'string'
      ? text.includes(pattern)
      : pattern.test(text)
  );
}
```

**利用できるリソース**

- [sightengine toxic keyword lists guide](https://sightengine.com/keyword-lists-for-text-moderation-the-guide) — 英語・多言語のブロックワードリストの解説
- getstream.io のブロックリスト定義（OSS プロジェクト向け）

---

### 2-2. 感情分析（Sentiment Analysis）

テキストの感情的極性（ポジティブ・ネガティブ・中立）や感情カテゴリ（怒り・悲しみ・喜びなど）を判定する。

#### アプローチ A：辞書・極性スコアベース

各単語に極性スコアを付けた辞書を使い、文章全体のスコアを集計する。軽量でオフライン動作可能。

| ツール/辞書 | 言語 | 特徴 |
|---|---|---|
| VADER | 英語 | SNS テキスト向けに最適化。絵文字・大文字・感嘆符を考慮 |
| TextBlob | 英語 | シンプルな API。ルールベース感情分析 |
| 日本語評価極性辞書 | 日本語 | 東北大 乾・岡崎研が公開。名詞・動詞・形容詞の極性スコア収録 |
| oseti | 日本語 | 上記辞書を Python で利用するラッパー |

```python
# oseti を使った日本語感情分析の例
import oseti
analyzer = oseti.Analyzer()
analyzer.analyze('最悪な気分になった')  # → ネガティブスコア
```

#### アプローチ B：機械学習モデル（Transformer ベース）

BERT などの事前学習済みモデルを使うことで、文脈を踏まえた高精度な感情分析ができる。

| モデル | 説明 |
|---|---|
| `cardiffnlp/twitter-roberta-base-sentiment` | Twitter データで学習。SNS 投稿向け |
| `cl-tohoku/bert-base-japanese` | 東北大の日本語 BERT。日本語テキスト向け |
| `koheiduck/bert-japanese-finetuned-sentiment` | 日本語感情分析向けにファインチューニング済み |

これらは Hugging Face Hub で公開されており、**Transformers.js** を使えばブラウザ・Node.js 上で直接推論できる。

```javascript
// Transformers.js でブラウザ内感情分析
import { pipeline } from '@xenova/transformers';

const classifier = await pipeline(
  'sentiment-analysis',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
);
const result = await classifier('I feel terrible today.');
// → [{ label: 'NEGATIVE', score: 0.998 }]
```

---

### 2-3. 毒性・攻撃性検出（Toxicity / Hate Speech Detection）

単なるネガティブ感情より強く、他者への攻撃・差別・脅迫などを検出する。

#### アプローチ A：Google Perspective API

Google と Jigsaw が開発した無料 API。コメントの毒性スコアを 0〜1 で返す。

**検出できる属性（一部）**

| 属性名 | 説明 |
|---|---|
| TOXICITY | 全般的な毒性 |
| SEVERE_TOXICITY | 強い毒性・罵倒 |
| INSULT | 侮辱 |
| THREAT | 脅迫 |
| PROFANITY | 不適切な語 |
| IDENTITY_ATTACK | 属性（人種・性別等）への攻撃 |

**対応言語:** 英語・日本語・スペイン語・ドイツ語ほか多数

```javascript
// Node.js での実装（perspective-api-client npm パッケージ）
import Perspective from 'perspective-api-client';
const client = new Perspective({ apiKey: process.env.PERSPECTIVE_KEY });

const result = await client.analyze('あなたなんか消えてしまえ', {
  attributes: ['TOXICITY', 'INSULT', 'THREAT'],
  languages: ['ja'],
});
const score = result.attributeScores.TOXICITY.summaryScore.value;
// score > 0.7 → フィルタ対象
```

**注意:** API キーをクライアントに埋め込まないこと。プロキシサーバー経由で使用する。

#### アプローチ B：ローカル ML モデル（Transformers.js）

プライバシーを重視する場合、外部 API を使わずブラウザ内で推論できる。

**主なモデル（Hugging Face Hub）**

| モデル | タスク | 言語 |
|---|---|---|
| `unitary/toxic-bert` | 毒性検出（多ラベル） | 英語 |
| `facebook/roberta-hate-speech-dynabench-r4-target` | ヘイトスピーチ検出 | 英語 |
| `Hate-speech-CNERG/dehatebert-mono-japanese` | ヘイトスピーチ検出 | 日本語 |
| `cardiffnlp/twitter-roberta-base-hate` | ヘイトスピーチ（Twitter） | 英語 |

モデルサイズが大きいため（数百 MB 〜）、量子化（INT8）版を使うと軽量化できる。初回起動時にキャッシュしてオフライン利用可能。

#### アプローチ C：OpenAI Moderation API

OpenAI が提供する無料のモデレーション API。GPT-4o ベースでテキスト・画像両対応。

**検出カテゴリ:** hate / harassment / self-harm / sexual / violence / illicit（薬物・武器）

```javascript
import OpenAI from 'openai';
const openai = new OpenAI();

const response = await openai.moderations.create({
  model: 'omni-moderation-latest',  // テキスト・画像対応のマルチモーダルモデル
  input: '今すぐ死ね',
});
const result = response.results[0];
// result.flagged → true/false
// result.categories → カテゴリ別フラグ
```

---

### 2-4. 日本語テキストの特有事項

日本語は形態素解析が必要なため、英語向けモデルをそのまま使えないケースがある。

**形態素解析ライブラリ（Node.js / ブラウザ）**

| ライブラリ | 特徴 |
|---|---|
| kuromoji.js | JavaScript 実装。ブラウザ動作可能 |
| mecab-ipadic-neologd | 新語・固有名詞に強い辞書（サーバーサイド） |
| sudachi.js | 日本語 NLP ライブラリ。複数の分割粒度に対応 |

**日本語特有の課題**

- 読点・句読点なしで意味が変わる
- 婉曲表現・ぼかし語が多い（「〇ぬ」「氏ね」など表記変形）
- コンテキストに依存する丁寧な攻撃（表面的には丁寧でも攻撃的な文）

---

## 3. 画像解析・フィルタリング

### 3-1. NSFW / 不適切コンテンツ検出

性的・暴力的・不快な画像を検出するカテゴリ。

#### オープンソースモデル

**NSFWJS（JavaScript / ブラウザ対応）**

TensorFlow.js ベースのクライアントサイド推論ライブラリ。サーバー不要で動作する。

```javascript
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';

const model = await nsfwjs.load();
const img = document.getElementById('myImage');
const predictions = await model.classify(img);
// → [
//   { className: 'Neutral', probability: 0.92 },
//   { className: 'Sexy',    probability: 0.05 },
//   { className: 'Porn',    probability: 0.02 },
//   ...
// ]
```

分類クラス: `Drawing` / `Hentai` / `Neutral` / `Porn` / `Sexy`  
精度: 小モデルで約 90%、中モデルで約 93%  
[GitHub: infinitered/nsfwjs](https://github.com/infinitered/nsfwjs)

**Falconsai/nsfw_image_detection（Hugging Face）**

約 8 万枚の画像で学習した Vision Transformer（ViT）ベースのモデル。Transformers.js 経由でブラウザ実行可能。

```javascript
import { pipeline } from '@xenova/transformers';
const classifier = await pipeline('image-classification', 'Falconsai/nsfw_image_detection');
const result = await classifier('image_url');
// → [{ label: 'normal', score: 0.98 }] or [{ label: 'nsfw', score: 0.87 }]
```

#### クラウド API

| API | 検出対象 | 特徴 |
|---|---|---|
| **AWS Rekognition** | 性的・暴力・薬物・武器・ヘイトシンボル等 | 信頼度スコア付き。動画対応。3 階層の分類ラベル |
| **Google Cloud Vision API SafeSearch** | 成人向け・スプーフィング・暴力・医療 | 2024 年末に精度更新。年 100 万リクエスト無料枠 |
| **Azure AI Content Safety** | 憎悪・性的・暴力・自傷（重度スコア 0〜6） | テキストと画像を統一 API で処理 |
| **Sightengine** | NSFW・暴力・テキスト・顔・薬物等 | リアルタイム性重視。ベンチマーク公開 |

---

### 3-2. 視覚的感情分析（Visual Sentiment Analysis）

画像全体が伝える感情・雰囲気を推定する。NSFW 検出とは異なり、「暗い・重い・攻撃的」な雰囲気を持つ画像を穏やかに扱う用途。

**技術的アプローチ**

- **CNNベース**: Inception-V3・ResNet などによる感情ラベル分類（happy / sad / angry / fearful / neutral など）
- **CLIP ベース**: テキストと画像の共通埋め込み空間を利用し、「怒り」「平和」などのテキストプロンプトとの類似度で感情を推定
- **物体・シーン認識との組み合わせ**: 画像に写っている物体（炎・武器・血など）からコンテキストを推論

**利用できるモデル**

| モデル | 説明 |
|---|---|
| `j-hartmann/emotion-english-distilroberta-base` | テキストの感情分類（画像のキャプションに応用可能） |
| `openai/clip-vit-base-patch32` | テキスト・画像の意味的距離計算。感情推定に応用可能 |
| Google Cloud Vision API | ラベル検出・安全性検索の組み合わせで雰囲気を判定 |

**研究動向（2024）**

- オブジェクトの意味（火・ナイフ・泥など）から感情を推論する OEAN（Object evoked Emotion Analysis Network）が提案されている（ScienceDirect, 2024）
- ViT + BERT のマルチモーダル統合による精度向上が報告されている（Springer, 2025）

---

### 3-3. オブジェクト・シーン分類（Object Detection / Scene Classification）

画像に何が写っているかを認識し、特定のカテゴリ（武器・血・炎・薬物など）を検出する。

**ユースケース**

- 暴力的な画像の自動折り畳み
- ユーザーが設定した「見たくないもの」（虫・食べ物・人物・特定スポーツなど）のフィルタリング

**利用できるモデル・ライブラリ**

| ツール | 特徴 |
|---|---|
| YOLO（v8/v10/v11） + ONNX.js | リアルタイム物体検出。ブラウザ推論可能 |
| TensorFlow.js COCO-SSD | 80 種類のオブジェクト検出。ブラウザ動作可能 |
| Google Cloud Vision API | 1,000 種類以上のラベル検出 |
| AWS Rekognition | 物体・シーン・テキスト・顔を統合検出 |

---

## 4. マルチモーダル解析（テキスト＋画像の統合）

テキストと画像を別々に解析するのでは見逃す文脈を、組み合わせて解析することで精度が上がる。特に「画像は問題ないがテキストが攻撃的」「画像単体では判断しにくいがキャプションで意味が変わる」ケースに有効。

### 利用できる API・モデル

**OpenAI Moderation API（omni-moderation-latest）**

テキストと画像を同時に渡してモデレーションできる。GPT-4o ベースで精度が高い。

```javascript
const response = await openai.moderations.create({
  model: 'omni-moderation-latest',
  input: [
    { type: 'text', text: 'キャプションのテキスト' },
    { type: 'image_url', image_url: { url: 'https://...' } },
  ],
});
```

**研究知見（2024〜2025）**

- 動画コンテンツのリスクシグナルは 89% が複数のモダリティ（テキスト・音声・映像）に同時に現れる（ICCV 2025 ワークショップ論文）
- Gemini-2.0-Flash が F1=0.91、GPT-4o が F1=0.87〜0.88 という精度を達成（比較評価研究 2025）

---

## 5. ブラウザ・クライアントサイド推論の基盤技術

SNS クライアントアプリ（デスクトップアプリ・ウェブアプリ）でローカル推論する場合の実行基盤。

### Transformers.js

Hugging Face のモデルを JavaScript（ブラウザ・Node.js）で実行するライブラリ。WebAssembly（WASM）と WebGPU をバックエンドとして使用する。

- **メリット**: データが端末外に出ないためプライバシーが高い。オフライン動作可能。API コストゼロ。
- **デメリット**: 初回起動時のモデルダウンロードに時間がかかる（モデルによっては数百 MB）。モバイル端末では重い。
- **軽量化手段**: INT8 量子化モデルを使うことでモデルサイズを 1/4〜1/2 に圧縮できる。

```bash
npm install @xenova/transformers
```

### ONNX Runtime Web

PyTorch・TensorFlow などで学習したモデルを ONNX フォーマットに変換し、ブラウザで実行する。

- WebAssembly（CPU）/ WebGPU（GPU）のどちらでも動作
- WebGPU 使用時は CPU 比 20〜50 倍の速度向上が報告されている

### TensorFlow.js

Google の JavaScript 向け ML ライブラリ。NSFW 検出（nsfwjs）など多くのプロジェクトが依存している。

---

## 6. プライバシーとアーキテクチャの選択

フィルタリング処理を「クライアントサイド（端末内）」か「サーバーサイド（外部 API）」のどちらで行うかは、精度・プライバシー・コスト・実装難度のトレードオフで決まる。

| 観点 | クライアントサイド（ローカル推論） | サーバーサイド（クラウド API） |
|---|---|---|
| プライバシー | 高（データが端末外に出ない） | 低〜中（API にデータを送信） |
| 精度 | 中（モデルサイズの制約あり） | 高（大規模モデル） |
| コスト | ゼロ（初回ダウンロード後） | 従量課金 |
| オフライン動作 | 可能 | 不可 |
| 起動時間 | 初回は遅い（モデル読み込み） | 即時 |
| 日本語対応 | モデル次第 | API によって良好 |

### 推奨アーキテクチャ

```
Layer 1（必須・常時オン）:
  キーワード / 正規表現フィルタ
  → 軽量・高速・オフライン。ユーザー編集可能なブロックリスト

Layer 2（デフォルトオン・ローカル推論）:
  Transformers.js による感情分析 / NSFW 検出
  → プライバシー最優先。オフライン動作。モデルは量子化版を使用

Layer 3（オプション・ユーザーが有効化）:
  Perspective API / OpenAI Moderation API
  → より高精度が必要な場合のみ。利用前にプライバシーポリシーを明示
```

---

## 7. 精度とユーザー体験のトレードオフ

### False Positive（過剰検知）と False Negative（検知漏れ）

どんなシステムも誤検知ゼロは不可能であり、閾値の設定によって二種類の誤りをトレードオフする。

| 閾値を低くする（厳しく） | 閾値を高くする（緩く） |
|---|---|
| 有害コンテンツを取りこぼしにくい | 正常コンテンツを誤って隠しにくい |
| 正常なコンテンツも誤フィルタしやすい | 有害コンテンツを見逃しやすい |
| ユーザーが「なぜ消えた？」と感じる | ストレスコンテンツが流入する |

実用的な閾値（0.6〜0.8 付近）では False Positive 率 1〜2%、False Negative 率 10% 程度が報告されている（emergentmind.com）。

### ユーザーコントロールを設計に組み込む

精度の不完全さをシステム側だけで解決しようとするのではなく、ユーザー自身が調整できる仕組みが重要。

- **閾値スライダー**: 「厳しく（見落とし少）」〜「緩く（誤検知少）」をユーザーが動かせる
- **フィルタ理由の表示**: 「このコンテンツはネガティブ感情スコアが高いため折り畳んでいます」
- **ワンクリックで展開**: フィルタされたコンテンツを簡単に見られるようにする（完全削除しない）
- **フィードバックボタン**: 「これは誤検知です」でローカルの例外リストに追加
- **カテゴリ別のオン/オフ**: 毒性検出はオン・NSFW 検出はオフ、など個別設定

---

## 8. 主要ライブラリ・API まとめ

### テキスト解析

| 名称 | 種別 | 言語 | 用途 | 備考 |
|---|---|---|---|---|
| VADER | OSS ライブラリ | 英語 | 感情分析 | SNS 向け。辞書ベース |
| TextBlob | OSS ライブラリ | 英語 | 感情分析 | 簡単な API |
| oseti | OSS ライブラリ | 日本語 | 感情分析 | 極性辞書ベース |
| kuromoji.js | OSS ライブラリ | 日本語 | 形態素解析 | ブラウザ動作可 |
| Transformers.js | OSS フレームワーク | 多言語 | 分類・感情分析 | ブラウザ/Node.js |
| Google Perspective API | クラウド API | 多言語（日本語含む） | 毒性検出 | 無料。要プロキシ |
| OpenAI Moderation API | クラウド API | 多言語 | 毒性・有害コンテンツ | 無料。マルチモーダル対応 |
| Azure AI Content Safety | クラウド API | 多言語 | テキスト・画像統合 | 重度スコア付き |

### 画像解析

| 名称 | 種別 | 用途 | 備考 |
|---|---|---|---|
| nsfwjs | OSS ライブラリ | NSFW 検出 | TF.js ベース。ブラウザ動作可 |
| Falconsai/nsfw_image_detection | OSS モデル | NSFW 検出 | Hugging Face。ViT ベース |
| TensorFlow.js COCO-SSD | OSS ライブラリ | 物体検出 | 80 クラス。ブラウザ動作可 |
| ONNX Runtime Web | OSS フレームワーク | 汎用推論基盤 | YOLO 等を実行可能 |
| AWS Rekognition | クラウド API | NSFW・暴力・物体検出 | 動画対応。AWS 従量課金 |
| Google Cloud Vision API | クラウド API | SafeSearch・ラベル検出 | 100 万/月 無料枠 |
| Azure AI Content Safety | クラウド API | 画像の有害コンテンツ | テキストと統合利用可 |
| Sightengine | クラウド API | NSFW・暴力・テキスト等 | リアルタイム性重視 |

---

## 9. 今後の技術動向

- **LLM による高精度なコンテキスト理解**: GPT-4o・Gemini などのマルチモーダル LLM は、従来の専用モデルを上回る精度でコンテンツのニュアンスを理解できる。ただしコスト・レイテンシーの課題がある。
- **端末内 LLM の小型化**: Phi-3 Mini・Gemma 2 などの小型モデルが 4GB 以下で動作するようになり、デスクトップアプリでのローカル高精度推論が現実的になりつつある。
- **感情の細粒度化**: 単純なポジ/ネガを超え、「羨ましい」「惨めな気持ちにさせる」「焦らせる」といったより細かい感情ラベルでのフィルタリングが研究されている。
- **ユーザー適応型フィルタリング**: 個々のユーザーのフィードバックでモデルを個人化する On-device Federated Learning の研究が進んでいる。

---

## 参考文献・情報源

- [Transformers.js – Hugging Face ドキュメント](https://huggingface.co/docs/transformers.js/index)
- [NSFWJS – GitHub (infinitered)](https://github.com/infinitered/nsfwjs)
- [Falconsai/nsfw_image_detection – Hugging Face](https://huggingface.co/Falconsai/nsfw_image_detection)
- [Google Perspective API – 公式](https://www.perspectiveapi.com/research/)
- [perspective-api-client – npm](https://www.npmjs.com/package/perspective-api-client)
- [Upgrading the Moderation API with multimodal model – OpenAI (2024)](https://openai.com/index/upgrading-the-moderation-api-with-our-new-multimodal-moderation-model/)
- [AWS Rekognition Content Moderation](https://aws.amazon.com/rekognition/content-moderation/)
- [Azure AI Content Safety](https://azure.microsoft.com/products/ai-services/ai-content-safety)
- [Benchmarking Google Vision / Rekognition / Azure on Image Moderation – Sightengine](https://medium.com/sightengine/benchmarking-google-vision-amazon-rekognition-microsoft-azure-on-image-moderation-73909739b8b4)
- [12 Best AI Content Moderation APIs – Estha (2024)](https://estha.ai/blog/12-best-ai-content-moderation-apis-compared-the-complete-guide/)
- [Using BERT for Hate Speech Detection – CEUR-WS](https://ceur-ws.org/Vol-2826/T2-11.pdf)
- [Comprehensive review: Hate speech detection in the age of the transformer – Springer (2024)](https://link.springer.com/article/10.1007/s13278-024-01361-3)
- [ONNX Runtime Web – Microsoft Open Source Blog](https://opensource.microsoft.com/blog/2021/09/02/onnx-runtime-web-running-your-machine-learning-model-in-browser/)
- [AI in browsers: TensorFlow vs ONNX vs WebDNN – LogRocket](https://blog.logrocket.com/ai-in-browsers-comparing-tensorflow-onnx-and-webdnn-for-image-classification/)
- [Visual Sentiment Analysis with Semantic Correlation – Springer (2023)](https://link.springer.com/article/10.1007/s40747-023-01296-w)
- [Contextual emotion detection in images using deep learning – Frontiers in AI (2024)](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2024.1386753/full)
- [Advancing Content Moderation: Evaluating LLMs – arXiv (2024)](https://arxiv.org/abs/2411.17123)
- [Toxic keyword lists guide – Sightengine](https://sightengine.com/keyword-lists-for-text-moderation-the-guide)
- [日本語評価極性辞書 – 東北大 乾・岡崎研究室](http://www.cl.ecei.tohoku.ac.jp/index.php?Open%20Resources%2FJapanese%20Sentiment%20Polarity%20Dictionary)
- [Python で日本語感情分析 – Qiita](https://qiita.com/hnishi/items/0d32a778e375a99aff13)
