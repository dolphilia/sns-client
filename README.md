# SNS Client

Bluesky（AT Protocol）向けのデスクトップ SNS クライアントです。

現在の本体アプリは `apps/desktop/` です。`prototypes/` には過去の検証用プロトタイプを残します。

## 現行アプリ

```bash
cd apps/desktop
npm run dev
npm run electron:dev
npm run build
npm run package:mac
```

## ディレクトリ

- `apps/desktop/` - Electron + React + Vite の現行デスクトップアプリ
- `prototypes/` - 過去のプロトタイプ
- `docs/` - リサーチメモ、仕様、計画
- `research/` - 調査用データ、ノートブック、分析スクリプト

配布用ビルドの手順は [docs/guides/desktop-distribution.md](docs/guides/desktop-distribution.md) を参照してください。

## 方針

基本コンセプトは「ストレスを減らすデスクトップ SNS クライアント」です。通常の SNS に近い操作感を保ちながら、比較・通知圧・自動更新・再フォロー事故などを抑える方向で設計します。
