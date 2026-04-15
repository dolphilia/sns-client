# プロトタイプ技術スタック選定

作成日: 2026-04-15  
参照: [project-overview.md](project-overview.md) / [bluesky-api-guide.md](bluesky-api-guide.md)

> Bluesky 対応 SNS クライアント（デスクトップアプリ優先、ウェブアプリも視野）のプロトタイプを実装するための技術スタックを選定する。既定の方針（Node.js + TypeScript + Vite）を軸に、最も実装しやすく、将来の拡張にも耐えられる組み合わせを選ぶ。

---

## 選定の軸

1. **Bluesky / @atproto/api との親和性** — 公式 SDK が TypeScript / React のサンプルを多く提供している
2. **デスクトップ × ウェブの両立** — 同一コードベースから両プラットフォームへの展開が可能
3. **プロトタイプ速度** — 既存の技術方針（Vite / TypeScript）から外れない
4. **軽量・高速** — SNS クライアントはフィードの描画パフォーマンスが体験に直結する
5. **2025 年時点のエコシステム成熟度** — ドキュメントやサンプルが豊富なもの

---

## 選定結果サマリー

| カテゴリ | 採用技術 | 備考 |
|---|---|---|
| デスクトップ基盤 | **Tauri 2.0** | バンドル軽量・低メモリ・macOS/Win/Linux 対応 |
| UI フレームワーク | **React 19** | @atproto/api との親和性・エコシステムの豊富さ |
| ビルドツール | **Vite** | 既定。Tauri とも公式サポート |
| スタイリング | **Tailwind CSS v4** | v4 で Vite プラグイン統合。設定レス |
| コンポーネント | **shadcn/ui** | Tailwind + Radix ベース。コードオーナーシップあり |
| サーバー状態管理 | **TanStack Query v5** | フィード・無限スクロール・楽観的更新に最適 |
| クライアント状態管理 | **Zustand** | 認証状態・UI 状態の軽量管理 |
| ルーティング | **TanStack Router** | 完全型安全。デスクトップ SPA に最適 |
| AT Protocol | **@atproto/api** | 公式 TypeScript SDK |
| 日時処理 | **date-fns** | ツリーシェイク可能・SNS 時刻表示に最適 |
| アイコン | **Lucide React** | 軽量・shadcn/ui との統合が標準 |
| バーチャルリスト | **TanStack Virtual** | 長大なフィードの高速描画 |

---

## 1. デスクトップ基盤：Tauri 2.0

### 選定理由

| 比較軸 | Tauri 2.0 | Electron |
|---|---|---|
| バンドルサイズ | **〜8MB** | 〜120MB |
| アイドルメモリ | **30〜50MB** | 150〜300MB |
| 起動時間 | **〜4倍速い** | — |
| バッテリー消費 | **0.4%/h** | 2.1%/h（M3 Mac 実測） |
| モバイル展開 | iOS / Android 対応（v2〜） | なし |
| ビルド速度 | Rust コンパイルが遅い | ★速い |
| 実績 | 2024 年以降急増中 | VS Code, Slack, Discord |

Electron との最大の差は**バンドルサイズ（約 15 倍差）とメモリ（約 5 倍差）**。SNS クライアントは常駐アプリになりうるため、メモリ・バッテリーへの影響は体験品質に直結する。Tauri 2.0 は 2024 年末に正式リリースされ、採用が急増している（前年比 +35%）。

Rust の学習コストはあるが、フロントエンドは通常の React/TypeScript で書けるため、バックエンドロジックで Rust を深く書く必要がない限り影響は限定的。

### Vite との統合

Tauri は公式で Vite をサポートしており、フロントエンドとデスクトップアプリを同一プロジェクトで管理できる。

```bash
npm create tauri-app@latest -- --template react-ts
# または既存の Vite React プロジェクトに追加
npm install --save-dev @tauri-apps/cli
npx tauri init
```

### ウェブ版との両立

フロントエンドコードは通常の React/Vite アプリとして動作するため、`npm run dev` でブラウザ確認、`npm run tauri dev` でデスクトップ確認が両立できる。Tauri 固有のネイティブ API（ファイル操作・通知など）はフィーチャーフラグで分岐すれば、同一コードベースのままウェブ版にも対応できる。

---

## 2. UI フレームワーク：React 19

### 選定理由

**@atproto/api との親和性が最も高い。** 公式ドキュメントのサンプルコード、コミュニティのチュートリアル、既存のサードパーティ Bluesky クライアント実装の大多数が React を使用している。

| 比較軸 | React | Svelte | Vue |
|---|---|---|---|
| @atproto/api サンプルの豊富さ | ★★★ | ★ | ★★ |
| TanStack Query との統合 | ★★★ | ★★ | ★★ |
| shadcn/ui 対応 | ★★★ | △ | △ |
| バンドルサイズ | 中（487KB） | 小（87KB） | 小〜中（312KB） |
| エコシステム | ★★★ | ★★ | ★★★ |
| 学習コスト | 中 | 低 | 低〜中 |

