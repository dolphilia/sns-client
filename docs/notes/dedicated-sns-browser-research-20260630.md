# SNS 専用ブラウザ方向性調査

作成日: 2026-06-30  
関連: [current-direction-20260629.md](current-direction-20260629.md) / [client-countermeasures.md](client-countermeasures.md) / [alternative-sns-client-candidates-20260629.md](alternative-sns-client-candidates-20260629.md)

## 目的

Bluesky / AT Protocol の API クライアントではなく、公式 Web 版 SNS を専用ブラウザ内で表示し、Stylus のような CSS 注入や Tampermonkey / Violentmonkey のようなユーザースクリプト注入で見た目・挙動を調整する方向性を検討する。

この方式は、SNS 側の公開 API が弱い、または存在しない場合にも「ユーザーのブラウザ上の表示を調整する」形で体験改善できる可能性がある。一方で、規約、セキュリティ、DOM 変更への追従、ログインセッションの扱いが主要なリスクになる。

## 結論

最も現実的なのは **Electron ベースの専用ブラウザ + サイト別ルールエンジン**。

現行プロジェクトはすでに Electron + React + Vite へ寄せているため、API クライアントと別プロダクトにする場合でも技術的な連続性が高い。Tauri は軽量だが、今回の要件では「任意サイトをブラウザとして表示し、CSS/JS/ネットワーク/権限を細かく制御する」必要があり、Chromium を同梱する Electron の方が向いている。

このアプリは一般公開用ではなく、個人的な実験用のローカルアプリとして扱う。したがって、ストア配布、第三者ユーザー向けの安全説明、規約上の公開サービス化、同期サーバーなどは初期計画に含めない。対象も Bluesky / Mastodon のような API クライアント化しやすい SNS ではなく、**X / Threads / mixi2 のように API クライアント化が難しい SNS** を主対象にする。

ただし、最初から「汎用 Tampermonkey 互換ブラウザ」を作るべきではない。初期 MVP は **特定 SNS 向けの安全なプリセット集**に絞る。ユーザーが任意コードを追加できる高度モードは後回しにする。任意 CSS / JS を編集する場合のエディタは、使い慣れている **Monaco Editor** を採用する。

## 方向性比較

| 方式 | 作りやすさ | 制御力 | 配布 | 主な懸念 | 判定 |
|---|---|---|---|---|---|
| Chrome / Firefox 拡張 | 中 | 中 | ストア配布しやすい | Manifest V3 制約、ブラウザ差、審査、一般ブラウザ依存 | サブ案 |
| Electron 専用ブラウザ | 高 | 高 | デスクトップアプリとして配布 | セキュリティ責任、Chromium 同梱サイズ、ログイン保護 | 最有力 |
| Tauri / WebView2 専用ブラウザ | 中 | 中 | 軽量 | OS WebView 差、拡張 API 不足、注入/検証のばらつき | 優先度低 |
| Chromium / CEF ベース独自ブラウザ | 低 | 最高 | 重い | 保守負荷が非常に高い | 当面除外 |
| Playwright/Puppeteer 自動操作型 | 低〜中 | 高 | 開発用向き | 自動化・スクレイピング扱いになりやすい | 製品用途では除外 |

## 推奨スタック

| 領域 | 推奨 |
|---|---|
| デスクトップ基盤 | Electron |
| 埋め込みブラウザ | `WebContentsView` |
| アプリ UI | React + TypeScript + Vite |
| 設定 UI | 既存の shadcn/ui 系コンポーネント |
| 状態管理 | Zustand |
| 永続化 | Electron `app.getPath("userData")` 配下の JSON または SQLite |
| CSS 注入 | `webContents.insertCSS(css, { cssOrigin: "user" })` |
| JS 注入 | `webContents.executeJavaScriptInIsolatedWorld()` を基本にし、必要時のみ main world |
| ネットワーク制御 | Electron `session.webRequest` |
| 権限制御 | `session.setPermissionRequestHandler()` |
| エディタ | Monaco Editor |
| 検証 | Playwright + スクリーンショット差分 |

## 前提条件

- アプリは個人実験用で、一般公開やストア配布は目標にしない。
- 主対象は X、Threads、mixi2。Bluesky / Mastodon は比較検証用または実装練習用に留める。
- 公式 Web 版を表示し、ユーザーが手動でログインして使う。
- 非公開 API を直接呼び出さない。
- 投稿、フォロー、いいね、リポストなどを自動実行しない。
- ページ内容を大量保存しない。ローカル保存はルール、表示設定、必要最小限の既読位置や自分用メモに限定する。
- 実験用なので、対象 SNS の DOM 変更で壊れる前提を受け入れ、壊れたらプリセットを直す運用にする。

## 実装イメージ

```txt
apps/sns-browser/
├── electron/
│   ├── main.ts
│   ├── app-window.ts
│   ├── view-manager.ts
│   ├── site-registry.ts
│   ├── rule-runner.ts
│   ├── permission-policy.ts
│   ├── navigation-policy.ts
│   ├── storage.ts
│   └── preload/
│       ├── app-preload.ts
│       └── page-isolated-preload.ts
├── src/
│   ├── routes/
│   ├── components/
│   │   ├── browser/
│   │   ├── editor/
│   │   ├── rules/
│   │   ├── sites/
│   │   └── settings/
│   ├── stores/
│   ├── lib/
│   │   ├── rule-schema.ts
│   │   ├── match-pattern.ts
│   │   ├── preset-rules.ts
│   │   └── script-sandbox.ts
│   └── main.tsx
└── package.json
```

画面構成は、左に対象 SNS 切り替えとルール状態、中央に公式 Web 版、右または設定画面にチューニング項目を置く。初期対象は X / Threads / mixi2 に絞る。

```txt
┌──────────────┬──────────────────────────────┬────────────────────┐
│ SNS / Mode   │ WebContentsView               │ Rules / Settings   │
│ X            │ https://x.com                 │ Hide metrics: on   │
│ Threads      │ https://www.threads.net       │ Calm feed: on      │
│ mixi2        │ https://mixi.social           │ Custom CSS         │
│              │                               │ Custom scripts     │
└──────────────┴──────────────────────────────┴────────────────────┘
```

## アプリ境界

`apps/desktop/` は Bluesky API クライアントとして維持し、`apps/sns-browser/` は公式 Web 版 SNS を包む実験用ブラウザとして分ける。

| 項目 | `apps/desktop/` | `apps/sns-browser/` |
|---|---|---|
| 主対象 | Bluesky / AT Protocol | X / Threads / mixi2 |
| データ取得 | 公開 API / SDK | 公式 Web UI を表示 |
| 操作 | API 経由で実装 | 原則ユーザー手動操作 |
| 体験制御 | 自前 React UI | CSS / JS 注入 |
| 壊れやすさ | API 変更に依存 | DOM / UI 変更に依存 |
| 目的 | 通常の SNS クライアント | 個人実験用の読みやすさ調整ブラウザ |

## Electron 側の責務

| モジュール | 責務 |
|---|---|
| `app-window.ts` | BrowserWindow の生成、アプリ UI のロード |
| `view-manager.ts` | SNS ごとの `WebContentsView` 生成、配置、表示切替 |
| `site-registry.ts` | 対象 SNS の URL、許可 origin、ログイン URL、初期プリセットを定義 |
| `navigation-policy.ts` | allowlist 外の遷移を外部ブラウザへ逃がす、危険な navigation を止める |
| `permission-policy.ts` | 通知、カメラ、マイク、位置情報、メディア自動再生などの許可判断 |
| `rule-runner.ts` | URL 変更、ロード完了、ルール変更時に CSS / JS を再注入 |
| `storage.ts` | 設定、ルール、サイト別セッション設定を `userData` 配下へ保存 |

## Renderer 側の責務

| 領域 | 責務 |
|---|---|
| `components/browser` | 戻る、進む、再読み込み、現在 URL 表示、サイト切替 |
| `components/sites` | X / Threads / mixi2 のサイトカード、ログイン状態メモ、プリセット状態 |
| `components/rules` | ルール一覧、オン/オフ、プリセット復元、手動適用 |
| `components/editor` | Monaco Editor による CSS / JS 編集 |
| `components/settings` | セキュリティ、権限、データ保存、高度モードの設定 |
| `stores` | 選択サイト、ルール編集状態、表示設定、保存状態 |

## ルールエンジン

Stylus / Tampermonkey 互換を最初から丸ごと実装するのではなく、以下の独自スキーマから始める。

```ts
type SiteRule = {
  id: string;
  site: "x" | "threads" | "mixi2" | "bluesky" | "mastodon";
  match: string[];
  enabled: boolean;
  css: CssRule[];
  scripts: ScriptRule[];
  network?: NetworkRule[];
};

type CssRule = {
  id: string;
  name: string;
  enabled: boolean;
  runAt: "document-start" | "document-end";
  content: string;
};

type ScriptRule = {
  id: string;
  name: string;
  enabled: boolean;
  runAt: "document-start" | "document-end" | "document-idle";
  world: "isolated" | "main";
  content: string;
};
```

ユーザースクリプト互換が必要になった段階で、Violentmonkey / Tampermonkey の metadata block に寄せる。最低限対応するキーは `@name`、`@match`、`@exclude`、`@run-at`、`@grant`、`@version` 程度でよい。

初期実装では、`@grant` 互換の API は作らない。ユーザースクリプトは DOM 調整に限定し、GM_* API、外部通信、クリップボード、ファイルアクセス、バックグラウンド巡回は後回しにする。

## サイト定義

対象 SNS ごとに、許可 URL、初期 URL、プリセット、注意点を明示する。

```ts
type SiteDefinition = {
  id: "x" | "threads" | "mixi2";
  label: string;
  homeUrl: string;
  allowedOrigins: string[];
  externalLinkPolicy: "open-external" | "confirm";
  defaultRules: string[];
};
```

初期定義:

