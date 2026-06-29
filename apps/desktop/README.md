# SNS Client Desktop

Electron + React + Vite による Bluesky 向けデスクトップ SNS クライアントです。

このアプリは `prototype-05` を現行アプリとして昇格したものです。以後のデスクトップアプリ本体の作業対象は `apps/desktop/` とします。

## 方針

- ストレスを減らすデスクトップ SNS クライアントを基本コンセプトにする
- 通常の SNS に近い無限フィード体験に寄せる
- 新着投稿は自動で差し込まず、更新はユーザー操作に委ねる
- 過去投稿はスクロールで遡れるようにする
- エンゲージメント数や表示要素は設定で抑制できるようにする
- AI / LLM 吟味、号モデル、時間帯背景は使わない

## コマンド

`apps/desktop/` で実行します。

```bash
npm run dev
npm run electron:dev
npm run build
npm run routes:gen
```

## 保存場所

Electron 実行時は、通常のローカルデータを Electron の `userData/local-store/` に保存します。

- `bsky-settings.json`
- `bsky-bookmarks.json`
- `bsky-unfollowed-actors.json`

認証セッションは `safeStorage` で暗号化し、`userData/secure-store/bsky-session.json` に保存します。

ブラウザで `npm run dev` する場合は、Electron の保存 API が使えないため localStorage にフォールバックします。