Svelte はバンドルサイズと記述の簡潔さで優れるが、2025 年時点では @atproto/api・TanStack Query・shadcn/ui の React 向けエコシステムに比べると整備が劣る。今回のプロジェクトでは**ライブラリ活用を最大化する**方針のため、エコシステムの豊富さで React を選ぶ。

---

## 3. スタイリング：Tailwind CSS v4 + shadcn/ui

### Tailwind CSS v4

Vite 向けの公式プラグインが提供され、設定がほぼ不要になった。ビルドも v3 比でフルビルド 5 倍速、インクリメンタルビルドは 100 倍以上速い。

```bash
npm install tailwindcss @tailwindcss/vite
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default { plugins: [tailwindcss()] };
```

```css
/* index.css */
@import "tailwindcss";
```

### shadcn/ui

npm パッケージではなく、コンポーネントのソースコードをプロジェクト内にコピーする方式。**コードを完全に自分たちで所有**できるため、デザインのカスタマイズに上限がない。

- Radix UI のヘッドレスプリミティブ（アクセシビリティ保証）をベースに Tailwind でスタイリング
- Dialog / Dropdown / Toast / Sheet / Slider など SNS クライアントに必要なコンポーネントが揃っている
- GitHub スター 75,000+（2025 年時点で React 新規プロジェクトのデファクト）

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog dropdown-menu avatar sheet toast
```

---

## 4. サーバー状態管理：TanStack Query v5

### 選定理由

SNS クライアントのデータはほぼすべて「サーバーから取得したデータ」であり、TanStack Query はこのユースケースに最適化されている。

**SNS クライアントとの相性が特によい機能：**

| 機能 | SNS での活用 |
|---|---|
| `useInfiniteQuery` | タイムラインの無限スクロール |
| 楽観的更新（Optimistic Update） | いいね・リポストのボタンを即座に反応させる |
| バックグラウンドリフェッチ | フォーカス復帰時にフィードを自動更新 |
| キャッシュ | 一度取得したプロフィール・スレッドを再利用 |
| ミューテーション + ロールバック | API エラー時に自動で元に戻す |

```typescript
// タイムラインの無限スクロール例
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['timeline'],
  queryFn: ({ pageParam }) =>
    agent.getTimeline({ limit: 50, cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.data.cursor,
  staleTime: 1000 * 60, // 1分間はキャッシュを新鮮とみなす
});

// いいねの楽観的更新例
const likeMutation = useMutation({
  mutationFn: ({ uri, cid }: { uri: string; cid: string }) =>
    agent.like(uri, cid),
  onMutate: async ({ uri }) => {
    // キャッシュを即座に更新（UI が即反応）
    queryClient.setQueryData(['timeline'], (old) => optimisticLike(old, uri));
  },
  onError: (_err, _vars, context) => {
    // エラー時はロールバック
    queryClient.setQueryData(['timeline'], context?.previousData);
  },
});
```

---

## 5. クライアント状態管理：Zustand

TanStack Query がサーバーデータを管理するため、Zustand の担当は純粋なクライアント側の状態に絞られる。

**Zustand が管理する状態の例：**
- 認証セッション（`session`, `agent`）
- サイドバーの開閉状態
- フィルタリング設定（ミュートキーワード、感情フィルタの閾値など）
- テーマ（ライト/ダーク）
- 通知の既読状態

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  session: AtpSessionData | null;
  setSession: (s: AtpSessionData | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    { name: 'bsky-auth' } // localStorage に永続化
  )
);
```

---

## 6. ルーティング：TanStack Router

### 選定理由

- **完全な TypeScript 型安全**：パスパラメータ・クエリパラメータ・ローダーデータまで型が通る
- SSR が不要なデスクトップ SPA に最適（Next.js のような SSR ルーターは不要）
- TanStack Query との統合が標準的

```typescript
// routes/profile.$handle.tsx
export const Route = createFileRoute('/profile/$handle')({
  component: ProfilePage,
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      queryKey: ['profile', params.handle],
      queryFn: () => agent.getProfile({ actor: params.handle }),
    }),
});
```

---

## 7. AT Protocol：@atproto/api

公式 TypeScript SDK を使用する。詳細は [bluesky-api-guide.md](bluesky-api-guide.md) を参照。

```bash
npm install @atproto/api
```

認証方式はプロトタイプ段階では **App Password** を使う。本開発移行後に **OAuth 2.0** へ切り替える。

```typescript
import { AtpAgent } from '@atproto/api';

export const agent = new AtpAgent({ service: 'https://bsky.social' });
```

---

## 8. 日時処理：date-fns

SNS クライアントで頻繁に使う「〇分前」「昨日」などの相対時刻表示に適している。

- **ツリーシェイク可能**：使った関数のみがバンドルに含まれる
- 国際化（i18n）対応：日本語ロケールあり

