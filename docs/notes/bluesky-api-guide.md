# Bluesky クライアント開発ガイド

作成日: 2026-04-15

> Bluesky 対応 SNS クライアントを実装するために必要な、AT Protocol の概要・認証・主要 API 操作・SDK 利用方法をまとめた開発リファレンス。

---

## 1. AT Protocol の概要

### 1-1. AT Protocol とは

AT Protocol（Authenticated Transfer Protocol）は Bluesky が開発した、分散型ソーシャルネットワークのための通信規格。ユーザーデータは**暗号学的に署名されたリポジトリ**として管理され、**分散識別子（DID）**によって検証される。

| 特徴 | 説明 |
|---|---|
| 分散型 | 複数の独立したサーバーが連携する |
| ユーザー主権 | データはユーザー自身の PDS に保存。サーバー移行可能 |
| オープン | 誰でも互換クライアント・サーバーを実装できる |
| Lexicon | API の名称と振る舞いを統一するグローバルスキーマシステム |

### 1-2. 主要コンポーネント

```
[クライアント]
    │  XRPC（HTTP ベースの RPC）
    ▼
[PDS: Personal Data Server]      ユーザーデータの保管・認証・中継
    │  EventStream / Firehose
    ▼
[BGS: Big Graph Service]          全 PDS のイベントを集約し中継
    │
    ▼
[AppView]                         BGS のデータを整形し API として提供
    │                             （likes 集計、タイムライン構築など）
    ▼
[Feed Generator]                  カスタムアルゴリズムによるフィード
```

**PDS（Personal Data Server）**  
ユーザーの代理人となるサーバー。ログイン・認証の管理、リポジトリのホスティング、署名鍵の管理を行う。Bluesky が運営する公式 PDS は `bsky.social`。

**AppView**  
Firehose を消費して Bluesky ソーシャルアプリ向けに整形する。いいね数の集計、スレッドの組み立て、フォロワーセットの管理、タイムラインの構築などを担う。

**Lexicon**  
API のスキーマ定義。`app.bsky.*` がソーシャル機能、`com.atproto.*` がプロトコル低レベル操作を定義する。

### 1-3. アイデンティティ：DID とハンドル

| 識別子 | 例 | 説明 |
|---|---|---|
| DID | `did:plc:ewvi7nxzyoun6zhhandbv25a` | 永続的な主識別子。変更不可 |
| ハンドル | `user.bsky.social` | 人間が読める名前。変更可能。DNS で DID に解決される |

- **did:plc**: Bluesky が管理する PLC ディレクトリを使った DID メソッド
- **did:web**: 自前のドメインで管理する DID メソッド
- ハンドルから DID への解決は DNS TXT レコードまたは `/.well-known/atproto-did` エンドポイントで行われる

```
https://plc.directory/{did}  →  DID ドキュメントを返す
```

---

## 2. SDK と開発環境

### 2-1. 公式 TypeScript SDK：`@atproto/api`

Bluesky 公式の TypeScript/JavaScript 向け SDK。ブラウザ・Node.js どちらでも動作する。

```bash
npm install @atproto/api
# または
yarn add @atproto/api
```

**主な機能**

- XRPC クライアント（HTTP ラッパー）
- セッション管理（App Password / OAuth）
- 完全な TypeScript 型定義
- RichText ライブラリ（メンション・リンク・ハッシュタグのファセット処理）

### 2-2. その他の SDK