| site | `homeUrl` | `allowedOrigins` の例 | 方針 |
|---|---|---|---|
| X | `https://x.com/home` | `https://x.com`, `https://twitter.com` | 改善余地は大きいが DOM 変更と bot 判定に注意 |
| Threads | `https://www.threads.net/` | `https://www.threads.net`, `https://threads.net` | Web UI の閲覧調整を中心にする |
| mixi2 | `https://mixi.social/` | `https://mixi.social` | 公開 API がないため表示調整のみ。規約上、解析・自動化は避ける |

## CSS でできること

| 目的 | 例 | 難度 |
|---|---|---|
| エンゲージメント数を隠す | いいね数、リポスト数、返信数、フォロワー数の非表示 | 低 |
| 推薦・トレンドを隠す | おすすめ欄、トレンド欄、広告枠の非表示 | 低〜中 |
| 密度調整 | 行間、カード幅、画像サイズ、サイドバー幅の調整 | 低 |
| 刺激の低減 | 彩度を下げる、通知バッジを隠す、赤色警告を弱める | 低 |
| フィード終端感 | 一定件数以降を畳む、休憩メッセージを出す | 中 |

CSS は壊れにくいが、対象 SNS の DOM class 名が頻繁に変わる場合はメンテナンスが必要になる。できるだけ `aria-label`、role、URL、テキスト構造など、意味に近いセレクタを使う。

## ユーザースクリプトでできること

| 目的 | 例 | 難度 |
|---|---|---|
| SPA 遷移への追従 | History API / URL 変更を検知して再適用 | 中 |
| 投稿カード単位の加工 | 数字だけ削除、特定語を含む投稿を畳む | 中 |
| 操作導線の変更 | リポスト/引用ボタンを隠す、確認ダイアログを挟む | 中 |
| セッション単位の制限 | 30 件読んだらフィードを畳む、一定時間で休憩表示 | 中 |
| ローカル保存 | 端末内ブックマーク、既読位置、非表示ルール | 中 |

専用ブラウザ方式では、SNS の API を使わずに公式 Web 版を表示できるため、mixi2 のように公開 API がないサービスでも「見た目を整える」範囲なら検討余地がある。ただし、非公開 API の直接呼び出し、データ抽出、スクレイピング、自動投稿・自動フォローは避ける。

## Monaco Editor の扱い

CSS / JS 編集 UI は Monaco Editor を採用する。個人実験用なので高機能なエディタ体験を優先し、バンドルサイズは許容する。

初期機能:

- CSS / JavaScript の language mode
- ダーク / ライトテーマ連動
- 保存前の dirty 表示
- `Ctrl+S` / `Cmd+S` 保存
- プリセットとの差分リセット
- 手動適用ボタン
- CSS は保存前に空文字と基本構文エラーだけ検出
- JS は保存前に `new Function` で構文エラーだけ検出し、実行安全性までは保証しない

後回し:

- 型定義補完
- UserScript metadata の編集支援
- セレクタ補完
- DOM インスペクタ連携
- ルール履歴 / diff viewer

## 初期プリセット案

### X

- 右カラムのおすすめ / トレンドを非表示
- エンゲージメント数を非表示
- 投稿カードのメディア表示を控えめにする
- 通知バッジや未読を弱める
- リポスト / 引用導線を目立たなくする

## X 保存 HTML 資料の活用

2026-06-30 時点で、SingleFile を使って `/Users/dolphilia/github/sns-browser-html/x/` に X の主要画面を保存した。これらは repo 外のローカル研究資料として扱う。

保存された HTML は、実際のログイン済み X Web UI の DOM、`data-testid`、`aria-label`、`role`、インライン CSS、画像 data URI を含む。SNS Browser Lab の X 向け CSS プリセットを作るうえではかなり有用。ただし、投稿本文、ユーザー名、自分のプロフィール周辺 DOM、画像なども含むため、**repo にコミットしない・共有しない・スクリーンショットを公開しない**運用にする。

### 保存ファイルの概要

| ファイル | 画面 | サイズ | `article` | `data-testid` | `aria-label` | 主な用途 |
|---|---|---:|---:|---:|---:|---|
| `home.html` | ホーム | 32.3MB | 70 | 1428 | 858 | ホームタイムライン、投稿カード、右カラム、通知圧の調整 |
| `compose-post.html` | ポスト作成ダイアログ | 39MB | 70 前後 | 1400 前後 | 800 前後 | 投稿ダイアログ、ホーム上部 composer との差分確認 |
| `explore.html` | 話題を検索 | 39.3MB | 61 | 1010 | 767 | 探索・トレンド・おすすめ導線の非表示検証 |
| `i-bookmarks.html` | ブックマーク | 7.1MB | 18 | 347 | 254 | ブックマーク一覧の投稿カード差分確認 |
| `me.html` | 自分のプロフィール | 17.7MB | 41 | 695 | 489 | プロフィール画面、フォロー数、自己投稿の表示調整 |
| `me-likes.html` | 自分のいいね | 24.6MB | 40 | 720 | 515 | いいね一覧、反応数非表示の検証 |
| `me-followers.html` | フォロワー | 3.5MB | 0 | 818 | 372 | ユーザー一覧、フォローボタン、鍵・認証アイコン調整 |
| `me-following.html` | フォロー中 | 3.6MB | 0 | 714 | 225 | ユーザー一覧、フォロー解除導線の視認性調整 |
| `user.html` | 他ユーザーのプロフィール | 26.2MB | 60 | 1096 | 731 | 他者プロフィール、フォローボタン、投稿カードの差分確認 |

### 確認できた安全性

簡易検索では、以下の文字列は見つからなかった。

- `auth_token`
- `Bearer`
- `x-csrf-token`
- `document.cookie`
- `localStorage`
- `indexedDB`

`ct0` は一部ファイルで検出され得るが、確認した範囲では Cookie 名ではなく base64 などの偶然一致だった。とはいえ、ログイン済み画面由来の保存物であるため、機密資料として扱う。

### 研究に使える DOM 情報

X は class 名が React Native Web 由来で読みにくく、変更にも弱い。一方、保存 HTML には `data-testid` とアクセシビリティ属性が多く残っているため、CSS プリセットでは class 名よりも以下を優先する。

- `data-testid=tweet`
- `data-testid=tweetText`
- `data-testid=reply`
- `data-testid=retweet`
- `data-testid=like`
- `data-testid=bookmark`
- `data-testid=caret`
- `data-testid=User-Name`
- `data-testid=Tweet-User-Avatar`
- `data-testid=UserCell`
- `data-testid=userFollowIndicator`
- `aria-label`
- `role=button`
- `role=link`
- `article`

特に `home.html` では `reply` / `retweet` / `like` / `bookmark` が各 70 件前後あり、投稿カード内アクションのセレクタ検証に向いている。`me-followers.html` と `me-following.html` は `UserCell` が 150 件前後あり、フォロー一覧の密度調整に使いやすい。

### 画面別に作るべき X プリセット

| プリセット | 対象資料 | 内容 |
|---|---|---|
| `x-hide-metrics` | `home.html`, `me.html`, `user.html`, `me-likes.html` | 返信・リポスト・いいね・ブックマーク周辺の数値を隠す |
| `x-calm-home` | `home.html` | 右カラム、Grok、トレンド、過剰なおすすめ導線を弱める |
| `x-calm-explore` | `explore.html` | 探索画面のトレンド・おすすめ・広告的導線を弱める |
| `x-profile-readable` | `me.html`, `user.html` | プロフィール、フォロー数、固定投稿、投稿カードの密度調整 |
| `x-user-list-readable` | `me-followers.html`, `me-following.html` | ユーザー一覧の余白、フォローボタン、鍵・認証アイコンの視認性調整 |
| `x-bookmarks-readable` | `i-bookmarks.html` | ブックマーク画面の投稿カードとメディア表示を調整 |

### 活用手順

1. 保存 HTML をブラウザで開き、DevTools の Elements で対象要素を確認する。
2. `data-testid` / `aria-label` / `role` を優先して CSS セレクタを作る。
3. SNS Browser Lab の Monaco Editor で CSS を試す。
4. 実際の `https://x.com/` 上で同じ CSS が効くか確認する。
5. 効いたものだけ `apps/sns-browser/electron/site-registry.ts` の X プリセットへ移す。
6. 保存 HTML にしか存在しない class 名や一時的な ID には依存しない。

### ローカル資料としての注意

- `/Users/dolphilia/github/sns-browser-html/` は repo 外の研究置き場として維持する。
- HTML は SingleFile 由来の巨大な data URI を含むため、Git 管理しない。
- 投稿本文・ユーザー名・画像・自分のプロフィール情報が含まれるため、外部共有しない。
- HTML から抽出した「セレクタ名」「件数」「画面構造のメモ」は repo に残してよいが、投稿本文や画像は残さない。
- 動的挙動、SPA 遷移、スクロール追加読み込み、ネットワーク通信の研究には不向き。必要なら別途 DevTools の sanitized HAR や手動メモを使う。

### Threads

- おすすめ性の強い導線を弱める
- エンゲージメント数を非表示
- 投稿間の余白と本文幅を調整
- 連続スクロールを抑える休憩表示を実験する

### mixi2

- エンゲージメント数や通知圧を弱める
- コミュニティ / イベント導線を読みやすく整理する
- 画像やカードの密度を調整する
- 招待・登録導線など、実験に不要な領域を控えめにする

## 保存データ

個人実験用のため、保存先は Electron の `userData` 配下に限定する。

```txt
userData/
└── sns-browser/
    ├── settings.json
    ├── sites.json
    ├── rules/
    │   ├── x.json
    │   ├── threads.json
    │   └── mixi2.json
    └── snapshots/
        └── README.md
```

保存するもの:

- サイトごとの有効プリセット
- カスタム CSS / JS
- 表示設定
- 最後に開いていた URL
- 高度モードの有効/無効

保存しないもの:

- SNS の投稿本文の大量キャッシュ
- 画像や動画
- 他者プロフィールの収集データ
- 非公開 API レスポンス
- パスワード