```typescript
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const relativeTime = formatDistanceToNow(new Date(post.record.createdAt), {
  addSuffix: true,
  locale: ja,  // 「3分前」「1時間前」
});
```

---

## 9. アイコン：Lucide React

- shadcn/ui の標準アイコンライブラリ
- SVG ベースで各アイコンをツリーシェイク可能
- Heart / Repeat2 / MessageCircle / Share など SNS 向けのアイコンが揃っている

```bash
npm install lucide-react
```

```tsx
import { Heart, Repeat2, MessageCircle } from 'lucide-react';

<button><Heart size={16} /> {likeCount}</button>
```

---

## 10. バーチャルリスト：TanStack Virtual

タイムラインは数百〜数千件のアイテムを扱う可能性がある。全 DOM を描画すると重くなるため、**画面に見えている部分だけを描画するバーチャライゼーション**が必要。

- TanStack Query との同一エコシステムで統合が自然
- 可変高さアイテム対応（テキスト量によって高さが異なる投稿に対応）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count:           posts.length,
  getScrollElement: () => parentRef.current,
  estimateSize:    () => 120,  // 推定高さ（px）
  overscan:        5,
});
```

---

## プロジェクト構成案

```
prototypes/prototype-a/
├── src-tauri/          Tauri バックエンド（Rust）
│   ├── src/
│   │   └── main.rs
│   └── tauri.conf.json
├── src/                React フロントエンド
│   ├── routes/         TanStack Router のファイルベースルート
│   │   ├── __root.tsx
│   │   ├── index.tsx   タイムライン
│   │   ├── profile.$handle.tsx
│   │   └── post.$uri.tsx
│   ├── components/
│   │   ├── ui/         shadcn/ui のコピーコンポーネント
│   │   ├── post/       投稿関連コンポーネント
│   │   └── layout/     レイアウト
│   ├── hooks/          TanStack Query フック（useTimeline など）
│   ├── stores/         Zustand ストア（auth, settings など）
│   ├── lib/
│   │   ├── agent.ts    AtpAgent の初期化
│   │   └── queryClient.ts
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts  （v4 では不要になる場合あり）
├── tsconfig.json
└── package.json
```

---

## セットアップ手順（クイックスタート）

```bash
# 1. Tauri + React + TypeScript プロジェクトを作成
npm create tauri-app@latest prototype-a -- --template react-ts
cd prototype-a

# 2. フロントエンド依存関係を追加
npm install @atproto/api
npm install @tanstack/react-query @tanstack/react-router @tanstack/react-virtual
npm install zustand
npm install date-fns lucide-react

# 3. Tailwind CSS v4 をセットアップ
npm install tailwindcss @tailwindcss/vite

# 4. shadcn/ui を初期化（Tailwind v4 対応版）
npx shadcn@latest init

# 5. よく使うコンポーネントを追加
npx shadcn@latest add button avatar dialog dropdown-menu sheet toast

# 6. 開発サーバー起動
npm run tauri dev        # デスクトップアプリとして起動
npm run dev              # ブラウザのみで確認
```

---

## 採用しないものとその理由

| 技術 | 採用しない理由 |
|---|---|
| Electron | バンドルサイズ（120MB）・メモリ使用量がデスクトップ常駐アプリには重すぎる |
| Next.js | SSR・サーバー機能が不要。デスクトップ SPA に対してオーバースペック |
| Vue / Svelte | @atproto/api や TanStack エコシステムの React 向け充実度に劣る |
| Redux / Redux Toolkit | TanStack Query でサーバー状態を管理するため大半が不要。Zustand で十分 |
| MobX | 公式 Bluesky アプリが採用しているが、複雑な OOP が必要なほどの規模感ではない |
| Moment.js | メンテナンス終了。date-fns で代替可能 |
| CSS Modules / Styled-components | Tailwind + shadcn/ui で十分。ビルドチェーンをシンプルに保つ |

---

## 参考リソース

- [Tauri 2.0 公式 – Create a Project](https://v2.tauri.app/start/create-project/)
- [Tauri 2.0 公式 – Vite フロントエンド設定](https://v2.tauri.app/start/frontend/vite/)
- [Tauri vs. Electron: performance and bundle size – gethopp.app](https://www.gethopp.app/blog/tauri-vs-electron)
- [@atproto/api – npm](https://www.npmjs.com/package/@atproto/api)
- [TanStack Query – 公式](https://tanstack.com/query/latest)
- [TanStack Router – 公式](https://tanstack.com/router/latest)
- [TanStack Virtual – 公式](https://tanstack.com/virtual/latest)
- [shadcn/ui – 公式](https://ui.shadcn.com/)
- [Tailwind CSS v4.0 リリースノート](https://tailwindcss.com/blog/tailwindcss-v4)
- [Zustand – GitHub](https://github.com/pmndrs/zustand)
- [date-fns – 公式](https://date-fns.org/)
- [Lucide React – 公式](https://lucide.dev/)
- [Bluesky social-app（公式アプリ）– GitHub](https://github.com/bluesky-social/social-app)