| SDK | 言語 | 備考 |
|---|---|---|
| `atproto` | Python | [atproto.blue](https://atproto.blue/) |
| `atproto.dart` | Dart/Flutter | [atprotodart.com](https://atprotodart.com/) |
| `lexrpc` | Python | XRPC の低レベル実装 |

### 2-3. API エンドポイント

| 用途 | エンドポイント |
|---|---|
| 認証済みリクエスト（通常） | `https://bsky.social/xrpc/` |
| 公開エンドポイント（認証不要） | `https://public.api.bsky.app/xrpc/` |
| 自己ホスト PDS | `https://{pds-hostname}/xrpc/` |

認証済みリクエストは、ユーザーの PDS を通してプロキシされる（`Atproto-Proxy` ヘッダーで指定）。

---

## 3. 認証

Bluesky クライアントには 2 種類の認証方式がある。

### 3-1. App Password 認証（シンプルな実装向け）

ユーザーが Bluesky の設定画面で発行した「アプリパスワード」を使う方式。実装が簡単だが、OAuth と比較してスコープ制御が粗い。

**セッションの作成（ログイン）**

```typescript
import { AtpAgent } from '@atproto/api';

const agent = new AtpAgent({ service: 'https://bsky.social' });

await agent.login({
  identifier: 'user.bsky.social',  // ハンドルまたはメールアドレス
  password: 'xxxx-xxxx-xxxx-xxxx', // アプリパスワード
});

// 以降の API 呼び出しで agent を使い回す
```

**セッションの構造**

`com.atproto.server.createSession` が返すオブジェクト:

```json
{
  "did":         "did:plc:...",
  "handle":      "user.bsky.social",
  "accessJwt":   "eyJ...",   // 短命トークン（数時間で期限切れ）
  "refreshJwt":  "eyJ...",   // 長命トークン（セッション更新用）
  "email":       "user@example.com"
}
```

**セッションの永続化と復元**

```typescript
// 保存
const session = agent.session;
localStorage.setItem('bsky_session', JSON.stringify(session));

// 復元
const saved = JSON.parse(localStorage.getItem('bsky_session') ?? 'null');
if (saved) {
  await agent.resumeSession(saved);
}
```

**アクセストークンのリフレッシュ**

SDK が自動でリフレッシュするが、手動でも実行可能:

```typescript
await agent.sessionManager.refreshSession();
```

---

### 3-2. OAuth 2.0 認証（推奨・セキュアな実装向け）

AT Protocol が正式に推奨する認証方式。PKCE と DPoP（Demonstrating Proof of Possession）を必須とし、スコープ制御が細かい。

**使用パッケージ**

```bash
npm install @atproto/oauth-client-browser  # ブラウザ向け
npm install @atproto/oauth-client-node     # Node.js 向け
```

**認証フローの概要**

```
1. クライアントが PAR（Pushed Authorization Request）をPDSに送信
   POST {pds}/oauth/par
   ← request_uri を取得

2. ユーザーをPDSの認証画面にリダイレクト
   {pds}/oauth/authorize?client_id=...&request_uri=...

3. PDS がコールバック URL にリダイレクト
   {callback}?code=...&state=...&iss=...

4. コードをトークンに交換
   POST {pds}/oauth/token
   ← access_token / refresh_token / sub（DID）を取得

5. sub（DID）と期待するアカウントが一致することを検証
```

**必須要件**

- PKCE（code_challenge_method: S256）
- DPoP（すべてのリソースリクエストに DPoP proof ヘッダーを付与）
- scope に `atproto` を含める
- 認可リクエストは PAR 経由必須

**ブラウザ向け実装例**

```typescript
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

const client = await BrowserOAuthClient.load({
  clientId: 'https://your-app.example.com/client-metadata.json',
  handleResolver: 'https://bsky.social',
});

// ログイン開始（ハンドルを入力してもらう）
await client.signIn('user.bsky.social', {
  scope: 'atproto transition:generic',
});

// コールバック後にセッションを回収
const result = await client.init();
if (result) {
  const { session } = result;
  // session.agent で API を叩ける
}
```

---

## 4. 投稿（Post）

### 4-1. シンプルなテキスト投稿

```typescript
await agent.post({
  text: 'はじめての投稿！',
  createdAt: new Date().toISOString(),
});
```

内部的には `com.atproto.repo.createRecord` を呼び出して `app.bsky.feed.post` レコードを作成している。

### 4-2. リッチテキスト（メンション・URL・ハッシュタグ）

AT Protocol のテキストは「ファセット（Facet）」と呼ばれるメタデータで装飾する。**バイトオフセット（UTF-8）**で範囲を指定する必要があるため、SDK の `RichText` を使うことを強く推奨する。

```typescript
import { RichText } from '@atproto/api';

const rt = new RichText({
  text: '@user.bsky.social に連絡しました。詳細は https://example.com を参照 #bluesky',
});

// メンションと URL を自動検出
await rt.detectFacets(agent);

await agent.post({
  text: rt.text,
  facets: rt.facets,  // ファセット（バイトオフセット付きのアノテーション）
  createdAt: new Date().toISOString(),
});
```

**ファセットの手動定義（ハッシュタグなど）**

```typescript
const rt = new RichText({ text: '今日も #bluesky で元気に！' });

rt.facets = [{
  index: {
    byteStart: 8,   // UTF-8 バイト単位のオフセット
    byteEnd:   18,
  },
  features: [{
    $type: 'app.bsky.richtext.facet#tag',
    tag: 'bluesky',  // # を含まない
  }],
}];
```

### 4-3. 画像付き投稿

画像は 2 ステップ処理：まず blob をアップロードし、その参照を投稿に埋め込む。

```typescript
import * as fs from 'fs';

// Step 1: 画像をアップロード（最大 1MB / 画像）
const imageData = fs.readFileSync('photo.jpg');
const { data: blob } = await agent.uploadBlob(imageData, {
  encoding: 'image/jpeg',
});

// Step 2: 投稿にembedとして添付（最大 4 枚）
await agent.post({
  text: '今日の写真',
  embed: {
    $type: 'app.bsky.embed.images',
    images: [{
      image: blob.blob,
      alt: '説明テキスト（アクセシビリティのため必須推奨）',
    }],
  },
  createdAt: new Date().toISOString(),
});
```

**対応フォーマット**: JPEG / PNG / GIF / WebP  
**サイズ制限**: 1 枚 1MB、1 投稿 4 枚まで

### 4-4. リンクカード（外部リンクの埋め込み）

```typescript
await agent.post({
  text: '記事を読みました',
  embed: {
    $type: 'app.bsky.embed.external',
    external: {
      uri:         'https://example.com/article',
      title:       '記事タイトル',
      description: '記事の説明',
      // thumb: blob // サムネイル画像（任意）
    },
  },
  createdAt: new Date().toISOString(),
});
```

### 4-5. 返信（リプライ）

返信には親投稿と、スレッドのルート投稿の **URI と CID** の両方が必要。

```typescript
// 親投稿の情報を取得
const { data: thread } = await agent.getPostThread({
  uri: 'at://did:plc:.../app.bsky.feed.post/...',
  depth: 0,
});

const parentPost = thread.thread.post;

await agent.post({
  text: '返信です！',
  reply: {
    root: {
      uri: parentPost.record.reply?.root.uri ?? parentPost.uri,
      cid: parentPost.record.reply?.root.cid ?? parentPost.cid,
    },
    parent: {
      uri: parentPost.uri,
      cid: parentPost.cid,
    },
  },
  createdAt: new Date().toISOString(),
});
```

### 4-6. 引用（Quote Post）

```typescript
await agent.post({
  text: '引用コメント',
  embed: {
    $type: 'app.bsky.embed.record',
    record: {
      uri: 'at://did:plc:.../app.bsky.feed.post/...',
      cid: 'bafyrei...',
    },
  },
  createdAt: new Date().toISOString(),
});
```

### 4-7. 投稿の削除

```typescript
await agent.deletePost('at://did:plc:.../app.bsky.feed.post/...');
```

---

## 5. タイムライン・フィードの取得

### 5-1. ホームタイムライン

```typescript
const { data } = await agent.getTimeline({
  limit:  50,              // 1〜100、デフォルト 50
  cursor: nextCursor,      // ページネーション用カーソル（省略時は最新から）
});

const { feed, cursor } = data;

for (const item of feed) {
  const post    = item.post;
  const author  = post.author;         // { did, handle, displayName, avatar }
  const record  = post.record;         // { text, createdAt, facets?, embed? }
  const viewer  = post.viewer;         // { like?, repost?, ... } 自分との関係
  console.log(`${author.handle}: ${record.text}`);
}

// 次のページ
const nextPage = await agent.getTimeline({ limit: 50, cursor });
```

### 5-2. 特定アカウントの投稿一覧

```typescript
const { data } = await agent.getAuthorFeed({
  actor: 'user.bsky.social',  // ハンドルまたは DID
  limit: 30,
  cursor,
  filter: 'posts_no_replies', // posts_with_replies / posts_with_media / posts_and_author_threads
});
```

### 5-3. カスタムフィード（アルゴリズムフィード）の取得

```typescript
const { data } = await agent.app.bsky.feed.getFeed({
  feed:   'at://did:plc:.../app.bsky.feed.generator/whats-hot',
  limit:  30,
  cursor,
});
```

### 5-4. スレッドの取得

```typescript
const { data } = await agent.getPostThread({
  uri:        'at://did:plc:.../app.bsky.feed.post/...',
  depth:      6,     // 返信の深さ（デフォルト 6）
  parentHeight: 80,  // 祖先ポストの取得数
});

const { thread } = data;
// thread.$type で種別判定: ThreadViewPost / NotFoundPost / BlockedPost
```

### 5-5. ページネーションのパターン

```typescript
let cursor: string | undefined;
const allPosts: FeedViewPost[] = [];

do {
  const { data } = await agent.getTimeline({ limit: 100, cursor });
  allPosts.push(...data.feed);
  cursor = data.cursor;
} while (cursor && allPosts.length < 500);
```

---

## 6. リアクション（いいね・リポスト）

### 6-1. いいね（Like）

```typescript
// いいねする
const { uri, cid } = post;
await agent.like(uri, cid);

// いいね解除（viewer.like に like レコードの URI が入っている）
const likeUri = post.viewer?.like;
if (likeUri) {
  await agent.deleteLike(likeUri);
}
```

内部的には `app.bsky.feed.like` レコードの作成・削除。

### 6-2. リポスト（Repost）

```typescript
// リポスト
await agent.repost(uri, cid);

// リポスト解除
const repostUri = post.viewer?.repost;
if (repostUri) {
  await agent.deleteRepost(repostUri);
}
```

### 6-3. ブックマーク（未公開機能）

2025 年時点では AT Protocol に公式のブックマーク Lexicon は存在しない。クライアント側でローカル保存するか、非公開リストを代用する実装が一般的。

---

## 7. フォロー・フォロワー

### 7-1. フォロー・アンフォロー

```typescript
// フォロー
await agent.follow('did:plc:...');
// または
await agent.follow('user.bsky.social');

// アンフォロー（viewer.following にフォローレコードの URI）
const followUri = profile.viewer?.following;
if (followUri) {
  await agent.deleteFollow(followUri);
}
```

### 7-2. フォロワー一覧・フォロー中一覧

```typescript
// フォロワー一覧
const { data } = await agent.getFollowers({
  actor: 'user.bsky.social',
  limit: 100,
  cursor,
});
// data.followers: ProfileView[]

// フォロー中一覧
const { data } = await agent.getFollows({
  actor: 'user.bsky.social',
  limit: 100,
  cursor,
});
// data.follows: ProfileView[]
```

---

## 8. ミュート・ブロック

### 8-1. ミュート

ミュートしたユーザーの投稿はタイムラインに表示されなくなる（相手には通知されない）。

```typescript
// ミュート
await agent.mute('did:plc:...');

// ミュート解除
await agent.unmute('did:plc:...');

// ミュートリスト取得
const { data } = await agent.app.bsky.graph.getMutes({ limit: 100 });
```

### 8-2. ブロック

ブロックは相互的にコンテンツを非表示にする。AT Protocol の設計上、**ブロックレコード自体は公開リポジトリに保存される**（誰をブロックしたかはオープン）。

```typescript
// ブロック
await agent.app.bsky.graph.block.create(
  { repo: agent.session!.did },
  {
    subject: 'did:plc:...',
    createdAt: new Date().toISOString(),
  }
);

// ブロック解除（ブロックレコードの URI が必要）
await agent.app.bsky.graph.block.delete({
  repo: agent.session!.did,
  rkey: 'レコードキー',
});
```

### 8-3. フォロー・ブロック・ミュート状態の確認

```typescript
const { data: profile } = await agent.getProfile({ actor: 'user.bsky.social' });

const viewer = profile.viewer;
console.log(viewer?.following);    // フォロー中なら URI、していなければ undefined
console.log(viewer?.followedBy);   // フォロワーなら URI
console.log(viewer?.blocking);     // ブロック中なら URI
console.log(viewer?.muted);        // ミュート中なら true
```

---

## 9. プロフィール

### 9-1. プロフィール取得

```typescript
// 自分のプロフィール
const { data: myProfile } = await agent.getProfile({
  actor: agent.session!.did,
});

// 他ユーザー（ハンドルまたは DID で指定）
const { data: theirProfile } = await agent.getProfile({
  actor: 'user.bsky.social',
});
```

**レスポンスの主要フィールド**

```typescript
{
  did:          'did:plc:...',
  handle:       'user.bsky.social',
  displayName:  'ユーザー名',
  description:  '自己紹介',
  avatar:       'https://...blob...',
  banner:       'https://...blob...',
  followersCount: 1234,
  followsCount:   567,
  postsCount:     890,
  viewer: {
    following:   'at://...', // フォロー中なら URI
    followedBy:  'at://...', // フォローされているなら URI
    muted:       false,
    blocking:    undefined,
  }
}
```

### 9-2. プロフィールの更新

```typescript
await agent.upsertProfile((existing) => ({
  ...existing,
  displayName: '新しい表示名',
  description: 'プロフィール文',
  // avatar や banner は先に blob をアップロードして参照を渡す
}));
```

---

## 10. 通知

### 10-1. 通知一覧の取得

```typescript
const { data } = await agent.listNotifications({
  limit:  50,
  cursor,
  seenAt: new Date().toISOString(), // これ以前の通知を取得
});

for (const notif of data.notifications) {
  // reason: 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote' | 'starterpack-joined'
  console.log(notif.reason, notif.author.handle);
}
```

### 10-2. 未読件数の取得

```typescript
const { data } = await agent.countUnreadNotifications();
console.log(data.count); // 未読通知数
```

### 10-3. 通知を既読にする

```typescript
await agent.updateSeenNotifications(new Date().toISOString());
```

---

## 11. 検索

```typescript
// 投稿の全文検索
const { data } = await agent.app.bsky.feed.searchPosts({
  q:      'bluesky クライアント',
  limit:  25,
  cursor,
  // since / until: 期間指定（ISO 8601）
  // author: 特定アカウントの投稿に絞る
});

// ユーザー検索
const { data } = await agent.searchActors({
  q:     'ユーザー名',
  limit: 25,
});

// タイプアヘッド（前方一致）
const { data } = await agent.searchActorsTypeahead({
  q:     'blue',
  limit: 10,
});
```

---

## 12. リスト（ユーザーリスト）

Bluesky のリストはキュレーションリストとモデレーションリストの 2 種類がある。

```typescript
// リスト作成
await agent.app.bsky.graph.list.create(
  { repo: agent.session!.did },
  {
    name:      'お気に入り',
    purpose:   'app.bsky.graph.defs#curatelist',  // または #modlist
    createdAt: new Date().toISOString(),
  }
);

// リストにメンバーを追加
await agent.app.bsky.graph.listitem.create(
  { repo: agent.session!.did },
  {
    subject:   'did:plc:...',
    list:      'at://did:plc:.../app.bsky.graph.list/...',
    createdAt: new Date().toISOString(),
  }
);

// リストのタイムライン取得
const { data } = await agent.app.bsky.feed.getListFeed({
  list:   'at://did:plc:.../app.bsky.graph.list/...',
  limit:  50,
  cursor,
});
```

---

## 13. 画像・動画のアップロード

### 13-1. 画像アップロード

```typescript
// ファイルから
import { readFileSync } from 'fs';
const buf = readFileSync('image.jpg');

// または Blob から（ブラウザ）
const blob = await file.arrayBuffer().then(b => new Uint8Array(b));

const { data } = await agent.uploadBlob(buf, {
  encoding: 'image/jpeg', // image/jpeg / image/png / image/gif / image/webp
});
// data.blob → embed などに使える BlobRef
```

**制限**: 1 枚 1MB、1 投稿 4 枚まで

### 13-2. 動画アップロード

動画は別エンドポイント。アップロード上限は `app.bsky.video.getUploadLimits` で確認できる（最大 50MB）。

```typescript
// アップロード上限の確認
const { data: limits } = await agent.app.bsky.video.getUploadLimits();

// 動画アップロード（専用エンドポイント）
const { data } = await agent.app.bsky.video.uploadVideo(videoBuffer);
```

---

## 14. レート制限

| 対象 | 制限 |
|---|---|
| API 全体 | 3,000 リクエスト / 5 分 / IP |
| ファイルアップロード | 50MB / ファイル |

**ポイントシステム**（書き込み系 API 向け）

Bluesky の PDS は書き込み系 API にポイントシステムを設けている。投稿・いいね・フォローなどの操作にポイントが消費され、上限に達すると一時的にレート制限がかかる。

**レート制限への対処**

```typescript
// 429 が返ってきたときのリトライ
const response = await fetch(url, options);
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  await new Promise(r => setTimeout(r, (Number(retryAfter) || 60) * 1000));
  // 再試行...
}
```

**ベストプラクティス**

- バースト書き込みを避ける（一括処理を小分けにする）
- `cursor` を使ったページネーションを適切に実装する
- エクスポネンシャルバックオフを実装する

---

## 15. Firehose とカスタムフィード（上級者向け）

### 15-1. Firehose の購読

ネットワーク全体の投稿・いいね・フォローなどをリアルタイムで受信する WebSocket ストリーム。

```
wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos
```

```typescript
import { Subscription } from '@atproto/xrpc-server';

const sub = new Subscription({
  service: 'wss://bsky.network',
  method: 'com.atproto.sync.subscribeRepos',
  getParams: () => ({ cursor: lastSeq }),
  validate: (body) => body, // lexicon バリデーション
});

for await (const evt of sub) {
  if (isCommit(evt)) {
    // evt.ops に操作一覧（create / update / delete）
  }
}
```

### 15-2. カスタムフィードジェネレーター

Firehose を購読してデータを独自にインデックスし、カスタムアルゴリズムのフィードとして提供するサーバー。スターターキットが公式で提供されている。

```
GitHub: bluesky-social/feed-generator
```

---

## 16. 主要 Lexicon リファレンス

### テキスト・投稿系

| Lexicon ID | 説明 |
|---|---|
| `app.bsky.feed.post` | 投稿レコード |
| `app.bsky.feed.like` | いいねレコード |
| `app.bsky.feed.repost` | リポストレコード |
| `app.bsky.richtext.facet` | テキスト装飾（メンション・URL・タグ） |
| `app.bsky.embed.images` | 画像埋め込み |
| `app.bsky.embed.external` | 外部リンクカード |
| `app.bsky.embed.record` | 投稿引用 |
| `app.bsky.embed.video` | 動画埋め込み |

### フィード・検索系

| Lexicon ID | 説明 |
|---|---|
| `app.bsky.feed.getTimeline` | ホームタイムライン取得 |
| `app.bsky.feed.getAuthorFeed` | ユーザー投稿一覧 |
| `app.bsky.feed.getFeed` | カスタムフィード取得 |
| `app.bsky.feed.getPostThread` | スレッド取得 |
| `app.bsky.feed.searchPosts` | 投稿検索 |

### ソーシャルグラフ系

| Lexicon ID | 説明 |
|---|---|
| `app.bsky.graph.follow` | フォローレコード |
| `app.bsky.graph.block` | ブロックレコード |
| `app.bsky.graph.list` | ユーザーリスト |
| `app.bsky.graph.listitem` | リストのメンバー |
| `app.bsky.graph.getFollowers` | フォロワー一覧 |
| `app.bsky.graph.getFollows` | フォロー中一覧 |
| `app.bsky.graph.getMutes` | ミュートリスト |

### アカウント・通知系

| Lexicon ID | 説明 |
|---|---|
| `app.bsky.actor.getProfile` | プロフィール取得 |
| `app.bsky.actor.searchActors` | ユーザー検索 |
| `app.bsky.notification.listNotifications` | 通知一覧 |
| `app.bsky.notification.getUnreadCount` | 未読通知数 |
| `com.atproto.server.createSession` | セッション作成（ログイン） |
| `com.atproto.server.deleteSession` | セッション削除（ログアウト） |
| `com.atproto.server.refreshSession` | セッションリフレッシュ |
| `com.atproto.repo.uploadBlob` | ファイルアップロード |

---

## 17. 実装チェックリスト

### 最低限の基本実装

- [ ] App Password でのログイン・ログアウト
- [ ] セッションの永続化・復元
- [ ] ホームタイムラインの取得・表示（ページネーション対応）
- [ ] テキスト投稿
- [ ] 返信投稿
- [ ] いいね・いいね解除
- [ ] リポスト・リポスト解除
- [ ] フォロー・アンフォロー
- [ ] プロフィール表示
- [ ] 通知一覧の取得

### 標準機能

- [ ] 画像付き投稿（blob アップロード）
- [ ] リンクカード埋め込み
- [ ] 引用投稿
- [ ] スレッド表示
- [ ] ユーザー検索
- [ ] ミュート・ブロック
- [ ] RichText（メンション・URL・ハッシュタグ）の正確な処理
- [ ] 通知の既読管理

### 拡張機能

- [ ] OAuth 2.0 認証への移行
- [ ] カスタムフィードの購読・切り替え
- [ ] ユーザーリストの管理
- [ ] 動画投稿
- [ ] レート制限への適切な対応（指数バックオフ）

---

## 参考リソース

### 公式ドキュメント

- [Bluesky Developer Documentation](https://docs.bsky.app/)
- [AT Protocol 仕様書](https://atproto.com/specs/atp)
- [AT Protocol SDKs 一覧](https://atproto.com/sdks)
- [HTTP API リファレンス](https://docs.bsky.app/docs/category/http-reference)
- [@atproto/api npm パッケージ](https://www.npmjs.com/package/@atproto/api)

### 認証関連

- [Get Started – Bluesky](https://docs.bsky.app/docs/get-started)
- [OAuth Client Implementation – Bluesky](https://docs.bsky.app/docs/advanced-guides/oauth-client)
- [OAuth for AT Protocol – Bluesky Blog](https://docs.bsky.app/blog/oauth-atproto)
- [@atproto/oauth-client-browser – npm](https://www.npmjs.com/package/@atproto/oauth-client-browser)

### 投稿・リッチテキスト

- [Creating a post – Bluesky](https://docs.bsky.app/docs/tutorials/creating-a-post)
- [Links, mentions, and rich text – Bluesky](https://docs.bsky.app/docs/advanced-guides/post-richtext)
- [Posting via the Bluesky API – AT Protocol Blog](https://atproto.com/blog/create-post)

### アーキテクチャ・上級

- [Federation Architecture – Bluesky](https://docs.bsky.app/docs/advanced-guides/federation-architecture)
- [Firehose – Bluesky](https://docs.bsky.app/docs/advanced-guides/firehose)
- [Custom Feeds – Bluesky](https://docs.bsky.app/docs/starter-templates/custom-feeds)
- [Rate Limits – Bluesky](https://docs.bsky.app/docs/advanced-guides/rate-limits)
- [Resolving Identities – Bluesky](https://docs.bsky.app/docs/advanced-guides/resolving-identities)
- [Block Implementation – Bluesky](https://docs.bsky.app/blog/block-implementation)

### GitHub リポジトリ

- [bluesky-social/atproto](https://github.com/bluesky-social/atproto) — 公式 SDK・仕様実装
- [bluesky-social/feed-generator](https://github.com/bluesky-social/feed-generator) — カスタムフィードのスターターキット
