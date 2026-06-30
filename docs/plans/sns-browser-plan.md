# SNS ブラウザ実験アプリ計画書

作成日: 2026-06-30  
ステータス: 一部実装済み  
前提: [dedicated-sns-browser-research-20260630.md](../notes/dedicated-sns-browser-research-20260630.md)

## 目的

`apps/sns-browser/` に、X / Threads / mixi2 など API クライアント化が難しい SNS を対象にした個人実験用ブラウザを作る。

2026-07-01 時点では、Electron shell、`WebContentsView` 表示、サイト切り替え、navigation allowlist、permission policy、CSS ルール注入、組み込み script による DOM マーカー付け、ルール保存、カスタム CSS は実装済み。Monaco Editor 化、汎用 JS 編集、高度モード、配布導線は未完了。

このアプリは一般公開やストア配布を目的にしない。公式 Web 版 SNS を Electron の埋め込みブラウザで表示し、CSS と最小限のユーザースクリプトで、見た目・通知圧・操作導線を自分用に調整する。

## 検証したいこと

1. **API なしでもストレス低減 UI を作れるか**  
   公式 Web 版を表示したまま、エンゲージメント数、トレンド、通知バッジ、過剰な導線を弱められるか確認する。

2. **X / Threads / mixi2 を同じ仕組みで扱えるか**  
   SNS ごとに DOM や UI は違うが、サイト定義、CSS プリセット、軽い script runner という共通構造で運用できるか確認する。

3. **Monaco Editor でルール編集を実用的にできるか**  
   Stylus / Tampermonkey ほど汎用にせず、個人実験用の CSS / JS 編集体験として成立するか確認する。

## 基本方針

| 方針 | 扱い |
|---|---|
| 個人実験用 | 明記する。一般公開・ストア配布・第三者利用は前提にしない。 |
| 主対象 | X / Threads / mixi2。Bluesky / Mastodon は主対象にしない。 |
| 表示調整中心 | CSS と軽い DOM 操作で読む体験を調整する。 |
| 自動操作しない | 自動投稿、自動いいね、自動フォロー、自動リポストは作らない。 |
| 非公開 API を使わない | Web 版の通信を解析して直接 API 呼び出ししない。 |
| 大量保存しない | 投稿本文・画像・プロフィールの収集やキャッシュを目的にしない。 |
| 安全側に倒す | 個人用でも Electron セキュリティ設定は厳しめにする。 |

## スコープ

### 作るもの

| 機能 | 説明 |
|---|---|
| Electron shell | `apps/sns-browser/` に独立した Electron + React + Vite アプリを置く。 |
| SNS 表示領域 | `WebContentsView` で公式 Web 版 SNS を表示する。 |
| サイト切り替え | X / Threads / mixi2 のプリセット URL を切り替える。 |
| navigation allowlist | 許可 origin 外の遷移を止めるか外部ブラウザで開く。 |
| permission policy | 通知、カメラ、マイク、位置情報などを制御する。 |
| CSS 注入 | `webContents.insertCSS` でサイト別 CSS を適用する。 |
| プリセット CSS | エンゲージメント数非表示、トレンド非表示、表示密度調整など。 |
| ルール一覧 | サイト別にルールをオン/オフできる。 |
| CSS 編集 | 現時点ではカスタム CSS 入力から開始。Monaco Editor 化は後続。 |
| 設定保存 | `userData/sns-browser/` 配下に JSON 保存する。 |
| 手動適用 | 編集した CSS を保存前または保存後に現在ページへ再適用できる。 |

### 後回し

| 機能 | 理由 |
|---|---|
| 任意 JS 編集 | セキュリティ面の検討が必要なため、CSS 編集の後にする。 |
| Tampermonkey 互換 | 初期 MVP には重い。metadata block の一部対応から始める。 |
| Stylus UserCSS 完全互換 | まず独自プリセットで十分。 |
| 複数タブ | 最初はサイト切り替えで足りる。 |
| ネットワークブロック UI | 広告回避や規約リスクに踏み込みやすいため後回し。 |
| 拡張機能読み込み | Electron の extension support 依存が増えるため後回し。 |
| 同期機能 | 個人実験用なので不要。 |

### 作らないもの

| 機能 | 理由 |
|---|---|
| 非公開 API 直接利用 | 規約・保守・安全面のリスクが高い。 |
| スクレイピング | このアプリはデータ収集ツールではない。 |
| 自動投稿 / 自動反応 | bot / automation と見なされやすい。 |
| 広告・課金・ログイン制限の回避 | 表示調整の範囲を超える。 |
| 一般公開用の配布導線 | 個人実験用のため。 |
| Chromium fork | 保守負荷が大きすぎる。 |

## 技術スタック

| 領域 | 採用 |
|---|---|
| デスクトップ基盤 | Electron |
| UI | React + TypeScript |
| ビルド | Vite |
| 埋め込みブラウザ | Electron `WebContentsView` |
| 状態管理 | Zustand |
| スタイリング | Tailwind CSS + 既存 shadcn/ui 系コンポーネント |
| エディタ | 現状は軽量な CSS 入力欄。Monaco Editor は後続候補。 |
| 永続化 | `app.getPath("userData")` 配下の JSON |
| 検証 | `npm run build`、必要に応じて Playwright |

## ディレクトリ構成

