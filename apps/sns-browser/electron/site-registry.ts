import type { BrowserRule, SiteDefinition, SiteId } from "./types.js";

export const siteDefinitions: Record<SiteId, SiteDefinition> = {
  x: {
    id: "x",
    label: "X",
    homeUrl: "https://x.com/home",
    allowedOrigins: ["https://x.com", "https://twitter.com"],
    externalLinkPolicy: "open-external",
    defaultRuleIds: [
      "x-calm-layout",
      "x-hide-metrics",
      "x-sidebar-show-site-logo",
      "x-sidebar-show-explore",
      "x-sidebar-show-notifications",
      "x-sidebar-show-chat",
      "x-sidebar-show-grok",
      "x-sidebar-show-bookmarks",
      "x-sidebar-show-creator-studio",
      "x-sidebar-show-premium",
      "x-sidebar-show-profile",
      "x-sidebar-show-more",
      "x-sidebar-show-post",
      "x-timeline-show-avatar",
      "x-timeline-show-display-name",
      "x-timeline-show-user-id",
      "x-timeline-show-post-time",
      "x-timeline-show-grok-explain",
      "x-timeline-show-more",
      "x-timeline-show-text",
      "x-timeline-show-media",
      "x-timeline-show-reply",
      "x-timeline-show-repost",
      "x-timeline-show-like",
      "x-timeline-show-views",
      "x-timeline-show-bookmark",
      "x-timeline-show-share",
      "x-composer-show-area",
    ],
  },
  threads: {
    id: "threads",
    label: "Threads",
    homeUrl: "https://www.threads.net/",
    allowedOrigins: ["https://www.threads.net", "https://threads.net"],
    externalLinkPolicy: "open-external",
    defaultRuleIds: ["threads-calm-layout", "threads-hide-metrics"],
  },
  mixi2: {
    id: "mixi2",
    label: "mixi2",
    homeUrl: "https://mixi.social/",
    allowedOrigins: ["https://mixi.social"],
    externalLinkPolicy: "open-external",
    defaultRuleIds: ["mixi2-calm-layout", "mixi2-soften-pressure"],
  },
};

export const defaultSettings = {
  activeSiteId: "x" as SiteId,
  advancedMode: false,
  openExternalLinksInDefaultBrowser: true,
  rememberLastUrl: true,
};

export function getSite(siteId: SiteId) {
  return siteDefinitions[siteId];
}

export function getPublicSites() {
  return Object.values(siteDefinitions).map(({ id, label, homeUrl }) => ({
    id,
    label,
    homeUrl,
  }));
}

export function getDefaultRules(siteId: SiteId): BrowserRule[] {
  return defaultRules.filter((rule) => rule.siteId === siteId);
}

const xSidebarItems = {
  siteLogo: `a[aria-label="X"][href$="/home"]`,
  explore: `a[data-testid="AppTabBar_Explore_Link"],
a[href$="/explore"],
a[aria-label="調べたいものを検索"]`,
  notifications: `a[data-testid="AppTabBar_Notifications_Link"],
a[href$="/notifications"],
a[aria-label^="通知"]`,
  chat: `a[data-testid="AppTabBar_DirectMessage_Link"],
a[href$="/i/chat"],
a[aria-label="ダイレクトメッセージ"],
[data-testid="chat-drawer-main"]`,
  grok: `a[href$="/i/grok"],
a[aria-label="Grok"],
[data-testid="GrokDrawerHeader"]`,
  bookmarks: `a[href$="/i/bookmarks"],
a[aria-label="ブックマーク"]`,
  creatorStudio: `a[href*="/i/jf/creators/studio"],
a[aria-label="クリエイタースタジオ"]`,
  premium: `a[data-testid="premium-signup-tab"],
a[href*="/i/premium_sign_up"],
a[aria-label="プレミアム"]`,
  profile: `a[data-testid="AppTabBar_Profile_Link"],
nav a[aria-label="プロフィール"]`,
  more: `button[data-testid="AppTabBar_More_Menu"],
button[aria-label="その他のメニュー項目"]`,
  post: `a[data-testid="SideNav_NewTweet_Button"],
a[href$="/compose/post"],
a[aria-label="ポストする"]`,
} as const;

