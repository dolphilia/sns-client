# SNS Browser Lab

X / Threads / mixi2 など、API クライアント化が難しい SNS の公式 Web 版を表示し、CSS ルールで読みやすさを調整する個人実験用 Electron アプリです。

一般公開やストア配布は目的にしていません。非公開 API の直接利用、スクレイピング、自動投稿、自動いいね、自動フォローは実装対象外です。

## Commands

```bash
npm run electron:dev
npm run build
```

## Current Scope

- X / Threads / mixi2 のサイト切り替え
- `WebContentsView` による公式 Web 版表示
- navigation allowlist
- permission policy
- CSS プリセットの注入
- ルールのオン / オフ
- Monaco Editor による CSS 編集
- `userData/sns-browser/` 配下への JSON 保存

## Notes

ログイン済み SNS ページを扱うため、Cookie やセッションは Electron/Chromium の session 管理に任せます。アプリ独自の JSON にはパスワード、Cookie、投稿本文の大量キャッシュを保存しません。
