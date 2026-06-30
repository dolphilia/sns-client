# SNS Client

ストレスを減らす SNS 体験を検証するためのデスクトップアプリ群です。

現在の主軸は、Bluesky（AT Protocol）向けの API クライアント `apps/desktop/` です。加えて、公式 Web 版 SNS を包んで表示調整する個人実験用アプリ `apps/sns-browser/` があります。`prototypes/` には過去の検証用プロトタイプを残します。

## 現行アプリ

### Bluesky クライアント

```bash
cd apps/desktop
npm run dev
npm run electron:dev
npm run build
npm run package:mac
```

### SNS Browser Lab

```bash
cd apps/sns-browser
npm run dev
npm run electron:dev
npm run build
```

## ディレクトリ

- `apps/desktop/` - Electron + React + Vite の Bluesky デスクトップクライアント
- `apps/sns-browser/` - X / Threads / mixi2 など公式 Web 版 SNS を表示調整する個人実験用ブラウザ
- `prototypes/` - 過去のプロトタイプ
- `docs/` - リサーチメモ、仕様、計画
- `research/` - 調査用データ、ノートブック、分析スクリプト

`apps/desktop` の配布用ビルド手順は [docs/guides/desktop-distribution.md](docs/guides/desktop-distribution.md) を参照してください。

## 方針

基本コンセプトは「ストレスを減らすデスクトップ SNS クライアント」です。通常の SNS に近い操作感を保ちながら、比較・通知圧・自動更新・再フォロー事故などを抑える方向で設計します。

`apps/sns-browser` は一般公開やストア配布を目的にしない個人実験用です。非公開 API の直接利用、スクレイピング、自動投稿、自動いいね、自動フォローは実装対象外です。