const xTimelineItems = {
  avatar: `article[data-testid="tweet"] [data-testid="Tweet-User-Avatar"]`,
  displayName: `article[data-testid="tweet"] [data-testid="User-Name"] a:not([tabindex="-1"]):not(:has(time))`,
  userId: `article[data-testid="tweet"] [data-testid="User-Name"] a[tabindex="-1"]`,
  postTime: `article[data-testid="tweet"] [data-testid="User-Name"] time`,
  grokExplain: `article[data-testid="tweet"] button[aria-label*="Grok"],
article[data-testid="tweet"] [aria-label*="このポストを説明"],
article[data-testid="tweet"] [aria-label*="Explain this post"]`,
  more: `article[data-testid="tweet"] [data-testid="caret"]`,
  text: `article[data-testid="tweet"] [data-testid="tweetText"],
article[data-testid="tweet"] [data-testid="tweet-text-show-more-link"]`,
  media: `article[data-testid="tweet"] [data-testid="tweetPhoto"],
article[data-testid="tweet"] [data-testid="videoPlayer"],
article[data-testid="tweet"] [data-testid="videoComponent"],
article[data-testid="tweet"] [data-testid="videoContainer"],
article[data-testid="tweet"] [data-testid="imageWrapper"],
article[data-testid="tweet"] [data-testid^="card."],
article[data-testid="tweet"] [data-testid^="Carousel-"]`,
  reply: `article[data-testid="tweet"] [data-testid="reply"]`,
  repost: `article[data-testid="tweet"] [data-testid="retweet"]`,
  like: `article[data-testid="tweet"] [data-testid="like"]`,
  views: `article[data-testid="tweet"] a[href$="/analytics"],
article[data-testid="tweet"] [aria-label*="ポストアナリティクス"]`,
  bookmark: `article[data-testid="tweet"] [data-testid="bookmark"]`,
  share: `article[data-testid="tweet"] button[aria-label="ポストを共有"],
article[data-testid="tweet"] [aria-label*="共有"]`,
} as const;

const xComposerArea = `[data-testid="primaryColumn"] [data-testid="cellInnerDiv"]:has([data-testid^="tweetTextarea_"])`;

function hideXSidebarItemCss(selector: string) {
  return `${selector} {
  display: none !important;
}`;
}

function hideXTimelineItemCss(selector: string) {
  return `${selector} {
  display: none !important;
}`;
}

function hideXComposerAreaCss(selector: string) {
  return `${selector} {
  display: none !important;
}`;
}

function showXSidebarItemCss(selector: string) {
  return `${selector} {
  display: flex !important;
}`;
}

function showXTimelineItemCss(selector: string) {
  return `${selector} {
  display: revert !important;
}`;
}

function showXComposerAreaCss(selector: string) {
  return `${selector} {
  display: revert !important;
}`;
}

function xSidebarShowRule(
  id: string,
  name: string,
  selector: string,
  enabled: boolean,
  description = "X の左サイドバー項目を表示します。OFF にすると非表示になります。",
): BrowserRule {
  return {
    id,
    siteId: "x",
    name,
    description,
    enabled,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: showXSidebarItemCss(selector),
  };
}

function xTimelineShowRule(
  id: string,
  name: string,
  selector: string,
  enabled: boolean,
  description = "X のタイムライン投稿内の要素を表示します。OFF にすると非表示になります。",
): BrowserRule {
  return {
    id,
    siteId: "x",
    name,
    description,
    enabled,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: showXTimelineItemCss(selector),
  };
}

function xComposerShowRule(
  id: string,
  name: string,
  selector: string,
  enabled: boolean,
  description = "X のホーム上部ポスト作成エリア全体を表示します。OFF にすると非表示になります。",
): BrowserRule {
  return {
    id,
    siteId: "x",
    name,
    description,
    enabled,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: showXComposerAreaCss(selector),
  };
}