## Chrome 拡張として作る場合

Chrome 拡張は Manifest V3 前提になる。`chrome.scripting` は JS/CSS 注入に使えるが、任意のユーザー作成スクリプトを扱う場合は `chrome.userScripts` を検討する必要がある。`chrome.userScripts` は Chrome 120+ / MV3+ で利用できるが、Chrome 138 以降では拡張ごとの「Allow User Scripts」トグルが必要になる。

拡張方式の利点は、ユーザーが普段のブラウザを使えること。欠点は、Chrome / Firefox / Safari / Edge の差分、Manifest V3 制約、ストア審査、権限説明、MV2 由来の機能低下を抱えること。2025 年 7 月時点で Chrome は Manifest V2 を全ユーザーで無効化しており、MV2 前提の拡張設計は採用できない。

このプロジェクトでは、まず Electron 専用ブラウザでルールと UX を固め、需要が見えたら Chrome / Firefox 拡張へ切り出す順番がよい。

## セキュリティ設計

専用ブラウザは「リモートサイトを表示し、そこへ自分のコードを注入する」アプリなので、通常の API クライアントより攻撃面が広い。

必須方針:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: false` を使わない
- 対象 URL を allowlist で制限する
- `window.open` と外部リンクをアプリ側で制御する
- 通知、カメラ、マイク、位置情報などは原則拒否し、必要なものだけ許可する
- 任意ユーザースクリプトはデフォルト無効。高度モードとして明示的に有効化する
- リモートから自動更新される任意 JS は初期実装では禁止する
- preload からリモートページへ Node / Electron API を直接渡さない
- SNS ごとに session partition を分けるか、少なくとも実験用専用 partition を使う
- パスワードや Cookie をアプリ側の独自ストレージにコピーしない
- DevTools は開発時のみ開ける設定にする

個人実験用であっても、ログイン済み SNS を扱う以上、セキュリティ設定は一般公開アプリと同じ水準で始める。公開しないことは、危険な preload や任意コード実行を許す理由にはしない。

## 規約・運用リスク

この方式は「ユーザー自身のブラウザ表示を調整する」ため、API クライアントより実装可能範囲は広がる。ただし、各 SNS の規約次第では以下が問題になり得る。

- 非公開 API の直接利用
- 大量アクセス
- 自動投稿、自動フォロー、自動いいね
- コンテンツの蓄積・再配布
- 広告や有料機能の回避
- bot / automation と見なされる挙動

したがって、初期方針は **表示調整・操作抑制・ローカル UI 補助に限定**する。SNS 側のデータを大量収集したり、バックグラウンドで巡回したり、投稿操作を自動化したりしない。

## SNS 別の相性

| 対象 | 相性 | 理由 |
|---|---|---|
| X | 中 | 改善余地は大きいが DOM 変更、規約、bot 判定、広告回避扱いのリスクが高い |
| Threads | 中 | Web UI の調整は可能だが Meta 側の変更追従とログイン制約がある |
| mixi2 | 中 | 公開 API がないため Web 表示調整の方が現実的。ただし規約面の慎重さが必要 |
| Bluesky | 中 | API クライアント本体があるため主対象ではない。比較検証には使える |
| Mastodon | 中 | API クライアント化しやすいため主対象ではない。Web UI 調整の練習には向く |
| Misskey | 中 | API もあるが Web UI 独自性が強い。将来の追加候補 |
| Reddit | 中 | リーダー化とスコア非表示に向くが、旧来の第三者クライアント問題と規約面に注意 |

## MVP 案

### 含める

- Electron 専用ブラウザ shell
- 対象サイト allowlist
- X / Threads / mixi2 のプリセット URL
- サイト別 CSS プリセット
- エンゲージメント数非表示
- 通知バッジ・未読カウント・トレンド欄の非表示
- 投稿カード幅、画像サイズ、文字サイズの調整
- SPA URL 変更時の再適用
- ルールのオン/オフ
- Monaco Editor による CSS 編集
- JSON への設定保存

### 後回し

- 任意ユーザースクリプト編集
- Monaco Editor の補完強化
- Tampermonkey / Violentmonkey metadata 完全互換
- UserCSS 完全互換
- ネットワークブロック UI
- 複数タブ
- 拡張機能の読み込み
- 同期機能

### 除外

- 非公開 API の直接利用
- スクレイピング
- 自動投稿 / 自動いいね / 自動フォロー
- 広告・課金・ログイン制限の回避
- Chromium fork
- 一般公開・ストア配布を前提にした機能

## 実装段階

1. `apps/sns-browser/` として Electron shell を分ける。
2. `WebContentsView` で X / Threads / mixi2 のいずれか 1 サイトを表示する。
3. navigation allowlist と permission handler を入れる。
4. CSS プリセットを `insertCSS` で注入する。
5. ルールのオン/オフと永続化を実装する。
6. Monaco Editor で CSS を編集し、保存・手動適用できるようにする。
7. MutationObserver ベースの軽い script runner を入れる。
8. Playwright で対象 SNS のログアウト状態ページ、モック HTML、必要なら手動ログイン済み状態のスクリーンショットを確認する。
9. 任意 JS 編集を入れる前に、セキュリティレビューを行う。

## 推奨判断

現行の「Bluesky API クライアント」とは別の研究ラインとしては価値がある。特に X、Threads、mixi2 のように API クライアント化が難しい SNS では、専用ブラウザ方式の方が現実的な場合がある。

ただし、主力プロダクトとしては API クライアントより不安定。DOM 変更で壊れやすく、SNS 側の規約や bot 判定にも左右される。したがって、最初は「個人実験用に、SNS 公式 Web 版を静かに読むための専用ブラウザ」くらいにスコープを絞るのがよい。

計画書へ落とす場合は、[sns-browser-plan.md](../plans/sns-browser-plan.md) を起点にする。

## 実装メモ: X ホーム左サイドバー CSS プリセット

2026-06-30 時点では、`/Users/dolphilia/github/sns-browser-html/x/home.html` の保存 HTML から、X の左サイドバー項目は `data-testid`、`href`、`aria-label` の組み合わせで比較的安定して識別できると判断した。

`apps/sns-browser/` では、まず土台 CSS で制御対象の項目を非表示にし、項目別の表示ルールを ON にしたものだけ `display: flex !important` で戻す方式を採用した。これにより、UI のチェック状態を「表示 ON/OFF」として扱える。

初期状態は以下にした。

| 項目 | 初期状態 | 主な識別材料 |
|---|---:|---|
| サイトロゴ | ON | `aria-label="X"` / `/home` |
| 話題を検索 | ON | `AppTabBar_Explore_Link` / `/explore` |
| 通知 | OFF | `AppTabBar_Notifications_Link` / `/notifications` / `aria-label^="通知"` |
| チャット | OFF | `AppTabBar_DirectMessage_Link` / `/i/chat` / `chat-drawer-main` |
| Grok | OFF | `/i/grok` / `aria-label="Grok"` / `GrokDrawerHeader` |
| ブックマーク | ON | `/i/bookmarks` / `aria-label="ブックマーク"` |
| クリエイタースタジオ | OFF | `/i/jf/creators/studio` / `aria-label="クリエイタースタジオ"` |
| プレミアム | OFF | `premium-signup-tab` / `/i/premium_sign_up` |
| プロフィール | ON | `AppTabBar_Profile_Link` / `nav a[aria-label="プロフィール"]` |
| もっと見る | ON | `AppTabBar_More_Menu` / `aria-label="その他のメニュー項目"` |
| ポストする | ON | `SideNav_NewTweet_Button` / `/compose/post` |

注意点として、X の DOM は変更されやすいため、`data-testid` だけに依存しない fallback selector を併記する。逆に `aria-label` はロケール依存なので、日本語 UI 前提のプリセットとして扱い、将来英語 UI などを対象にする場合は別プリセット化する。

## 実装メモ: X ホームのタイムライン投稿 CSS プリセット

2026-06-30 時点の `home.html` では、タイムライン投稿は `article[data-testid="tweet"]` を起点にすると、投稿内の主要部品を比較的安全に絞り込める。本文、画像、アバター、ユーザー名、返信、リポスト、いいね、ブックマークは `data-testid` が繰り返し確認できた。

初期状態は以下にした。

| 項目 | 初期状態 | 主な識別材料 |
|---|---:|---|
| アバターアイコン | ON | `Tweet-User-Avatar` |
| ユーザー名 | ON | `User-Name` 内の名前リンク |
| 認証バッジ | ON | `User-Name` 内の `icon-verified` を含むアイコン枠 |
| ユーザーID | OFF | `User-Name` 内の `tabindex="-1"` リンク |
| 投稿日時 | ON | `User-Name` 内の `time` |
| 区切り記号 | OFF | `User-Name` 内の `·` 相当の separator |
| このポストを説明する Grok アイコン | OFF | `aria-label*="Grok"` / `aria-label*="このポストを説明"` |
| もっと見る | ON | `caret` |
| 翻訳表示 | ON | `button[aria-label="原文を表示"]` を含む翻訳表示行 |
| 本文 | ON | `tweetText` / `tweet-text-show-more-link` |
| 画像 | ON | `tweetPhoto` を含む外側メディア枠。ただし動画・カード内メディアは除外 |
| 動画 | ON | `videoPlayer` / `videoComponent` / `videoContainer` を含む外側メディア枠 |
| メディア説明文 | ON | 画像 ALT などの説明文・説明表示ボタン。`altText` / `mediaDescription` 系 testid と `画像の説明` / `Image description` 系 aria-label |
| 画像を編集 | ON | 画像ホバー時に出る `画像を編集` / `Edit image` 系 aria-label のボタン |
| 外部リンクカード | ON | `card.wrapper` |
| カルーセル | ON | `aria-roledescription="carousel"` / `LayoutCardCarousel-slide` |
| 引用・埋め込みポスト | ON | `role="link"` 内の `Tweet-User-Avatar` / `User-Name` |
| 返信 | OFF | `reply` |
| リポスト | OFF | `retweet` |
| いいね | ON | `like` |
| 表示 | OFF | `/analytics` / `aria-label*="ポストアナリティクス"` |
| ブックマーク | ON | `bookmark` |
| 共有 | OFF | `aria-label="ポストを共有"` / `aria-label*="共有"` |

このプリセットも左サイドバーと同じく、内部の土台 CSS で対象をいったん非表示にし、項目別の表示ルールを ON にしたものだけ戻す方式にした。投稿本文やメディアは元の X 側 CSS の display 値が要素ごとに異なるため、表示側は `display: revert !important` を使う。

アバターアイコンは、アイコン本体の `[data-testid="Tweet-User-Avatar"]` だけを非表示にすると、投稿左側のカラム幅が空白として残る。そのため、`タイムライン投稿: アバターアイコン` は `article[data-testid="tweet"] div:has(> [data-testid="Tweet-User-Avatar"])` を対象にし、アバターを直下に持つ親 div、つまり左カラムごと ON/OFF する。保存 HTML では、この親 div が `r-onrtq4` などの幅を持つ投稿左カラムだった。

当初は `タイムライン投稿: 画像・メディア` として画像、動画、カード、カルーセルをまとめていたが、保存 HTML 上で安定して判別できる要素は個別制御へ分割した。現在は `画像`、`動画`、`外部リンクカード`、`カルーセル` をそれぞれ ON/OFF できる。GIF は投稿内で安定した専用 testid が未確認のため、現時点では個別項目にしない。

画像・動画の制御は、子要素の `tweetPhoto` や `videoPlayer` だけを消すと枠や空白が残るため、外側の `aria-labelledby` 付きメディア枠や `max-width` 付きメディア枠を主対象にする。画像側は `videoPlayer` と `card.wrapper` を含む枠を除外し、動画・カード内メディアを巻き込まないようにする。動画側は `videoPlayer` を含む外側枠を消し、動画を OFF にしたときに透明なプレイヤー枠だけが残らないようにする。

メディア説明文は、保存 HTML では画像 ALT の表示状態の実例を十分には確認できなかった。そのため、現時点では `data-testid="altText"` / `mediaDescription` / `tweetPhotoDescription` と、`画像の説明` / `代替テキスト` / `Image description` / `alt text` を含む `aria-label` を候補にする。対象は `article[data-testid="tweet"]` 配下に限定し、通常の投稿本文やメディア本体を巻き込まないようにする。初期状態は ON。

追加で、外部リンクカードの下に出る `lawson.co.jpから` のような出典行と、`がおりんさんと他2人がフォローしています` のようなフォロー文も、`タイムライン投稿: メディア説明文` の OFF で消えるようにした。これらは CSS だけではテキスト条件を安定指定しにくいため、非表示の組み込み script で該当行へ `data-sns-browser-media-description-extra="true"` を付け、既存のメディア説明文 selector に含める。`から` は本文中にも頻出するため、判定は `a[target="_blank"][rel~="nofollow"]` のテキストがドメイン形式 + `から` に一致する場合に限定する。フォロー文も `さんと他N人がフォローしています` の完全に近いパターンだけを対象にする。

画像ホバー時の `画像を編集` は、保存 HTML には常時出ていない可能性が高く、ホバー時に追加表示される操作 UI として扱う。CSS selector ではテキストノードそのものを安定指定できないため、`aria-label="画像を編集"` / `aria-label="Edit image"` と、それらを含む `button` / `role="button"` を対象にする。初期状態は ON。OFF の場合、画像本体は残したまま、ホバー時の編集ボタンだけを非表示にする。

認証バッジは `User-Name` 内で、表示名テキストの後ろにある別の `div[dir="ltr"]` に入っていた。実体は `data-testid="icon-verified"` または `aria-label="認証済みアカウント"` の SVG。企業・所属系アイコンが同じアイコン枠に連なる場合もあるため、SVG 単体ではなく `r-xoduu5 r-18u37iz` を持つアイコン枠ごと対象にする。これにより、ユーザー名のテキストは残しつつ、認証バッジと横並びの追加アイコンを非表示にできる。

ユーザーIDと投稿日時の間に表示される `·` は、ユーザーIDを OFF にしても単独で残ると不自然に見える。そこで `タイムライン投稿: 区切り記号` として独立した表示項目を追加し、初期状態は OFF にした。保存 HTML では `User-Name` 内で、ユーザーIDの親 `div:has(> a[tabindex="-1"])` の次に `aria-hidden="true"` の `div` があり、その中に `·` が入っていた。selector はまずこの兄弟関係を使い、補助的に `User-Name` 内の `aria-hidden="true"` かつ `r-1q142lx r-n7gxbd` class を持つ separator も対象にする。

`home-rt.html` では、`@towa1932` の投稿内に過去ポストを載せた引用カードが確認できた。外側の投稿は通常どおり `article[data-testid="tweet"]` だが、埋め込まれた過去ポスト側は `article` ではなく、外側記事内の `role="link"` を持つ枠付きカードとして出る。このカード内には小さい `Tweet-User-Avatar`、`User-Name`、`tweetText` が含まれる。そこで `タイムライン投稿: 引用・埋め込みポスト` を追加し、`article[data-testid="tweet"] div[role="link"]:has([data-testid="Tweet-User-Avatar"]):has([data-testid="User-Name"])` を主 selector にする。初期状態は ON とし、OFF の場合だけ引用リポストや過去ポストカード全体を非表示にする。

`home-translate.html` では、翻訳された投稿に Grok 系のアイコン、`英語からの翻訳` のような文言、`原文を表示` ボタンが横並びの `div` として出ていた。テキスト内容そのものは CSS selector で安定判定しにくいが、同じ行に `button[aria-label="原文を表示"]` があるため、`タイムライン投稿: 翻訳表示` は `article[data-testid="tweet"] div:has(> button[aria-label="原文を表示"])` を主 selector にする。英語 UI の可能性を考え、`Show original` も fallback に含める。初期状態は ON。

## 調査メモ: X タイムラインの画像・メディア種別判別

2026-06-30 時点の保存 HTML では、タイムライン投稿内のメディアは大きく「通常画像」「動画」「外部カード」「カルーセル」に分けられる。現行の `タイムライン投稿: 画像・メディア` はこれらをまとめて扱っているが、DOM 上の手がかりは分かれているため、プリセット項目を細分化することは可能。

保存 HTML で確認できた主な識別材料は以下。

| 種別 | 主な識別材料 | 判別の見込み |
|---|---|---|
| 通常画像 | `data-testid="tweetPhoto"`、`aria-label="画像"`、画像リンクの `/photo/1` など | 高い。投稿添付画像として比較的安定している |
| 動画 | `data-testid="videoPlayer"`、`data-testid="videoComponent"`、`data-testid="videoContainer"`、`<video aria-label="埋め込み動画">`、`poster=` | 高い。ただし外部カード内動画も同じ video 系 testid を使う |
| 外部カード | `data-testid="card.wrapper"`、`card.layoutLarge.media`、`card.layoutSmall.media`、`card.layoutLarge.detail`、`card.layoutSmall.detail` | 高い。リンクカード単位での ON/OFF に向く |
| カルーセル | `aria-roledescription="carousel"`、`Carousel-slideClickCaptureWrapper-*`、`LayoutCardCarousel-slide`、`Carousel-NavRight` | 中から高。広告カードのカルーセルと通常メディアのカルーセルが混在する |
| カード内画像 | `card.wrapper` 内の `mediaWrapper` / `imageWrapper` / background-image | 中。画像自体は取れるが、カードの枠・詳細部と分けるかは設計判断が必要 |
| GIF | 投稿内で安定した専用 testid は未確認。`gifSearchButton` はポスト作成 UI のボタン | 低い。保存資料だけでは通常動画との差分が不足している |

手元の保存 HTML での出現傾向は、`tweetPhoto` が多く、動画系は `videoPlayer` と `videoComponent` が同数で出ていた。たとえば `home.html` では `tweetPhoto` 58、`videoPlayer` 13、`videoComponent` 13、`card.wrapper` 13、`Carousel-*` 3 が確認できた。`home-rt.html` では `tweetPhoto` 205、`videoPlayer` 13、`videoComponent` 13、`card.wrapper` 44、`Carousel-*` 41 が確認できた。

CSS だけで細分化する場合は、まず以下の粒度が現実的。

| プリセット候補 | selector の方向性 | 備考 |
|---|---|---|
| 画像 | `article[data-testid="tweet"] div[aria-labelledby]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])):not(:has([data-testid="card.wrapper"]))` など | 通常画像の外側枠を狙う |
| 動画 | `article[data-testid="tweet"] div[aria-labelledby]:has([data-testid="videoPlayer"])` / `card.layoutLarge.media:has([data-testid="videoPlayer"])` など | プレイヤー単体ではなく外側枠を消す |
| 外部リンクカード | `article[data-testid="tweet"] [data-testid="card.wrapper"]` | カード全体を消すなら安定しやすい |
| カルーセル | `article[data-testid="tweet"] [aria-roledescription="carousel"]` / `[data-testid^="Carousel-"]` | カルーセル全体の枠を対象にする selector 調整が必要 |

より綺麗に消すことを優先するなら、広告投稿と同じく軽い組み込み script でメディアの外側コンテナへ `data-sns-browser-media-kind="image"` / `video` / `card` / `carousel` のような属性を付け、その属性を CSS ルールで制御する方式が扱いやすい。X の DOM は外側の枠や余白が子要素ではなく親コンテナに乗ることがあるため、単に `tweetPhoto` や `videoPlayer` だけを `display: none` にすると空枠が残る可能性がある。

現時点の結論として、画像・動画・外部カードの判別は可能。GIF の独立判定、カード内画像と通常画像の厳密な分離、動画広告やカード内動画の扱いは、追加の保存 HTML または実ページ上の DOM 観察を増やしてから実装するのがよい。

## 実装メモ: X ホームの右サイドバー CSS プリセット

2026-06-30 時点の `home.html` では、右サイドバー全体は `data-testid="sidebarColumn"` で識別できる。従来の `x-calm-layout` は `sidebarColumn` と `trend` を直接非表示にしていたが、右サイドバーを項目別に制御するため、この責務は `右サイドバー` プリセットへ移す。`x-calm-layout` は主に余白とメディア表示の調整に留める。

初期状態は以下にした。いずれも通常表示を維持するため ON。

| 項目 | 初期状態 | 主な識別材料 |
|---|---:|---|
| 全体 | ON | `data-testid="sidebarColumn"` |
| 検索 | ON | `sidebarColumn` 内の `form[role="search"]` |
| プレミアムにサブスクライブ | ON | `aside[aria-label="プレミアムにサブスクライブ"]` |
| 本日のニュース | ON | `data-testid="news_sidebar"` を含むカード |
| 「いま」を見つけよう | ON | `aria-label="タイムライン: 速報"` を含むカード |
| おすすめユーザー | ON | `aside[aria-label="おすすめユーザー"]` |

このプリセットも内部の土台 CSS で右サイドバー全体と各カードをいったん非表示にし、ON の表示ルールだけ戻す方式にする。全体が OFF の場合は親の `sidebarColumn` が非表示になるため、各項目が ON でも表示されない。全体が ON の場合は、検索、プレミアム、本日のニュース、トレンド、おすすめユーザーを個別に OFF にできる。

## 実装メモ: X ウィンドウ幅を活用する全体レイアウト

`サイト全体: ウィンドウ幅を活用` を追加した。初期状態は OFF。ON にすると、X 標準の中央寄せ・固定幅寄りレイアウトを緩め、左サイドバーを左端へ、右サイドバーが表示されている場合は右端へ寄せ、`primaryColumn` とタイムラインを残り幅いっぱいに広げる。

実装は CSS のみ。`main` 配下の外側コンテナの `max-width` を解除し、`main > div` を `justify-content: space-between` にする。`data-testid="primaryColumn"` は `flex: 1 1 auto`、`max-width: none`、`min-width: 0` にして、内部のタイムライン、`cellInnerDiv`、`article[data-testid="tweet"]` も `width: 100%` に広げる。右サイドバーは表示されている場合だけ `sidebarColumn` を 360px 固定相当にし、右端へ寄せる。

右サイドバー全体を OFF にした場合は、既存の右サイドバー表示制御で `sidebarColumn` 自体が非表示になるため、このレイアウト項目が ON でもメインカラムが残り幅を使う。左サイドバーの各項目表示制御とは独立しており、左ナビ自体の位置だけを左端へ寄せる。

追加調整として、左サイドバー側の `header[role="banner"]` に幅上限を設定した。通常幅では `--sns-browser-left-sidebar-width: 260px`、狭い幅では 88px とし、`main` は flex の残り領域として広げる。これにより、左サイドバーが必要以上に横幅を取り、メインカラムの可変領域を圧迫する状態を避ける。

左サイドバーにも `左サイドバー: 全体` を追加した。対象は `header[role="banner"]`。全体が OFF の場合は親が非表示になるため、サイトロゴや各メニュー項目が ON でも左サイドバーは表示されない。`ウィンドウ幅を活用` は `main` に固定の左マージンを持たせず、左サイドバー自体の幅上限と flex 配置で残り幅を使うため、左サイドバー全体 OFF と併用しやすい。

## 実装メモ: X タイムライン投稿カードグリッド表示の廃止

`タイムライン投稿: カードグリッド` は試験実装したが、期待どおりに動作しなかったため廃止した。保存済み設定に残っていても読み込み時に除外するため、`x-timeline-card-grid-layout` は obsolete rule として扱う。

X のタイムラインは保存 HTML 上でも `cellInnerDiv` が `position: absolute` と `transform: translateY(...)` で仮想スクロール配置されている。CSS Grid に乗せるには、この絶対配置、仮想スクロール用の高さ、spacer 的なセル、追加読み込み時の DOM 差し替えをまとめて上書きする必要がある。しかし、これを CSS だけで行うとスクロール位置、追加読み込み、表示中セルの再利用が崩れやすい。

横方向の領域活用を実現する場合、CSS だけで既存タイムラインをグリッド化するより、以下のどちらかが現実的。

| 方向性 | 内容 | 評価 |
|---|---|---|
| 既存タイムラインを縦方向のまま広げる | `ウィンドウ幅を活用` でメインカラムを広げ、投稿内の本文・メディア・右余白を読みやすく調整する | 安定しやすい。X の仮想スクロールと衝突しにくい |
| 独自オーバーレイ/再レンダリング | DOM から表示中投稿を読み取り、アプリ側の別レイヤーで masonry/grid として再描画する | 横活用はしやすいが、クリック、返信、動画、追加読み込み、アクセシビリティの再実装が必要で重い |

現時点では、横幅活用は「投稿を横に並べる」より「メインカラムを広げたうえで、投稿内のメディア・本文・補助情報を整理する」方向を優先するのが安全。

## 実装メモ: X 限定要素の画像ギャラリービュー

`実験的機能: 画像ギャラリービュー` を追加した。初期状態は OFF。CSS で既存タイムラインを横並びに変形するのではなく、表示中 DOM から画像付き投稿だけを抽出し、別レイヤーのオーバーレイとしてグリッド表示する。

MVP の表示要素は以下に限定する。

| 要素 | 取得元 | 備考 |
|---|---|---|
| アバター | `Tweet-User-Avatar` 内の `img` または background image | 取得できない場合はプレースホルダー |
| ユーザー名 | `User-Name` 内の表示名リンク | 余分な空白は詰める |
| 画像 | `/photo/` リンク内の先頭 `tweetPhoto` | 動画、カード、カルーセルは対象外 |
| いいね | 元投稿の `data-testid="like"` / `data-testid="unlike"` | ギャラリー側のボタンから元 DOM のボタンへクリックを中継 |

この方式では X 側の仮想スクロール配置を直接壊さない。ただし、抽出元は「現在 DOM に存在する投稿」だけなので、X 側でスクロールして DOM が差し替わった場合はギャラリーの更新が必要になる。オーバーレイ内に更新ボタンを置き、表示中 DOM から再抽出できるようにした。

制約として、元投稿 DOM が仮想スクロールで消えると、いいねボタンへの参照も切れる可能性がある。投稿詳細を開く、返信、動画操作、画像ALT、引用カードなどは MVP では扱わない。横方向の領域活用は、この限定ギャラリーを育てる方向が、既存タイムラインを CSS Grid 化するより現実的。

ギャラリー内の画像は常に正方形枠で表示する。画像ボタン側を `aspect-ratio: 1 / 1` と `overflow: hidden` にしつつ、疑似要素の `padding-top: 100%` でも正方形の高さを確保する。内側の画像は正方形枠いっぱいに `position: absolute` で重ね、`width: 100%` / `height: 100%` / `object-fit: cover !important` で中央基準にトリミングする。これは X 本体タイムライン用の `画像を正方形にトリミング` とは独立したギャラリー専用の表示仕様。

ギャラリーは X のページ内に挿入するため、X 側の `article` / `button` / `img` などの既存スタイルの影響を受ける可能性がある。カード同士の重なりを避けるため、ギャラリー内では `box-sizing`、`display: flex`、`position` を明示し、画像は正方形ボタン枠の中で `position: absolute` にしてカード全体の高さ計算を安定させる。

当初は CSS Grid で並べていたが、画像読み込みや X 側スタイルの影響でカード間の縦ギャップが詰まり、少し重なるケースがあった。そのため、ギャラリー本体は `column-width` / `column-gap` の段組み方式へ変更し、各カードに `break-inside: avoid` と `margin-bottom` を持たせる。これにより、masonry 風の見た目を保ちつつ、カードが同じ列内で重なりにくくなる。

## 実装メモ: X ポスト作成エリア CSS プリセット

2026-06-30 時点の `home.html` と `compose-post.html` では、ホーム上部の inline composer と、サイドバーの「ポストする」から開く投稿ダイアログの両方に `tweetTextarea_0`、`toolBar`、`fileInput`、`gifSearchButton`、`grokImgGen`、`createPollButton`、`scheduleOption`、`geoButton`、`contentDisclosureButton` が確認できた。

ポスト作成エリアの selector は、まずホーム上部の inline composer のみに絞る。`home.html` を再確認したところ、ホーム上部 composer はタイムライン投稿と同じ `cellInnerDiv` には入っていなかった。そのため、`primaryColumn` 配下で `tweetTextarea_*` と `toolBar` を両方含み、かつ `article[data-testid="tweet"]` を含まない祖先を composer エリアとして扱う。これにより、textarea だけでなく、アバター、返信権限、ツールバー、ポストボタンを含む作成エリア全体を消せる。

当初は作成エリア内の各ボタン単位で ON/OFF する方針だったが、保存 HTML と実ページで細部 selector の効き方が安定しなかったため廃止した。現在は `ポスト作成: 作成エリア` の 1 項目だけを表示 ON/OFF する。初期状態は ON。

このプリセットも内部の土台 CSS でホーム上部 composer 全体を非表示にし、表示ルールが ON の場合だけ戻す方式にする。投稿ダイアログは対象外にする。

## 実装メモ: X 広告投稿の実験的表示制御

2026-06-30 時点の保存 HTML では、広告投稿も通常投稿と同じく `article[data-testid="tweet"]` として出る。広告であることは投稿内の小さな `span` にある `広告` ラベルで判定できた。`home.html` では `広告` ラベルが複数確認できるが、CSS selector だけではテキスト内容の完全一致判定ができないため、広告投稿の ON/OFF は CSS ではなく組み込み user script 相当の実験的ルールとして実装する。

実装は以下の二段構成にした。

| ルール | 表示 | 役割 |
|---|---:|---|
| `x-experimental-ad-post-visibility-base` | 非表示 | `article[data-testid="tweet"]` 内の `広告` / `Promoted` / `プロモーション` ラベルを検出し、該当 article に `data-sns-browser-ad-post="true"`、外側の `cellInnerDiv` に `data-sns-browser-ad-cell="true"` を付けてセルごと非表示にする |
| `x-experimental-show-ad-posts` | 表示 | 「実験的機能: 広告投稿」として UI に出し、ON の場合は土台スクリプトの監視と非表示スタイルを解除して広告投稿を表示する |

この構成により、既存の「土台ルールで一度隠し、表示ルールが ON の項目だけ戻す」考え方を、テキスト判定が必要な広告投稿にも適用できる。タイムラインは仮想スクロールで DOM が差し替わるため、土台スクリプトは `MutationObserver` で追加投稿も再判定する。

広告の `article` だけを `display: none` にすると、X 側の外側セルに残る区切り線や余白の影響で、広告前後の投稿境界が二重線のように見えることがある。そのため、非表示は `article` 単体ではなく、最寄りの `[data-testid="cellInnerDiv"]` を優先してセル単位で行う。

制約として、本文に `広告` という単語がある通常投稿を誤検出しないよう、`tweetText` 内のラベルは除外している。ただし X 側の広告ラベルの DOM 位置や文言が変わると検出できなくなる可能性があるため、この項目は「実験的機能」グループに置く。一般公開を前提にした安定機能ではなく、個人的な実験用の DOM チューニングとして扱う。

## 実装メモ: X 表示メディア有無による投稿表示制御

`実験的機能: 表示メディアあり投稿` と `実験的機能: 表示メディアなし投稿` を追加した。どちらも初期状態は ON。片方を OFF にすると、現在の CSS 設定込みで表示中メディアがある投稿、または表示中メディアがない投稿をセル単位で非表示にできる。

この機能の「表示メディア」は、投稿内に DOM として存在するメディアではなく、画像・動画・外部リンクカード・カルーセルなどの候補のうち `display: none` などで消えておらず、`getClientRects()` を持つものとして判定する。たとえば `タイムライン投稿: 画像` を OFF にして画像が消えている場合、その画像だけの投稿は `表示メディアなし投稿` として扱われる。

実装は、非表示用 CSS と判定用 script の組み合わせにした。判定 script は `article[data-testid="tweet"]` ごとに表示中メディア候補を調べ、外側の `[data-testid="cellInnerDiv"]` に `data-sns-browser-visible-media-cell="has"` または `none` を付ける。CSS 側はいったん `has` / `none` の両方を非表示にし、ON の表示ルールだけ `display: revert !important` で戻す。

再判定時には、前回付けた `data-sns-browser-visible-media-cell` を一度外してから可視判定する。これにより、この機能自身が前回非表示にした投稿を「表示メディアなし」と誤判定し続けることを避ける。タイムラインは仮想スクロールで DOM が差し替わるため、`MutationObserver` で追加・変更に追従する。

## 実装メモ: X リポスト由来投稿の表示制御

`実験的機能: リポスト投稿` を追加した。初期状態は ON。OFF にすると、タイムライン内で他ユーザーのリポストとして流れてくる投稿をセル単位で非表示にする。

既存の `タイムライン投稿: リポスト` は投稿下部のリポスト操作ボタンを制御する項目であり、この機能とは対象が異なる。この機能は `home-translate.html` で確認できた `data-testid="socialContext"` 内の「さんがリポスト」表示を使い、投稿上部の social context が `リポスト` / `Reposted` / `Retweeted` を含む場合に、外側の `[data-testid="cellInnerDiv"]` へ `data-sns-browser-reposted-cell="true"` を付ける。

CSS selector だけではテキスト内容を条件にできないため、広告投稿や表示メディア有無と同じく、非表示用 CSS と判定用 script の組み合わせにした。土台 CSS は検出済みセルをいったん非表示にし、表示ルールが ON の場合だけ `display: revert !important` で戻す。

本文中の「リポスト」という単語や投稿下部の操作ボタンで誤判定しないよう、判定対象は `article[data-testid="tweet"]` 配下の `data-testid="socialContext"` に限定する。ただし、X 側の social context の `data-testid` や文言が変わると検出できなくなる可能性があるため、この項目も一般公開向けの安定機能ではなく、個人的な実験用の DOM チューニングとして扱う。

## 実装メモ: X 複数メディア投稿の先頭表示制御

`実験的機能: 表示メディアは1つ目だけ` を追加した。初期状態は OFF。ON にすると、1つの投稿に複数のメディア候補がある場合、CSS 設定を適用した後に実際に表示されている先頭メディアだけを残し、2つ目以降に `data-sns-browser-extra-media="true"` を付けて非表示にする。

この機能の重要な解釈は、「DOM 上の1つ目」ではなく「現在の CSS 制御込みで表示されている1つ目」を残すこと。たとえば、投稿内の1つ目が動画で、`タイムライン投稿: 動画` を OFF にしている場合、その動画は候補から外れ、次に表示されている画像やカードが先頭扱いになる。

候補として扱うのは以下。

| 種別 | 候補 selector の方向性 |
|---|---|
| 画像 | `a[href*="/photo/"]:has([data-testid="tweetPhoto"])` を起点に、複数画像グリッドの外側セルへ正規化 |
| 動画 | `videoContainer` / `videoPlayer` を起点に、複数メディアグリッドの外側セルまたは外側動画枠へ正規化 |
| 外部リンクカード | `card.wrapper` |
| カルーセル | `role="group"` かつ `aria-roledescription="carousel"` |

実装は組み込み script で行う。処理時には、この機能自身が付けた非表示 style を一時的に無効化してから `getClientRects()` を確認する。これにより、前回の処理で隠した2つ目以降のメディアも再計算対象に戻しつつ、通常の画像・動画・カード表示設定で消えている要素は「表示されていない」ものとして扱える。

一度、画像リンクの `<a href="/photo/...">` そのものを2つ目以降の非表示対象にしたが、X の複数画像グリッドではリンクの外側に枠・余白を持つセルがあり、リンクだけを `display: none` しても空白や枠が残る。そのため、`r-1iusvr4` と `r-bnwqim` を持つ外側セルを優先して隠すようにした。動画も同じく、プレイヤー本体ではなくメディア枠側へ正規化してから非表示にする。

DOM 変更や仮想スクロールで投稿が差し替わるため、`MutationObserver` で再適用する。不要になった属性は cleanup で取り除く。

## 実装メモ: X 画像の正方形トリミング表示

`実験的機能: 画像を正方形にトリミング` を追加した。初期状態は OFF。ON にすると、タイムライン内の通常画像を 1:1 の正方形エリアとして表示し、はみ出す部分は中央基準でトリミングする。

対象は `article[data-testid="tweet"]` 配下の `/photo/` リンクで、内側に `data-testid="tweetPhoto"` を持ち、動画プレイヤーを含まないものに限定する。X の保存 HTML では通常画像の高さは画像リンク内の比率用 `padding-bottom` で作られていたため、この値を `100%` に寄せ、内側の画像や background image を `object-fit: cover` / `background-size: cover` 相当にする。

動画はプレイヤー枠、サムネイル、操作 UI、外部カード内動画が混在し、単純に正方形化すると操作ボタンや余白が崩れやすいため対象外にした。複数画像の場合は各画像セルが正方形になる。複数メディアを1枚だけ見たい場合は、既存の `実験的機能: 表示メディアは1つ目だけ` と併用する。

併用時の不具合として、4枚画像グリッドで2枚目以降を `display: none` しても、X 側のグリッド親や行構造が残り、残した1枚が上半分だけに描画されることがあった。これを避けるため、`表示メディアは1つ目だけ` は隠す対象だけでなく、残す1枚に `data-sns-browser-kept-media="true"`、複数メディアの共通親に `data-sns-browser-single-media-container="true"` を付けるようにした。さらに、残す1枚までの中間親に `data-sns-browser-single-media-path="true"` を付け、正方形トリミング CSS が外側の `aria-labelledby` 付きメディア枠、中間の行・列コンテナ、残した画像セルのすべてをフル幅・1:1 に寄せられるようにした。

`実験的機能: 画像を小さな正方形で表示` も追加した。初期状態は OFF。ON にすると、タイムライン内の通常画像を `--sns-browser-small-square-media-size: 96px` の小さな正方形として表示する。Firefox 上でユーザースクリプトを検証した結果、X の通常画像では `aria-labelledby` を持つメディア枠から `div > div > div > div` と、その子の `div > div > div > div > div` に同じ `width` / `height` を当てると、画像枠が小さな正方形として安定しやすいことが分かったため、この階層を明示的に対象にする。

複数メディアを1枚表示にした場合は、`data-sns-browser-single-media-container="true"` を持つ div の親と祖父母に相当する `div:has(> [data-sns-browser-single-media-container="true"])` / `div:has(> div > [data-sns-browser-single-media-container="true"])` にも同じ正方形サイズを当てる。これにより、単に画像リンクだけを縮めて外側のメディア枠や余白が残る状態を避ける。`画像を正方形にトリミング` と同時に ON にした場合は、後に定義される `画像を小さな正方形で表示` の 96px 指定が優先される。

小さな正方形のサイズは `x-experimental-small-square-image-size` という hidden CSS ルールへ分離した。内容は `:root { --sns-browser-small-square-media-size: Npx; }` だけで、UI の `正方形画像サイズ` 数値入力から 24px から 640px の範囲で変更できる。サイズルールは小さな正方形表示本体より前に適用し、本体側は CSS 変数を参照する。これにより、本体 selector はデフォルト更新へ追従しつつ、ユーザーが指定したサイズだけを保存できる。

`実験的機能: 小さな正方形画像を中央揃え` も追加した。初期状態は OFF。ON にすると、小さな正方形サイズを指定している同じ div 群へ `margin: 0 auto !important` を追加する。小さな正方形表示そのものとは分離しているため、左寄せの小型画像と中央揃えの小型画像を切り替えて検証できる。

中央揃えが効かないケースを調査したところ、小さな正方形表示の本体 CSS が内側の 4 段目・5 段目だけでなく、起点の `div[aria-labelledby]` 自体も小さな幅にしていた。そのため、内側 div だけに `margin: 0 auto` を指定しても、外側の起点 div が左側に残り、見た目が中央へ移動しなかった。修正後は起点の `div[aria-labelledby]` も中央揃え対象に含め、X 側の flex 配置に対して `align-self: center !important` も併用する。

調査で、小さな正方形表示が効かない原因の1つは、`div:has(a[href*="/photo/"]:has([data-testid="tweetPhoto"]))` のように `:has()` を入れ子にしていたことだった。Chrome の CSS selector では nested `:has()` は無効になりやすいため、`div:has(a[href*="/photo/"] [data-testid="tweetPhoto"])` のように子孫条件へ置き換えた。大きい正方形トリミング側にも同じ nested `:has()` があったため、同時に修正した。その後の Firefox 検証で、サイズ指定を当てるべき通常画像の階層は `aria-labelledby` 起点の 4 段目・5 段目であることが確認できたため、実装もこの2つの div に合わせた。

## 実装メモ: X 翻訳投稿の原文優先表示

`実験的機能: 翻訳投稿は原文を表示` を追加した。初期状態は OFF。ON にすると、タイムライン内の `button[aria-label="原文を表示"]` または `button[aria-label="Show original"]` を監視し、表示されたボタンを自動クリックする。

これは CSS ではなく操作自動化に近い実験的 script として扱う。OFF にした場合、監視と追加クリックは止まるが、すでに X 側で原文表示へ切り替わった投稿を自動で翻訳表示へ戻すことはしない。戻すには X 側の UI 操作または再読み込みが必要になる可能性がある。

この機能は翻訳表示行の ON/OFF とは独立している。`タイムライン投稿: 翻訳表示` を OFF にすると翻訳表示行そのものが非表示になるため、原文優先 script が押す対象も見えなくなる。原文優先を使う場合は、翻訳表示行は ON のままにしておくのが自然。

## 実装メモ: 外部拡張向け書き出し

アプリの表示設定を Chrome の通常ページ上でも検証しやすくするため、`表示設定` パネルに `書き出し` タブを追加した。対象は、現在アプリ内で有効になっているルール。Stylus 向けには CSS のみ、OrangeMonkey / Tampermonkey / Violentmonkey 向けには CSS 注入と script ルール実行をまとめた UserScript を出力する。

Stylus 用 CSS は、有効な CSS ルールを現在のルール順で結合し、`@-moz-document domain(...)` で対象 SNS のドメインへ閉じ込める。X の場合は `x.com` と `twitter.com` を対象にする。アプリ内のプリセットは「土台 CSS で一度非表示にし、ON の項目だけ戻す」構造が多いため、OFF の項目を再現するには hidden な土台ルールも含めた順序付き CSS として書き出す必要がある。

UserScript 用出力は、同じ CSS を `GM_addStyle` で注入し、さらに有効な script ルールを順番に実行する。`GM_addStyle` がない環境では `<style>` を直接挿入する fallback を持たせる。script ルールはアプリ内の Electron 注入と完全に同じ実行環境ではないため、CSP、拡張の sandbox、実行タイミング、対象 DOM の差分によって挙動が変わる可能性がある。この書き出しは一般配布用ではなく、Chrome DevTools で selector や DOM 変化を検証し、アプリ側のプリセットを精錬するための実験用と位置付ける。

## 実装メモ: 詳細 CSS の適用経路

詳細 CSS の Monaco Editor でルール本文を変更しても、当初は `適用` しても表示が変わらなかった。原因は、renderer 側の編集中 `rules` state は更新されていたが、`適用` ボタンが Electron 側へ現在のルールを渡しておらず、`ViewManager.applyRules()` が `loadRules(activeSiteId)` で保存済み JSON を読み直していたこと。つまり、保存前の詳細 CSS は `適用` 対象になっていなかった。

修正後は、`window.snsBrowser.applyRules(rules)` で現在の編集中ルール配列を main process へ渡し、`ViewManager.applyRules(rules?)` が渡されたルールを優先して `RuleRunner` に適用する。これにより、詳細 CSS は保存しなくても `適用` で即時確認できる。ページ遷移や再読み込み時は保存済みルールを読み直すため、検証結果を残したい場合は従来どおり `保存` が必要。

その後、詳細 CSS タブの役割を「既存プリセット CSS の本文編集」から「カスタム CSS 入力」へ変更した。各サイトに `x-custom-css` / `threads-custom-css` / `mixi2-custom-css` の hidden ルールを追加し、Monaco Editor はこのカスタム CSS だけを編集する。カスタム CSS はプリセット群の後に適用されるため、検証中の selector や一時的な上書きを追加しやすい。既存プリセットの本文は UI から直接編集しない。

保存処理では、通常の hidden ルールはデフォルト本文へ戻すが、カスタム CSS ルールだけは例外として保存済み本文を保持する。これにより、アプリ内部の判定 script や土台 CSS は更新時に最新のデフォルトへ追従しつつ、ユーザーが書いたカスタム CSS は失われない。

## 実装メモ: X フォロー中ページの表示制御

`me-following.html` では、フォロー中一覧の各ユーザー行は `button[data-testid="UserCell"]` として保存されていた。外側には `data-testid="cellInnerDiv"` があり、仮想スクロールで差し替わるリストセル単位の制御はこの外側を使うのが扱いやすい。

表示項目として、`フォロー中ページ: アバターアイコン`、`ユーザー名`、`認証マーク`、`ユーザーID`、`フォローされています`、`Grokによる翻訳`、`プロフィール本文` を追加した。初期状態はいずれも ON。アバターは `data-testid^="UserAvatar-Container-"` を対象にし、アイコン本体だけでなく左カラムごと消えるようにする。認証マークは `icon-verified` と `認証済みアカウント` / `Verified account` 系の aria-label、および同じアイコン枠を対象にする。

`フォローされています` は `data-testid="userFollowIndicator"` が確認できるため CSS だけで扱える。追加機能の `フォロー中ページ: フォローされていますを目立たせる` は初期 OFF とし、ON にするとこの表示を青いラベル風に強調する。

`ユーザー名`、`ユーザーID`、`Grokによる翻訳`、プロフィール本文は、CSS の構造 selector だけだと X 側の入れ子や翻訳表示の有無で消え残りや相互干渉が起きやすい。そのため、hidden の組み込み script `x-following-page-marker` で `data-sns-browser-following-display-name="true"`、`data-sns-browser-following-user-id="true"`、`data-sns-browser-following-grok-translation="true"`、`data-sns-browser-following-bio="true"` を付ける。script は `UserCell` 内のアバターコンテナから、アバター列ではない隣の本文カラムまで親方向にたどり、フォローボタンを含むヘッダー行より後ろの直接子をプロフィール本文候補として扱う。`Grokによる翻訳` / `Translated by Grok` は本文から除外し、別マーカーにする。

実験的機能として `実験的機能: 片思いのみ表示` を追加した。初期状態は OFF。`x-following-page-marker` が `UserCell` 内の `userFollowIndicator` を見て、外側の `cellInnerDiv` に `data-sns-browser-followed-back="true"` または `false` を付ける。片思いのみ表示を ON にすると、`true` のセル、つまり「フォローされています」が付いた相互フォロー候補をセルごと非表示にする。これはフォロー操作の自動化ではなく、表示フィルタに限定する。

`me-followers.html` でも各行は同じく `button[data-testid="UserCell"]` だった。フォロワーページでは、自分が相手をまだフォローしていない場合に `data-testid$="-follow"` のボタンと `aria-label="フォローバック @..."` が出る。一方、自分がすでにフォローしている場合は `data-testid$="-unfollow"` と `aria-label="フォロー中 @..."` が出る。そこで同じ marker script で外側の `cellInnerDiv` に `data-sns-browser-own-following="true"` / `false` / `unknown` を付ける。

実験的機能として `実験的機能: フォロワーは未フォローのみ表示` を追加した。初期状態は OFF。ON にすると、`data-sns-browser-own-following="false"` のセルだけを残し、フォロー中または判定不能のフォロワー行は非表示にする。判定不能を残すと「未フォローのみ」の表示として混ざりやすいため、この機能では保守的に隠す。

## 調査メモ: 埋め込みブラウザと Electron 側でできること・できないこと

2026-06-30 時点の `apps/sns-browser` は、React で作ったアプリ UI と、SNS 公式 Web 版を表示する `WebContentsView` を分けている。アプリ UI は `BrowserWindow` の renderer、SNS 表示領域は別の `WebContentsView` であり、同じ DOM ツリーではない。そのため、React コンポーネントから SNS ページの DOM を直接 `document.querySelector()` することはできない。実際の経路は、`src/App.tsx` から `window.snsBrowser` を呼び、`electron/preload/app-preload.ts` の `contextBridge` を経由し、`ipcMain.handle(...)` で main process に渡し、`ViewManager` が埋め込み `webContents` を操作する形になる。

現在の実装で既に行っている通信と制御は以下。

| 経路 | 現在の用途 | 実装箇所 |
|---|---|---|
| UI renderer -> preload -> main | サイト一覧、設定、ルール、ブラウザ操作の IPC | `app-preload.ts`, `main.ts` |
| main -> UI renderer | URL、戻る/進む可否、読み込み状態の通知 | `ViewManager.emitState()`, `browser:stateChanged` |
| main -> embedded webContents | `loadURL`, `goBack`, `goForward`, `reload`, `setBounds` | `ViewManager` |
| main -> embedded webContents | CSS 注入、CSS 解除 | `RuleRunner.insertCSS()`, `removeInsertedCSS()` |
| main -> embedded webContents | JS 実行、cleanup 実行 | `RuleRunner.executeJavaScript()` |
| embedded webContents -> main | ナビゲーション、読み込み開始/終了などのイベント | `did-navigate`, `did-navigate-in-page`, `did-start-loading`, `did-stop-loading` |

Electron の `webContents` は、公式ドキュメント上も「Web ページを描画・制御する」ための API とされている。`insertCSS()` は現在ページに CSS を注入し、返された key で後から削除できる。`executeJavaScript()` はページ内で JS を評価し、Promise として結果を返せる。つまり、現在の `RuleRunner` の設計は Electron の標準機能に沿っている。

### できること

**CSS による表示調整**

`insertCSS()` で、公式 Web 版の DOM に対してユーザー CSS を当てられる。表示/非表示、余白、幅、高さ、色、フォント、`display`、`visibility`、`position`、`object-fit` などの調整に向く。Stylus へ書き出しやすいのもこの層。

向いている例:

- サイドバー、右カラム、投稿内ボタンの表示/非表示
- 画像サイズ、角丸、余白、カラム幅の調整
- 認証バッジ、補助テキスト、区切り記号の非表示
- 既に `data-testid` や aria-label で安定している要素の制御

**JS による DOM 判定とマーキング**

CSS だけでは、テキスト内容、複数条件、表示中かどうか、親子関係の正規化を扱いにくい。`executeJavaScript()` でページ内 script を実行すれば、`MutationObserver`、`closest()`、`getClientRects()`、`textContent` 判定などを使い、該当要素へ `data-sns-browser-*` 属性を付けられる。現在の広告判定、表示メディア有無、リポスト判定、フォロー中/フォロワー判定はこの層。

向いている例:

- 「フォローされています」の有無でユーザー行を分類する
- `フォローバック` / `フォロー中` ボタンから未フォロー状態を分類する
- 画像/動画/カードのうち、実際に表示中の先頭メディアだけ残す
- テキストに `Grokによる翻訳` がある行だけを消す
- DOM 差し替えに追従して再マーキングする

**ページから情報を読み取って main/UI に返す**

今は継続的な抽出 UI は未実装だが、技術的には `executeJavaScript()` の戻り値で JSON 化できる情報を main へ返せる。たとえば表示中の `UserCell` 数、未フォロー候補数、画像付き投稿数、現在のスクロール位置、選択した投稿のテキスト断片などは返せる。ただし、これは公式 API ではなく DOM 観察なので、保存や外部利用を広げるとスクレイピングに近づく。個人実験・表示調整のための一時分析に留めるのがよい。

**埋め込みブラウザのナビゲーション管理**

`webContents.loadURL()`、`goBack()`、`goForward()`、`reload()`、`getURL()`、`canGoBack()`、`canGoForward()` などを main 側から使える。現在もツールバーと状態表示に使っている。`will-navigate` や `setWindowOpenHandler` で許可外 URL を外部ブラウザへ逃がすこともできる。

**セッション、権限、外部リンクの制御**

`session.fromPartition("persist:sns-browser-lab")` により、SNS ログイン状態はアプリ専用 partition に残る。`permission-policy.ts` では通知だけを許可し、その他の権限は拒否している。外部リンクは `shell.openExternal()` に渡しているが、これは信頼できない URL に対しては危険になり得るため、現在のように `http:` / `https:` に限定し、許可 origin 内の通常遷移と外部オープンを分ける設計が妥当。

**実装すれば可能な双方向通知**

現在の埋め込み `WebContentsView` には専用 preload がないため、SNS ページ側から main へ直接 IPC を送る経路はない。必要なら `WebContentsView` の `webPreferences.preload` を追加し、限定 API を `contextBridge` で公開することで、ページ側 script から main へイベントを送れる。ただし、これはリモートコンテンツに Electron 側の能力を近づけるため、公開する API は最小にする必要がある。

候補:

- `reportDomSummary(summary)` のような読み取り専用イベント
- `notifyRuleMarkerStats(stats)` のような件数通知
- `requestOpenExternal(url)` のような厳格検証付き外部オープン

避けるべきもの:

- 任意 IPC チャンネルを呼べる API
- 任意ファイル読み書き
- 任意コマンド実行
- ルール外の URL を自由に開く API
- 認証情報や Cookie を返す API

### できないこと・安定しないこと

**React UI から埋め込みページ DOM を直接触ること**

`WebContentsView` は別 WebContents なので、React 側の `document` はアプリ UI の DOM だけを指す。SNS ページの DOM 操作は main 経由で `executeJavaScript()` するか、埋め込み側 preload を追加して行う。

**公式 API のような安定データ取得**

DOM は X / Threads / mixi2 側の実装都合で変わる。`data-testid`、aria-label、DOM 階層、テキスト、仮想スクロールの構造は変更され得る。現在の実装は「表示調整には十分だが、正確なデータ基盤ではない」と考えるべき。

不安定になりやすいもの:

- CSS class 名に依存する selector
- 深い `div > div > div` 階層
- 翻訳文や UI 文言など言語設定に依存する判定
- hover 時だけ出るボタン
- 仮想スクロールで DOM から消える要素
- A/B テストで構造が変わる領域

**ページの CSP やサービス側挙動を完全に支配すること**

Electron の `executeJavaScript()` は強力だが、ページのアプリケーション状態、React 内部状態、ネットワークレスポンス、CSP、Service Worker、仮想DOM再描画と常に整合するわけではない。DOM へ直接属性や style を付けても、公式 Web アプリの再描画で消えることがある。そのため `MutationObserver` による再適用が必要になる。

**ユーザーの意図しない自動操作を安全に扱うこと**

JS でクリック、入力、スクロール、ボタン押下は可能。ただし、自動フォロー、自動いいね、自動投稿、自動DM、自動ブックマークなどはサービス規約・アカウント安全性・倫理面のリスクが高い。このプロジェクトでは「見やすくする」「表示を絞る」「ユーザーが自分で判断しやすくする」範囲に留め、自動的な関係操作や投稿操作は避ける。

### 非推奨・禁止に近い設計

**リモートコンテンツに Node.js / Electron API を渡す**

Electron Security checklist では、リモートコンテンツで Node.js integration を有効にしない、context isolation を有効にする、sandbox を有効にする、権限要求を処理する、webSecurity を無効にしない、ナビゲーションと新規ウィンドウを制限する、IPC sender を検証する、といった方針が推奨されている。現在の埋め込み `WebContentsView` は `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`、`webSecurity: true` なので、この方向性に合っている。

非推奨:

- `nodeIntegration: true` を SNS ページに付ける
- `contextIsolation: false` にする
- `sandbox: false` にする
- `webSecurity: false` にする
- 任意の IPC をページへ公開する
- `ipcRenderer` そのものを `contextBridge` で渡す
- SNS ページからローカルファイルや OS 機能へ直接触れる API を公開する

**非公開 API や Cookie を使ったクライアント化**

このブラウザ方式は、公式 Web 版をユーザーが開き、その表示をローカルに調整する設計に価値がある。Cookie、localStorage、内部 API、GraphQL エンドポイントなどを抜き出して独自クライアント化すると、表示調整の範囲を超え、規約・保守・アカウント安全性の問題が大きくなる。調査目的でも、ネットワーク内容の保存や再利用は慎重に扱う。

**大量データ抽出・保存**

`executeJavaScript()` で表示中 DOM のテキストやリンクを抽出することはできる。しかし、スクロールしながら大量に保存する、ユーザー一覧を蓄積する、投稿本文をデータセット化する、といった用途はスクレイピングに近い。このプロジェクトでは、CSS/JS プリセット作成のための局所的なDOM観察、件数確認、セレクタ検証に限定するのがよい。

### 実装方針の整理

今後の機能は、危険度と安定性で層を分ける。

| 層 | 用途 | 推奨度 |
|---|---|---|
| CSS ルール | 見た目、表示/非表示、サイズ調整 | 高 |
| JS マーカー | CSS だけで判定できない DOM 分類 | 高 |
| JS 読み取り | 表示中 DOM の件数・状態を UI に返す | 中。個人実験と短期分析に限定 |
| JS 操作 | 原文表示ボタンなど表示状態の補助操作 | 低から中。明示的な実験機能に限定 |
| 自動関係操作 | フォロー、いいね、投稿、DM | 非推奨 |
| 非公開 API 利用 | Web 内部 API の直接利用 | 非推奨 |
| Node/Electron API 露出 | SNS ページからローカル機能を呼ぶ | 原則不可 |

現在の最も安全な基本形は、`main` が CSS と限定 script を注入し、script は DOM に `data-sns-browser-*` を付けるだけ、実際の表示制御は CSS が行う、という形。この形なら Stylus / UserScript への書き出しとも相性が良く、Electron 固有の危険な権限を SNS ページへ渡さずに済む。

今後、分析 UI を増やす場合は、`executeJavaScript()` の戻り値でその場の集計だけを返す方式から始めるのがよい。継続的なイベント通知が必要になった段階で、埋め込み `WebContentsView` 用の専用 preload を追加する。ただし、その preload は読み取り専用・チャンネル固定・引数検証ありにし、任意 IPC や Node API は公開しない。

## 参考ソース

- Electron `webContents`: https://www.electronjs.org/docs/latest/api/web-contents
- Electron `WebContentsView`: https://www.electronjs.org/docs/latest/api/web-contents-view
- Electron `session`: https://www.electronjs.org/docs/latest/api/session
- Electron `webRequest`: https://www.electronjs.org/docs/latest/api/web-request
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Chrome `chrome.scripting`: https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome `chrome.userScripts`: https://developer.chrome.com/docs/extensions/reference/api/userScripts
- Chrome Manifest V2 support timeline: https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline
- Chrome `declarativeNetRequest`: https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest
- Violentmonkey metadata block: https://violentmonkey.github.io/api/metadata-block/
- Tampermonkey documentation: https://www.tampermonkey.net/documentation.php
- Stylus repository: https://github.com/openstyles/stylus
