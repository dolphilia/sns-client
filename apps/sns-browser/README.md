# SNS Browser Lab

X / Threads / mixi2 など、API クライアント化が難しい SNS の公式 Web 版を表示し、CSS ルールで読みやすさを調整する個人実験用 Electron アプリです。

一般公開やストア配布は目的にしていません。非公開 API の直接利用、スクレイピング、自動投稿、自動いいね、自動フォローは実装対象外です。

## 方針

- 公式 Web 版を表示し、CSS / 限定 script で見た目を調整する
- 自動投稿、自動いいね、自動フォローなどの自動操作は作らない
- 非公開 API を直接呼ばない
- 投稿本文や Cookie をアプリ独自 JSON に大量保存しない
- 一般公開やストア配布ではなく、個人実験用として扱う

## Commands

```bash
npm run dev
npm run electron:dev
npm run build
```

## Current Scope

- X / Threads / mixi2 のサイト切り替え
- `WebContentsView` による公式 Web 版表示
- navigation allowlist
- permission policy
- CSS プリセットの注入
- 一部の組み込み script による DOM マーカー付け
- ルールのオン / オフ、数値調整、カスタム CSS
- `userData/sns-browser/` 配下への JSON 保存

## 実装上の境界

React 側の UI と SNS ページは同じ DOM ではありません。React renderer は `window.snsBrowser` IPC API を呼び、Electron main process の `ViewManager` が `WebContentsView` を操作します。

SNS ページ側には Node / Electron API を渡しません。CSS 注入と限定 script 実行は main process 経由で行います。

## Notes

ログイン済み SNS ページを扱うため、Cookie やセッションは Electron/Chromium の session 管理に任せます。アプリ独自の JSON にはパスワード、Cookie、投稿本文の大量キャッシュを保存しません。