const defaultRules: BrowserRule[] = [
  {
    id: "x-calm-layout",
    siteId: "x",
    name: "読み取り用の余白調整",
    description: "右カラムや刺激の強い領域を控えめにし、投稿本文を読みやすくします。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* X: calm layout */
[data-testid="sidebarColumn"],
[aria-label="Trending"],
[aria-label="Timeline: Trending now"],
[data-testid="trend"] {
  display: none !important;
}

main [data-testid="primaryColumn"] {
  max-width: 760px !important;
}

article img,
article video {
  max-height: 520px !important;
  object-fit: contain !important;
}
`.trim(),
  },
  {
    id: "x-hide-metrics",
    siteId: "x",
    name: "反応数を控えめにする",
    description: "いいね、リポスト、返信などの数値表示を隠す実験用ルールです。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* X: hide engagement numbers */
article [role="group"] span:not(:empty) {
  font-size: 0 !important;
}

article [role="group"] span:not(:empty)::after {
  content: "" !important;
}
`.trim(),
  },
  {
    id: "x-sidebar-visibility-base",
    siteId: "x",
    name: "X 左サイドバー表示制御の土台",
    description: "左サイドバーの項目別 ON/OFF のために対象項目をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: Object.values(xSidebarItems).map(hideXSidebarItemCss).join("\n\n"),
  },
  xSidebarShowRule("x-sidebar-show-site-logo", "左サイドバー: サイトロゴ", xSidebarItems.siteLogo, true),
  xSidebarShowRule("x-sidebar-show-explore", "左サイドバー: 話題を検索", xSidebarItems.explore, true),
  xSidebarShowRule("x-sidebar-show-notifications", "左サイドバー: 通知", xSidebarItems.notifications, false),
  xSidebarShowRule("x-sidebar-show-chat", "左サイドバー: チャット", xSidebarItems.chat, false),
  xSidebarShowRule("x-sidebar-show-grok", "左サイドバー: Grok", xSidebarItems.grok, false),
  xSidebarShowRule("x-sidebar-show-bookmarks", "左サイドバー: ブックマーク", xSidebarItems.bookmarks, true),
  xSidebarShowRule(
    "x-sidebar-show-creator-studio",
    "左サイドバー: クリエイタースタジオ",
    xSidebarItems.creatorStudio,
    false,
  ),
  xSidebarShowRule("x-sidebar-show-premium", "左サイドバー: プレミアム", xSidebarItems.premium, false),
  xSidebarShowRule("x-sidebar-show-profile", "左サイドバー: プロフィール", xSidebarItems.profile, true),
  xSidebarShowRule("x-sidebar-show-more", "左サイドバー: もっと見る", xSidebarItems.more, true),
  xSidebarShowRule("x-sidebar-show-post", "左サイドバー: ポストする", xSidebarItems.post, true),
  {
    id: "x-timeline-visibility-base",
    siteId: "x",
    name: "X タイムライン投稿表示制御の土台",
    description: "タイムライン投稿の項目別 ON/OFF のために対象項目をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: Object.values(xTimelineItems).map(hideXTimelineItemCss).join("\n\n"),
  },
  xTimelineShowRule("x-timeline-show-avatar", "タイムライン投稿: アバターアイコン", xTimelineItems.avatar, true),
  xTimelineShowRule("x-timeline-show-display-name", "タイムライン投稿: ユーザー名", xTimelineItems.displayName, true),
  xTimelineShowRule("x-timeline-show-user-id", "タイムライン投稿: ユーザーID", xTimelineItems.userId, false),
  xTimelineShowRule("x-timeline-show-post-time", "タイムライン投稿: 投稿日時", xTimelineItems.postTime, true),
  xTimelineShowRule(
    "x-timeline-show-grok-explain",
    "タイムライン投稿: このポストを説明する Grok アイコン",
    xTimelineItems.grokExplain,
    false,
  ),
  xTimelineShowRule("x-timeline-show-more", "タイムライン投稿: もっと見る", xTimelineItems.more, true),
  xTimelineShowRule("x-timeline-show-text", "タイムライン投稿: 本文", xTimelineItems.text, true),
  xTimelineShowRule("x-timeline-show-media", "タイムライン投稿: 画像・メディア", xTimelineItems.media, true),
  xTimelineShowRule("x-timeline-show-reply", "タイムライン投稿: 返信", xTimelineItems.reply, false),
  xTimelineShowRule("x-timeline-show-repost", "タイムライン投稿: リポスト", xTimelineItems.repost, false),
  xTimelineShowRule("x-timeline-show-like", "タイムライン投稿: いいね", xTimelineItems.like, true),
  xTimelineShowRule("x-timeline-show-views", "タイムライン投稿: 表示", xTimelineItems.views, false),
  xTimelineShowRule("x-timeline-show-bookmark", "タイムライン投稿: ブックマーク", xTimelineItems.bookmark, true),
  xTimelineShowRule("x-timeline-show-share", "タイムライン投稿: 共有", xTimelineItems.share, false),
  {
    id: "x-composer-visibility-base",
    siteId: "x",
    name: "X ポスト作成エリア表示制御の土台",
    description: "ホーム上部ポスト作成エリア全体の ON/OFF のために対象領域をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: hideXComposerAreaCss(xComposerArea),
  },
  xComposerShowRule("x-composer-show-area", "ポスト作成: 作成エリア", xComposerArea, true),
  {
    id: "threads-calm-layout",
    siteId: "threads",
    name: "余白と導線を落ち着かせる",
    description: "投稿カードの密度と周辺導線を控えめにします。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* Threads: calm layout */
main {
  max-width: 780px !important;
  margin-inline: auto !important;
}

a[href*="/search"],
a[href*="/activity"] {
  opacity: 0.55 !important;
}

img,
video {
  max-height: 560px !important;
  object-fit: contain !important;
}
`.trim(),
  },
  {
    id: "threads-hide-metrics",
    siteId: "threads",
    name: "反応数を控えめにする",
    description: "Threads の反応数らしき小さな数値表示を弱めます。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* Threads: reduce metric prominence */
time + span,
svg + span {
  opacity: 0.35 !important;
}
`.trim(),
  },
  {
    id: "mixi2-calm-layout",
    siteId: "mixi2",
    name: "表示密度を調整する",
    description: "mixi2 のカードや画像を読みやすい密度へ寄せます。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* mixi2: calm layout */
main {
  max-width: 900px !important;
  margin-inline: auto !important;
}

img,
video {
  max-height: 540px !important;
  object-fit: contain !important;
}
`.trim(),
  },
  {
    id: "mixi2-soften-pressure",
    siteId: "mixi2",
    name: "通知圧を弱める",
    description: "通知や反応導線を控えめにするための実験用ルールです。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* mixi2: soften pressure */
[aria-label*="通知"],
[aria-label*="いいね"],
[aria-label*="リアクション"] {
  opacity: 0.65 !important;
}
`.trim(),
  },
];
