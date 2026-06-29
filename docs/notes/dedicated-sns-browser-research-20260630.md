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
| ユーザーID | OFF | `User-Name` 内の `tabindex="-1"` リンク |
| 投稿日時 | ON | `User-Name` 内の `time` |
| このポストを説明する Grok アイコン | OFF | `aria-label*="Grok"` / `aria-label*="このポストを説明"` |
| もっと見る | ON | `caret` |
| 本文 | ON | `tweetText` / `tweet-text-show-more-link` |
| 画像・メディア | ON | `tweetPhoto` / `videoPlayer` / `videoComponent` / `card.*` / `Carousel-*` |
| 返信 | OFF | `reply` |
| リポスト | OFF | `retweet` |
| いいね | ON | `like` |
| 表示 | OFF | `/analytics` / `aria-label*="ポストアナリティクス"` |
| ブックマーク | ON | `bookmark` |
| 共有 | OFF | `aria-label="ポストを共有"` / `aria-label*="共有"` |

このプリセットも左サイドバーと同じく、内部の土台 CSS で対象をいったん非表示にし、項目別の表示ルールを ON にしたものだけ戻す方式にした。投稿本文やメディアは元の X 側 CSS の display 値が要素ごとに異なるため、表示側は `display: revert !important` を使う。

## 実装メモ: X ポスト作成エリア CSS プリセット

2026-06-30 時点の `home.html` と `compose-post.html` では、ホーム上部の inline composer と、サイドバーの「ポストする」から開く投稿ダイアログの両方に `tweetTextarea_0`、`toolBar`、`fileInput`、`gifSearchButton`、`grokImgGen`、`createPollButton`、`scheduleOption`、`geoButton`、`contentDisclosureButton` が確認できた。

ポスト作成エリアの selector は、まずホーム上部の inline composer のみに絞る。タイムライン投稿側のボタンやアバターに波及しないよう、`primaryColumn` 内で `tweetTextarea_*` を含む `cellInnerDiv` を起点にする。投稿ダイアログ側は DOM 差分が大きいため、別途検証してから対象に戻す。

当初は作成エリア内の各ボタン単位で ON/OFF する方針だったが、保存 HTML と実ページで細部 selector の効き方が安定しなかったため廃止した。現在は `ポスト作成: 作成エリア` の 1 項目だけを表示 ON/OFF する。初期状態は ON。

このプリセットも内部の土台 CSS でホーム上部 composer 全体を非表示にし、表示ルールが ON の場合だけ戻す方式にする。投稿ダイアログは対象外にする。

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