```txt
apps/sns-browser/
├── electron/
│   ├── main.ts
│   ├── view-manager.ts
│   ├── site-registry.ts
│   ├── rule-runner.ts
│   ├── navigation-policy.ts
│   ├── permission-policy.ts
│   ├── storage.ts
│   └── preload/
│       └── app-preload.ts
├── src/
│   ├── components/
│   │   ├── BrowserToolbar.tsx
│   │   ├── RulePanel.tsx
│   │   └── SiteSidebar.tsx
│   ├── lib/
│   │   ├── defaults.ts
│   │   └── types.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
└── vite.config.ts
```

## データモデル

```ts
type SiteId = "x" | "threads" | "mixi2";

type SiteDefinition = {
  id: SiteId;
  label: string;
  homeUrl: string;
  allowedOrigins: string[];
  externalLinkPolicy: "open-external" | "confirm";
  defaultRuleIds: string[];
};

type BrowserRule = {
  id: string;
  siteId: SiteId;
  name: string;
  description?: string;
  enabled: boolean;
  type: "css" | "script";
  runAt: "document-start" | "document-end" | "document-idle";
  content: string;
  builtin: boolean;
};

type AppSettings = {
  activeSiteId: SiteId;
  advancedMode: boolean;
  openExternalLinksInDefaultBrowser: boolean;
  rememberLastUrl: boolean;
};
```

## 保存設計

```txt
userData/
└── sns-browser/
    ├── settings.json
    ├── sites.json
    └── rules/
        ├── x.json
        ├── threads.json
        └── mixi2.json
```

保存するのは設定とルールだけにする。SNS の Cookie やログインセッションは Electron/Chromium の session 管理に任せ、アプリ独自の JSON にはコピーしない。

## 画面設計

### メイン画面

- 左サイドバー: サイト切り替え、現在のルール状態、設定への導線
- 中央: `WebContentsView` の表示領域
- 上部バー: 戻る、進む、再読み込み、現在 URL、外部で開く
- 右パネル: ルール一覧、CSS 編集、適用状態

### ルール編集

現時点では、ルールパネル内の入力欄でカスタム CSS を編集する。Monaco Editor は後続の改善候補として残す。

- 保存後に現在ページへ再注入
- プリセットへ戻す
- 有効/無効の切り替え

JS 編集は高度モードを明示的にオンにした場合だけ表示する。

## サイト別初期プリセット

### X

- 右カラムのトレンド / おすすめを非表示
- エンゲージメント数を非表示
- 通知バッジを弱める
- リポスト / 引用ボタンを控えめにする
- メディアの最大高さを抑える

### Threads

- エンゲージメント数を非表示
- 投稿本文の幅と余白を調整
- おすすめ導線を弱める
- 連続スクロールの休憩表示を実験する

### mixi2

- 通知圧の強い表示を弱める
- エンゲージメント数やリアクション数を控えめにする
- コミュニティ / イベント表示の密度を調整する
- 実験に不要な登録・招待導線を控えめにする

## セキュリティ要件

- `nodeIntegration: false`
- `contextIsolation: true`
- SNS 表示用 `WebContentsView` は `sandbox: true`
- アプリ UI の `BrowserWindow` は IPC preload の都合で `sandbox: false`。リモート SNS ページは表示しない。
- `webSecurity: true`
- allowlist 外の navigation は止めるか外部ブラウザへ逃がす
- `window.open` は main process 側で制御する
- 通知、カメラ、マイク、位置情報はデフォルト拒否
- preload からリモートページへ Node / Electron API を渡さない
- 任意 JS は初期 MVP に含めない
- remote code の自動更新機能は作らない

## 実装フェーズ

### Phase 1: Shell

- [x] `apps/sns-browser/` を作る
- [x] Electron + React + Vite の最小起動
- [x] `WebContentsView` で X / Threads / mixi2 を表示
- [x] 戻る / 進む / 再読み込み
- [x] navigation allowlist

### Phase 2: CSS Rules

- [x] サイト定義を追加
- [x] CSS ルールスキーマを追加
- [x] `insertCSS` でプリセット注入
- [x] ルールのオン/オフ
- [x] JSON 保存

### Phase 3: Monaco Editor

- [ ] Monaco Editor を追加
- [x] CSS 編集 UI
- [x] 保存、再適用、プリセット復元
- [ ] 簡易バリデーション

### Phase 4: Site Presets

- [x] X 用プリセット
- [x] Threads 用プリセット
- [x] mixi2 用プリセット
- [x] サイト切り替え時のルール再適用
- [ ] 手動確認用チェックリスト

### Phase 5: Script Runner

- [ ] 高度モードを追加
- [x] 組み込み script の注入
- [x] MutationObserver ベースの再適用
- [ ] 任意 JS 編集前のセキュリティレビュー

## 検証

自動テストが難しい領域なので、最初は以下を最低ラインにする。

- `npm run build`
- ログアウト状態で X / Threads / mixi2 の初期ページが表示できる
- allowlist 外リンクがアプリ内で勝手に開かない
- CSS ルールをオン/オフできる
- カスタム CSS が保存・再適用される
- アプリ再起動後も設定が残る

ログイン済みページの確認は、個人環境で手動確認する。ログイン情報やスクリーンショットを repo に保存しない。

## 未決事項

- `apps/desktop/` と依存をどこまで共有するか
- session partition を SNS ごとに分けるか、実験アプリ内で 1 つにまとめるか
- JS 高度モードをいつ解禁するか
- Monaco Editor をいつ導入するか
