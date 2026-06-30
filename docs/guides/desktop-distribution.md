# デスクトップアプリ配布手順

対象: `apps/desktop`

## 現在の配布方針

まずは macOS 向けに、追加の外部パッケージを導入せず、既存の Electron 実行ファイルを使って配布用成果物を作る。

生成する成果物:

- `.app` - macOS アプリ本体
- `.zip` - `.app` を圧縮した配布用アーカイブ
- `.dmg` - ディスクイメージ形式の配布用アーカイブ

現段階では Developer ID 署名・公証は行わない。ローカル検証や限定共有向けの成果物とする。`package:mac` では macOS 上で起動しやすくするため ad-hoc signing は行う。一般配布に進む段階では、Apple Developer ID 署名と notarization を追加する。

## コマンド

```bash
cd apps/desktop
npm run package:mac
```

`package:mac` は次を順番に実行する。

1. renderer を `dist/` にビルドする。
2. Electron main / preload を `dist-electron/` にビルドする。
3. `node_modules/electron/dist/Electron.app` を `release/mac/SNS Client.app` にコピーする。
4. `Info.plist` のアプリ名、Bundle ID、バージョン、実行ファイル名を更新する。
5. `Contents/Resources/app/` に実行に必要な最小ファイルを配置する。
6. ad-hoc signing を行う。
7. `release/artifacts/` に `.zip` と `.dmg` を作る。

## 出力先

```txt
apps/desktop/release/
├── mac/
│   └── SNS Client.app
└── artifacts/
    ├── sns-client-desktop-0.1.0-mac-arm64.zip
    └── sns-client-desktop-0.1.0-mac-arm64.dmg
```

CPU アーキテクチャ部分は実行環境に応じて `arm64` または `x64` になる。

## 動作確認

```bash
open "release/mac/SNS Client.app"
```

Developer ID 署名・公証をしていないため、環境によっては macOS Gatekeeper が警告する。限定検証では右クリックから開く、またはシステム設定の許可で確認する。

## 注意点

- 現在の `.app` は ad-hoc signing のみ。
- `.dmg` はレイアウト調整なしの単純なディスクイメージ。
- 自動アップデートは未実装。
- Windows / Linux の配布成果物は未整備。
- Electron の `userData` 保存先はアプリ名に基づくため、配布アプリでは `SNS Client` の保存領域を使う。

## 将来の正式配布で追加すること

1. アプリアイコンを設定する。
2. `Developer ID Application` でコード署名する。
3. Apple notarization を CI またはローカルスクリプトに組み込む。
4. `.dmg` に Applications ショートカットと背景を設定する。
5. Windows 向け `.exe` / `.zip`、Linux 向け AppImage などを検討する。
6. 配布前チェックリストを作る。
