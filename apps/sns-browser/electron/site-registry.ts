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
      "x-wide-fluid-layout",
      "x-hide-metrics",
      "x-sidebar-show-area",
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
      "x-right-sidebar-show-area",
      "x-right-sidebar-show-search",
      "x-right-sidebar-show-premium",
      "x-right-sidebar-show-news",
      "x-right-sidebar-show-discover",
      "x-right-sidebar-show-users",
      "x-timeline-show-avatar",
      "x-timeline-show-display-name",
      "x-timeline-show-verification-badge",
      "x-timeline-show-user-id",
      "x-timeline-show-post-time",
      "x-timeline-show-metadata-separator",
      "x-timeline-show-grok-explain",
      "x-timeline-show-more",
      "x-timeline-show-translation-notice",
      "x-timeline-show-text",
      "x-timeline-show-image",
      "x-timeline-show-video",
      "x-timeline-show-media-description",
      "x-timeline-show-image-edit-button",
      "x-timeline-show-link-card",
      "x-timeline-show-carousel",
      "x-timeline-show-embedded-post",
      "x-timeline-show-reply",
      "x-timeline-show-repost",
      "x-timeline-show-like",
      "x-timeline-show-views",
      "x-timeline-show-bookmark",
      "x-timeline-show-share",
      "x-composer-show-area",
      "x-experimental-show-ad-posts",
      "x-experimental-show-reposted-posts",
      "x-experimental-show-posts-with-visible-media",
      "x-experimental-show-posts-without-visible-media",
      "x-experimental-show-first-visible-media-only",
      "x-experimental-square-crop-images",
      "x-experimental-small-square-images",
      "x-experimental-center-small-square-images",
      "x-experimental-image-gallery-view",
      "x-experimental-prefer-original-translation",
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

function customCssRule(siteId: SiteId): BrowserRule {
  return {
    id: `${siteId}-custom-css`,
    siteId,
    name: "カスタム CSS",
    description: "詳細 CSS タブで入力する追加 CSS です。プリセットの後に適用されます。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: "",
  };
}

const xSidebarItems = {
  area: `header[role="banner"]`,
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
  avatar: `article[data-testid="tweet"] div:has(> [data-testid="Tweet-User-Avatar"])`,
  displayName: `article[data-testid="tweet"] [data-testid="User-Name"] a:not([tabindex="-1"]):not(:has(time))`,
  verificationBadge: `article[data-testid="tweet"] [data-testid="User-Name"] div[dir="ltr"][class~="r-xoduu5"][class~="r-18u37iz"]:has([data-testid="icon-verified"]),
article[data-testid="tweet"] [data-testid="User-Name"] div[dir="ltr"][class~="r-xoduu5"][class~="r-18u37iz"]:has([aria-label="認証済みアカウント"]),
article[data-testid="tweet"] [data-testid="User-Name"] div[dir="ltr"][class~="r-xoduu5"][class~="r-18u37iz"]:has([aria-label="Verified account"])`,
  userId: `article[data-testid="tweet"] [data-testid="User-Name"] a[tabindex="-1"]`,
  postTime: `article[data-testid="tweet"] [data-testid="User-Name"] time`,
  metadataSeparator: `article[data-testid="tweet"] [data-testid="User-Name"] div:has(> a[tabindex="-1"]) + div[aria-hidden="true"],
article[data-testid="tweet"] [data-testid="User-Name"] div[aria-hidden="true"][class~="r-1q142lx"][class~="r-n7gxbd"]`,
  grokExplain: `article[data-testid="tweet"] button[aria-label*="Grok"],
article[data-testid="tweet"] [aria-label*="このポストを説明"],
article[data-testid="tweet"] [aria-label*="Explain this post"]`,
  more: `article[data-testid="tweet"] [data-testid="caret"]`,
  translationNotice: `article[data-testid="tweet"] div:has(> button[aria-label="原文を表示"]),
article[data-testid="tweet"] div:has(> button[aria-label="Show original"])`,
  text: `article[data-testid="tweet"] [data-testid="tweetText"],
article[data-testid="tweet"] [data-testid="tweet-text-show-more-link"]`,
  image: `article[data-testid="tweet"] div[aria-labelledby]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])):not(:has([data-testid="card.wrapper"])),
article[data-testid="tweet"] div[style*="max-width"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])):not(:has([data-testid="card.wrapper"])),
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"])`,
  video: `article[data-testid="tweet"] div[aria-labelledby]:has([data-testid="videoPlayer"]),
article[data-testid="tweet"] div[style*="max-width"]:has([data-testid="videoPlayer"]),
article[data-testid="tweet"] [data-testid="card.layoutLarge.media"]:has([data-testid="videoPlayer"]),
article[data-testid="tweet"] [data-testid="card.layoutSmall.media"]:has([data-testid="videoPlayer"]),
article[data-testid="tweet"] [data-testid="videoContainer"]`,
  mediaDescription: `article[data-testid="tweet"] [data-testid="altText"],
article[data-testid="tweet"] [data-testid="mediaDescription"],
article[data-testid="tweet"] [data-testid="tweetPhotoDescription"],
article[data-testid="tweet"] [aria-label="画像の説明を表示"],
article[data-testid="tweet"] [aria-label="画像の説明"],
article[data-testid="tweet"] [aria-label="View image description"],
article[data-testid="tweet"] [aria-label="Image description"],
article[data-testid="tweet"] [aria-label*="画像の説明"],
article[data-testid="tweet"] [aria-label*="代替テキスト"],
article[data-testid="tweet"] [aria-label*="image description" i],
article[data-testid="tweet"] [aria-label*="alt text" i],
[data-sns-browser-media-description-extra="true"]`,
  imageEditButton: `article[data-testid="tweet"] button[aria-label="画像を編集"],
article[data-testid="tweet"] button[aria-label="Edit image"],
article[data-testid="tweet"] button[aria-label*="画像を編集"],
article[data-testid="tweet"] button[aria-label*="Edit image" i],
article[data-testid="tweet"] [role="button"][aria-label="画像を編集"],
article[data-testid="tweet"] [role="button"][aria-label="Edit image"],
article[data-testid="tweet"] [role="button"][aria-label*="画像を編集"],
article[data-testid="tweet"] [role="button"][aria-label*="Edit image" i]`,
  linkCard: `article[data-testid="tweet"] [data-testid="card.wrapper"]`,
  carousel: `article[data-testid="tweet"] [role="group"][aria-roledescription="carousel"],
article[data-testid="tweet"] [data-testid="LayoutCardCarousel-slide"]`,
  embeddedPost: `article[data-testid="tweet"] div[role="link"]:has([data-testid="Tweet-User-Avatar"]):has([data-testid="User-Name"]),
article[data-testid="tweet"] div[role="link"][class~="r-adacv"][class~="r-1867qdf"]:has([data-testid="User-Name"])`,
  reply: `article[data-testid="tweet"] [data-testid="reply"]`,
  repost: `article[data-testid="tweet"] [data-testid="retweet"]`,
  like: `article[data-testid="tweet"] [data-testid="like"]`,
  views: `article[data-testid="tweet"] a[href$="/analytics"],
article[data-testid="tweet"] [aria-label*="ポストアナリティクス"]`,
  bookmark: `article[data-testid="tweet"] [data-testid="bookmark"]`,
  share: `article[data-testid="tweet"] button[aria-label="ポストを共有"],
article[data-testid="tweet"] [aria-label*="共有"]`,
} as const;

const xComposerArea = `[data-testid="primaryColumn"] div:has([data-testid^="tweetTextarea_"]):has([data-testid="toolBar"]):not(:has(article[data-testid="tweet"]))`;

const xRightSidebarItems = {
  area: `[data-testid="sidebarColumn"]`,
  search: `[data-testid="sidebarColumn"] form[role="search"],
[data-testid="sidebarColumn"] div:has(> form[role="search"])`,
  premium: `[data-testid="sidebarColumn"] aside[aria-label="プレミアムにサブスクライブ"],
[data-testid="sidebarColumn"] div[class~="r-1867qdf"]:has(> aside[aria-label="プレミアムにサブスクライブ"])`,
  news: `[data-testid="sidebarColumn"] div[class~="r-1867qdf"]:has([data-testid="news_sidebar"])`,
  discover: `[data-testid="sidebarColumn"] div[class~="r-1867qdf"]:has([aria-label="タイムライン: 速報"])`,
  users: `[data-testid="sidebarColumn"] aside[aria-label="おすすめユーザー"],
[data-testid="sidebarColumn"] div[class~="r-1867qdf"]:has(aside[aria-label="おすすめユーザー"])`,
} as const;

const xVisibleMediaPostItems = {
  has: `[data-testid="cellInnerDiv"][data-sns-browser-visible-media-cell="has"]`,
  none: `[data-testid="cellInnerDiv"][data-sns-browser-visible-media-cell="none"]`,
} as const;

const xRepostedPostItem = `[data-testid="cellInnerDiv"][data-sns-browser-reposted-cell="true"]`;

const xMediaDescriptionExtraMarkerScript = `
(() => {
  const cleanupKey = "xMediaDescriptionExtras";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  let pending = false;
  const markerAttribute = "data-sns-browser-media-description-extra";
  const sourcePattern = /^[\\w.-]+\\.[a-z]{2,}(?:\\.[a-z]{2,})?から$/i;
  const socialProofPattern = /さんと他[0-9０-９]+人がフォローしています$/;

  function clearMarks() {
    for (const element of document.querySelectorAll("[" + markerAttribute + '="true"]')) {
      element.removeAttribute(markerAttribute);
    }
  }

  function markExternalSourceRows() {
    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      for (const anchor of article.querySelectorAll('a[target="_blank"][rel~="nofollow"]')) {
        const text = anchor.textContent?.trim() ?? "";
        if (!sourcePattern.test(text)) continue;
        const row =
          anchor.closest('div[class~="r-1awozwy"][class~="r-1nao33i"][class~="r-18u37iz"]') ??
          anchor.closest("div");
        row?.setAttribute(markerAttribute, "true");
      }
    }
  }

  function markSocialProofRows() {
    for (const cell of document.querySelectorAll('[data-testid="primaryColumn"] [data-testid="cellInnerDiv"]')) {
      for (const element of cell.querySelectorAll("div[dir], span[dir], div, span")) {
        const text = element.textContent?.trim() ?? "";
        if (!socialProofPattern.test(text)) continue;
        const row =
          element.closest('div[class~="r-18u37iz"]:has(svg)') ??
          element.closest('div[class~="r-18u37iz"]') ??
          element.closest("div");
        row?.setAttribute(markerAttribute, "true");
      }
    }
  }

  function markExtras() {
    pending = false;
    clearMarks();
    markExternalSourceRows();
    markSocialProofRows();
  }

  function scheduleMark() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(markExtras);
  }

  const observer = new MutationObserver(scheduleMark);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  scheduleMark();

  registry[cleanupKey] = () => {
    observer.disconnect();
    clearMarks();
    delete registry[cleanupKey];
  };
})();
`.trim();

const xAdPostVisibilityBaseScript = `
(() => {
  const cleanupKey = "xExperimentalAdPosts";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  const style = document.createElement("style");
  style.dataset.snsBrowserRule = cleanupKey;
  style.textContent = [
    '[data-testid="cellInnerDiv"][data-sns-browser-ad-cell="true"] { display: none !important; }',
    'article[data-sns-browser-ad-post="true"] { display: none !important; }',
  ].join("\\n");
  document.documentElement.appendChild(style);

  const adLabels = new Set(["広告", "Promoted", "プロモーション"]);

  function hasAdLabel(article) {
    return [...article.querySelectorAll("span")].some((span) => {
      const text = span.textContent?.trim();
      if (!text || !adLabels.has(text)) return false;
      if (span.closest('[data-testid="tweetText"]')) return false;
      return true;
    });
  }

  function markAdPosts() {
    for (const cell of document.querySelectorAll('[data-sns-browser-ad-cell="true"]')) {
      cell.removeAttribute("data-sns-browser-ad-cell");
    }

    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      if (hasAdLabel(article)) {
        article.setAttribute("data-sns-browser-ad-post", "true");
        article.closest('[data-testid="cellInnerDiv"]')?.setAttribute("data-sns-browser-ad-cell", "true");
      } else {
        article.removeAttribute("data-sns-browser-ad-post");
      }
    }
  }

  const observer = new MutationObserver(markAdPosts);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  markAdPosts();

  registry[cleanupKey] = () => {
    observer.disconnect();
    style.remove();
    for (const article of document.querySelectorAll('article[data-sns-browser-ad-post="true"]')) {
      article.removeAttribute("data-sns-browser-ad-post");
    }
    for (const cell of document.querySelectorAll('[data-sns-browser-ad-cell="true"]')) {
      cell.removeAttribute("data-sns-browser-ad-cell");
    }
    delete registry[cleanupKey];
  };
})();
`.trim();

const xAdPostShowScript = `
(() => {
  const cleanup = window.__snsBrowserRuleCleanups?.xExperimentalAdPosts;
  if (typeof cleanup === "function") cleanup();
})();
`.trim();

const xRepostedPostVisibilityBaseScript = `
(() => {
  const cleanupKey = "xRepostedPosts";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  let pending = false;
  const articleAttribute = "data-sns-browser-reposted-post";
  const cellAttribute = "data-sns-browser-reposted-cell";
  const repostPatterns = [/リポスト/, /Reposted/i, /Retweeted/i];

  function clearMarks() {
    for (const article of document.querySelectorAll('article[data-testid="tweet"][' + articleAttribute + "]")) {
      article.removeAttribute(articleAttribute);
    }
    for (const cell of document.querySelectorAll('[data-testid="cellInnerDiv"][' + cellAttribute + '="true"]')) {
      cell.removeAttribute(cellAttribute);
    }
  }

  function hasRepostContext(article) {
    return [...article.querySelectorAll('[data-testid="socialContext"]')].some((element) => {
      const text = element.textContent?.trim() ?? "";
      return repostPatterns.some((pattern) => pattern.test(text));
    });
  }

  function markRepostedPosts() {
    pending = false;
    clearMarks();

    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      const cell = article.closest('[data-testid="cellInnerDiv"]');
      if (!cell) continue;
      if (!hasRepostContext(article)) continue;
      article.setAttribute(articleAttribute, "true");
      cell.setAttribute(cellAttribute, "true");
    }
  }

  function scheduleMark() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(markRepostedPosts);
  }

  const observer = new MutationObserver(scheduleMark);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  scheduleMark();

  registry[cleanupKey] = () => {
    observer.disconnect();
    clearMarks();
    delete registry[cleanupKey];
  };
})();
`.trim();

const xVisibleMediaPostVisibilityBaseScript = `
(() => {
  const cleanupKey = "xVisibleMediaPosts";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  let pending = false;
  const articleAttribute = "data-sns-browser-visible-media-post";
  const cellAttribute = "data-sns-browser-visible-media-cell";

  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    return element.getClientRects().length > 0;
  }

  function uniqueByContainment(elements) {
    const unique = [];
    for (const element of elements) {
      if (unique.includes(element)) continue;
      if (unique.some((existing) => existing.contains(element))) continue;
      for (let index = unique.length - 1; index >= 0; index -= 1) {
        if (element.contains(unique[index])) unique.splice(index, 1);
      }
      unique.push(element);
    }
    return unique;
  }

  function getMediaSlot(element) {
    return (
      element.closest('div[class~="r-1iusvr4"][class~="r-bnwqim"]') ??
      element.closest('li[role="listitem"]') ??
      element
    );
  }

  function collectMediaCandidates(article) {
    const candidates = [];

    for (const element of article.querySelectorAll('[data-testid="card.wrapper"]')) {
      candidates.push(element);
    }

    for (const element of article.querySelectorAll('[role="group"][aria-roledescription="carousel"]')) {
      if (element.closest('[data-testid="card.wrapper"]')) continue;
      candidates.push(element);
    }

    for (const element of article.querySelectorAll('a[href*="/photo/"]:has([data-testid="tweetPhoto"])')) {
      if (element.closest('[data-testid="card.wrapper"], [role="group"][aria-roledescription="carousel"]')) continue;
      candidates.push(getMediaSlot(element));
    }

    for (const element of article.querySelectorAll('[data-testid="videoContainer"], [data-testid="videoPlayer"]')) {
      if (element.closest('[data-testid="card.wrapper"], [role="group"][aria-roledescription="carousel"]')) continue;
      const mediaSlot = getMediaSlot(element);
      candidates.push(
        mediaSlot !== element
          ? mediaSlot
          : element.closest('[data-testid="videoContainer"]') ?? element.closest("div[aria-labelledby]") ?? element,
      );
    }

    return uniqueByContainment(candidates);
  }

  function clearMarks() {
    for (const article of document.querySelectorAll('article[data-testid="tweet"][' + articleAttribute + "]")) {
      article.removeAttribute(articleAttribute);
    }
    for (const cell of document.querySelectorAll('[data-testid="cellInnerDiv"][' + cellAttribute + "]")) {
      cell.removeAttribute(cellAttribute);
    }
  }

  function markPosts() {
    pending = false;
    clearMarks();

    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      const cell = article.closest('[data-testid="cellInnerDiv"]');
      if (!cell) continue;

      const state = collectMediaCandidates(article).some(isElementVisible) ? "has" : "none";
      article.setAttribute(articleAttribute, state);
      cell.setAttribute(cellAttribute, state);
    }
  }

  function scheduleMark() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(markPosts);
  }

  const observer = new MutationObserver(scheduleMark);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "data-testid", "data-sns-browser-extra-media"],
  });
  scheduleMark();

  registry[cleanupKey] = () => {
    observer.disconnect();
    clearMarks();
    delete registry[cleanupKey];
  };
})();
`.trim();

const xFirstVisibleMediaOnlyScript = `
(() => {
  const cleanupKey = "xFirstVisibleMediaOnly";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  const style = document.createElement("style");
  style.dataset.snsBrowserRule = cleanupKey;
  style.textContent = [
    '[data-sns-browser-extra-media="true"] { display: none !important; }',
    '[data-sns-browser-single-media-container="true"] { display: block !important; }',
    '[data-sns-browser-single-media-path="true"] { display: block !important; flex: 1 1 100% !important; width: 100% !important; max-width: none !important; }',
    '[data-sns-browser-single-media-container="true"] [data-sns-browser-kept-media="true"] { flex: 1 1 100% !important; width: 100% !important; max-width: none !important; }',
    '[data-sns-browser-single-media-container="true"] > div:has([data-sns-browser-kept-media="true"]) { flex: 1 1 100% !important; width: 100% !important; max-width: none !important; }',
  ].join("\\n");
  document.documentElement.appendChild(style);

  let pending = false;

  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    return element.getClientRects().length > 0;
  }

  function uniqueByContainment(elements) {
    const unique = [];
    for (const element of elements) {
      if (unique.includes(element)) continue;
      if (unique.some((existing) => existing.contains(element))) continue;
      for (let index = unique.length - 1; index >= 0; index -= 1) {
        if (element.contains(unique[index])) unique.splice(index, 1);
      }
      unique.push(element);
    }
    return unique.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      return 0;
    });
  }

  function getMediaSlot(element) {
    return (
      element.closest('div[class~="r-1iusvr4"][class~="r-bnwqim"]') ??
      element.closest('li[role="listitem"]') ??
      element
    );
  }

  function getPhotoTarget(anchor) {
    return getMediaSlot(anchor);
  }

  function getVideoTarget(element) {
    const mediaSlot = getMediaSlot(element);
    if (mediaSlot !== element) return mediaSlot;
    return element.closest('[data-testid="videoContainer"]') ?? element.closest("div[aria-labelledby]") ?? element;
  }

  function collectMediaCandidates(article) {
    const candidates = [];

    for (const element of article.querySelectorAll('[data-testid="card.wrapper"]')) {
      candidates.push(element);
    }

    for (const element of article.querySelectorAll('[role="group"][aria-roledescription="carousel"]')) {
      if (element.closest('[data-testid="card.wrapper"]')) continue;
      candidates.push(element);
    }

    for (const element of article.querySelectorAll('a[href*="/photo/"]:has([data-testid="tweetPhoto"])')) {
      if (element.closest('[data-testid="card.wrapper"], [role="group"][aria-roledescription="carousel"]')) continue;
      candidates.push(getPhotoTarget(element));
    }

    for (const element of article.querySelectorAll('[data-testid="videoContainer"], [data-testid="videoPlayer"]')) {
      if (element.closest('[data-testid="card.wrapper"], [role="group"][aria-roledescription="carousel"]')) continue;
      candidates.push(getVideoTarget(element));
    }

    return uniqueByContainment(candidates);
  }

  function getCommonAncestor(elements, boundary) {
    if (elements.length === 0) return null;
    const ancestors = [];
    let current = elements[0];
    while (current && current !== boundary && current !== document.body) {
      ancestors.push(current);
      current = current.parentElement;
    }

    for (const ancestor of ancestors) {
      if (elements.every((element) => ancestor.contains(element))) return ancestor;
    }

    return null;
  }

  function getPathBetween(descendant, ancestor) {
    const path = [];
    let current = descendant.parentElement;
    while (current && current !== ancestor) {
      path.push(current);
      current = current.parentElement;
    }
    return path;
  }

  function applyLimit() {
    pending = false;
    style.disabled = true;

    const nextHidden = new Set();
    const nextKept = new Set();
    const nextContainers = new Set();
    const nextPaths = new Set();
    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      const visibleMedia = collectMediaCandidates(article).filter(isElementVisible);
      if (visibleMedia.length > 1) {
        nextKept.add(visibleMedia[0]);
        const container = getCommonAncestor(visibleMedia, article);
        if (container) {
          nextContainers.add(container);
          for (const element of getPathBetween(visibleMedia[0], container)) {
            nextPaths.add(element);
          }
        }
      }
      for (const element of visibleMedia.slice(1)) {
        nextHidden.add(element);
      }
    }

    for (const element of document.querySelectorAll('[data-sns-browser-extra-media="true"]')) {
      if (!nextHidden.has(element)) element.removeAttribute("data-sns-browser-extra-media");
    }

    for (const element of nextHidden) {
      if (element.getAttribute("data-sns-browser-extra-media") !== "true") {
        element.setAttribute("data-sns-browser-extra-media", "true");
      }
    }

    for (const element of document.querySelectorAll('[data-sns-browser-kept-media="true"]')) {
      if (!nextKept.has(element)) element.removeAttribute("data-sns-browser-kept-media");
    }

    for (const element of nextKept) {
      if (element.getAttribute("data-sns-browser-kept-media") !== "true") {
        element.setAttribute("data-sns-browser-kept-media", "true");
      }
    }

    for (const element of document.querySelectorAll('[data-sns-browser-single-media-container="true"]')) {
      if (!nextContainers.has(element)) element.removeAttribute("data-sns-browser-single-media-container");
    }

    for (const element of nextContainers) {
      if (element.getAttribute("data-sns-browser-single-media-container") !== "true") {
        element.setAttribute("data-sns-browser-single-media-container", "true");
      }
    }

    for (const element of document.querySelectorAll('[data-sns-browser-single-media-path="true"]')) {
      if (!nextPaths.has(element)) element.removeAttribute("data-sns-browser-single-media-path");
    }

    for (const element of nextPaths) {
      if (element.getAttribute("data-sns-browser-single-media-path") !== "true") {
        element.setAttribute("data-sns-browser-single-media-path", "true");
      }
    }

    style.disabled = false;
  }

  function scheduleApply() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(applyLimit);
  }

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "style",
      "class",
      "data-testid",
      "data-sns-browser-extra-media",
      "data-sns-browser-kept-media",
      "data-sns-browser-single-media-container",
      "data-sns-browser-single-media-path",
    ],
  });
  scheduleApply();

  registry[cleanupKey] = () => {
    observer.disconnect();
    style.remove();
    for (const element of document.querySelectorAll('[data-sns-browser-extra-media="true"]')) {
      element.removeAttribute("data-sns-browser-extra-media");
    }
    for (const element of document.querySelectorAll('[data-sns-browser-kept-media="true"]')) {
      element.removeAttribute("data-sns-browser-kept-media");
    }
    for (const element of document.querySelectorAll('[data-sns-browser-single-media-container="true"]')) {
      element.removeAttribute("data-sns-browser-single-media-container");
    }
    for (const element of document.querySelectorAll('[data-sns-browser-single-media-path="true"]')) {
      element.removeAttribute("data-sns-browser-single-media-path");
    }
    delete registry[cleanupKey];
  };
})();
`.trim();

const xPreferOriginalTranslationScript = `
(() => {
  const cleanupKey = "xPreferOriginalTranslation";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  let disposed = false;
  let pending = false;
  const clickedButtons = new WeakSet();

  function isClickable(button) {
    if (!(button instanceof HTMLElement)) return false;
    if (button.disabled || clickedButtons.has(button)) return false;
    const style = window.getComputedStyle(button);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return button.getClientRects().length > 0;
  }

  function clickOriginalButtons() {
    pending = false;
    if (disposed) return;

    for (const button of document.querySelectorAll('article[data-testid="tweet"] button[aria-label="原文を表示"], article[data-testid="tweet"] button[aria-label="Show original"]')) {
      if (!isClickable(button)) continue;
      clickedButtons.add(button);
      button.click();
    }
  }

  function scheduleClick() {
    if (pending || disposed) return;
    pending = true;
    window.requestAnimationFrame(clickOriginalButtons);
  }

  const observer = new MutationObserver(scheduleClick);
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-label", "style", "class"],
  });
  scheduleClick();

  registry[cleanupKey] = () => {
    disposed = true;
    observer.disconnect();
    delete registry[cleanupKey];
  };
})();
`.trim();

const xImageGalleryViewScript = `
(() => {
  const cleanupKey = "xImageGalleryView";
  const registry = window.__snsBrowserRuleCleanups ?? {};
  window.__snsBrowserRuleCleanups = registry;

  if (typeof registry[cleanupKey] === "function") {
    registry[cleanupKey]();
  }

  let pending = false;
  let disposed = false;

  const style = document.createElement("style");
  style.dataset.snsBrowserRule = cleanupKey;
  style.textContent = [
    ".sns-browser-gallery-overlay { position: fixed; inset: 0; z-index: 2147483646; box-sizing: border-box; display: flex; flex-direction: column; background: rgba(0, 0, 0, 0.94); color: rgb(231, 233, 234); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
    ".sns-browser-gallery-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-bottom: 1px solid rgb(47, 51, 54); background: rgba(0, 0, 0, 0.96); }",
    ".sns-browser-gallery-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }",
    ".sns-browser-gallery-title strong { font-size: 15px; font-weight: 700; }",
    ".sns-browser-gallery-title span { color: rgb(113, 118, 123); font-size: 12px; }",
    ".sns-browser-gallery-actions { display: flex; align-items: center; gap: 8px; }",
    ".sns-browser-gallery-actions button { border: 1px solid rgb(83, 100, 113); border-radius: 999px; background: transparent; color: rgb(239, 243, 244); cursor: pointer; font: inherit; font-size: 12px; padding: 6px 10px; }",
    ".sns-browser-gallery-overlay, .sns-browser-gallery-overlay * { box-sizing: border-box; }",
    ".sns-browser-gallery-grid { box-sizing: border-box; column-gap: 14px; column-width: 220px; display: block; flex: 1 1 auto; overflow: auto; padding: 16px 16px 2px; }",
    ".sns-browser-gallery-card { border: 1px solid rgb(47, 51, 54); border-radius: 10px; background: rgb(0, 0, 0); break-inside: avoid; display: inline-flex; flex-direction: column; margin: 0 0 14px; min-width: 0; overflow: hidden; page-break-inside: avoid; position: relative; transform: none; vertical-align: top; width: 100%; }",
    ".sns-browser-gallery-meta { display: flex; align-items: center; flex: 0 0 auto; gap: 8px; min-width: 0; padding: 10px; position: static; }",
    ".sns-browser-gallery-avatar { width: 32px; height: 32px; flex: 0 0 32px; border-radius: 999px; background: rgb(32, 35, 39); object-fit: cover; }",
    ".sns-browser-gallery-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 700; }",
    ".sns-browser-gallery-image-button { aspect-ratio: 1 / 1; display: block; flex: 0 0 auto; width: 100%; height: auto !important; min-height: 0; max-height: none !important; padding: 0; border: 0; background: rgb(22, 24, 28); cursor: pointer; line-height: 0; overflow: hidden; position: relative; }",
    ".sns-browser-gallery-image-button::before { content: ''; display: block; padding-top: 100%; }",
    ".sns-browser-gallery-image { background: rgb(22, 24, 28); display: block !important; height: 100% !important; inset: 0 !important; max-height: none !important; max-width: none !important; min-height: 100% !important; min-width: 100% !important; object-fit: cover !important; object-position: center !important; position: absolute !important; width: 100% !important; }",
    ".sns-browser-gallery-footer { display: flex; align-items: center; flex: 0 0 auto; justify-content: flex-end; padding: 8px 10px 10px; position: static; }",
    ".sns-browser-gallery-like { border: 0; border-radius: 999px; background: transparent; color: rgb(113, 118, 123); cursor: pointer; font: inherit; font-size: 13px; padding: 6px 8px; }",
    ".sns-browser-gallery-like.is-liked { color: rgb(249, 24, 128); }",
    ".sns-browser-gallery-empty { grid-column: 1 / -1; color: rgb(113, 118, 123); padding: 24px; text-align: center; }",
  ].join("\\n");
  document.documentElement.appendChild(style);

  const overlay = document.createElement("section");
  overlay.className = "sns-browser-gallery-overlay";
  overlay.setAttribute("aria-label", "画像ギャラリービュー");
  overlay.innerHTML = [
    '<div class="sns-browser-gallery-header">',
    '<div class="sns-browser-gallery-title"><strong>画像ギャラリー</strong><span data-sns-browser-gallery-status>表示中DOMから画像付き投稿を抽出しています</span></div>',
    '<div class="sns-browser-gallery-actions"><button type="button" data-sns-browser-gallery-refresh>更新</button></div>',
    "</div>",
    '<div class="sns-browser-gallery-grid" data-sns-browser-gallery-grid></div>',
  ].join("");
  document.body.appendChild(overlay);

  const grid = overlay.querySelector("[data-sns-browser-gallery-grid]");
  const status = overlay.querySelector("[data-sns-browser-gallery-status]");
  overlay.querySelector("[data-sns-browser-gallery-refresh]")?.addEventListener("click", () => renderGallery());

  function isElementVisible(element) {
    if (!(element instanceof Element)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    return element.getClientRects().length > 0;
  }

  function extractBackgroundUrl(value) {
    const match = value.match(/url\\((['"]?)(.*?)\\1\\)/);
    return match?.[2] ?? "";
  }

  function getImageUrl(root) {
    const image = root.querySelector("img");
    if (image?.currentSrc || image?.src) return image.currentSrc || image.src;

    for (const element of root.querySelectorAll('[style*="background-image"]')) {
      const inlineUrl = extractBackgroundUrl(element.getAttribute("style") ?? "");
      if (inlineUrl) return inlineUrl;
      const computedUrl = extractBackgroundUrl(window.getComputedStyle(element).backgroundImage);
      if (computedUrl) return computedUrl;
    }

    const computedUrl = extractBackgroundUrl(window.getComputedStyle(root).backgroundImage);
    return computedUrl;
  }

  function getAvatarUrl(article) {
    const avatar = article.querySelector('[data-testid="Tweet-User-Avatar"]');
    return avatar ? getImageUrl(avatar) : "";
  }

  function getDisplayName(article) {
    const nameLink = article.querySelector('[data-testid="User-Name"] a:not([tabindex="-1"]):not(:has(time))');
    const text = nameLink?.textContent?.trim() || article.querySelector('[data-testid="User-Name"]')?.textContent?.trim() || "Unknown";
    return text.replace(/\\s+/g, " ");
  }

  function getTweetUrl(article, imageAnchor) {
    const timeLink = article.querySelector('a[href*="/status/"]:has(time)');
    const href = timeLink?.getAttribute("href") || imageAnchor?.getAttribute("href") || "";
    if (!href) return "";
    const absolute = new URL(href, window.location.href);
    absolute.pathname = absolute.pathname.replace(/\\/photo\\/\\d+$/, "");
    absolute.search = "";
    absolute.hash = "";
    return absolute.href;
  }

  function getLikeButton(article) {
    return article.querySelector('[data-testid="like"], [data-testid="unlike"]');
  }

  function isLiked(button) {
    const testId = button?.getAttribute("data-testid") ?? "";
    const label = button?.getAttribute("aria-label") ?? "";
    return testId === "unlike" || /いいねを取り消す|Unlike/i.test(label);
  }

  function collectItems() {
    const items = [];
    const seen = new Set();

    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      if (!isElementVisible(article)) continue;

      const imageAnchor = [...article.querySelectorAll('a[href*="/photo/"]:has([data-testid="tweetPhoto"])')].find(isElementVisible);
      if (!imageAnchor) continue;

      const photo = imageAnchor.querySelector('[data-testid="tweetPhoto"]');
      if (!photo || !isElementVisible(photo)) continue;

      const imageUrl = getImageUrl(photo);
      if (!imageUrl) continue;

      const tweetUrl = getTweetUrl(article, imageAnchor);
      const key = tweetUrl || imageUrl;
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        article,
        avatarUrl: getAvatarUrl(article),
        displayName: getDisplayName(article),
        imageUrl,
        likeButton: getLikeButton(article),
        tweetUrl,
      });
    }

    return items;
  }

  function renderGallery() {
    if (disposed || !grid) return;
    pending = false;

    const items = collectItems();
    grid.replaceChildren();
    if (status) {
      status.textContent = items.length
        ? "表示中DOMから " + items.length + " 件の画像付き投稿を表示しています"
        : "表示中DOMに画像付き投稿が見つかりません";
    }

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "sns-browser-gallery-empty";
      empty.textContent = "画像付き投稿が見つかりません。X側のタイムラインをスクロールしてから更新してください。";
      grid.appendChild(empty);
      return;
    }

    for (const item of items) {
      const card = document.createElement("article");
      card.className = "sns-browser-gallery-card";

      const meta = document.createElement("div");
      meta.className = "sns-browser-gallery-meta";

      const avatar = document.createElement("img");
      avatar.className = "sns-browser-gallery-avatar";
      avatar.alt = "";
      if (item.avatarUrl) avatar.src = item.avatarUrl;

      const name = document.createElement("div");
      name.className = "sns-browser-gallery-name";
      name.textContent = item.displayName;

      meta.append(avatar, name);

      const imageButton = document.createElement("button");
      imageButton.className = "sns-browser-gallery-image-button";
      imageButton.type = "button";
      imageButton.addEventListener("click", () => {
        if (item.tweetUrl) {
          window.location.href = item.tweetUrl;
          return;
        }
        item.article.scrollIntoView({ block: "center" });
      });

      const image = document.createElement("img");
      image.className = "sns-browser-gallery-image";
      image.alt = "";
      image.src = item.imageUrl;
      image.loading = "lazy";
      imageButton.appendChild(image);

      const footer = document.createElement("div");
      footer.className = "sns-browser-gallery-footer";

      const like = document.createElement("button");
      like.className = "sns-browser-gallery-like" + (isLiked(item.likeButton) ? " is-liked" : "");
      like.type = "button";
      like.textContent = isLiked(item.likeButton) ? "♥ いいね済み" : "♡ いいね";
      like.addEventListener("click", () => {
        item.likeButton?.click();
        window.setTimeout(() => scheduleRender(), 180);
      });
      footer.appendChild(like);

      card.append(meta, imageButton, footer);
      grid.appendChild(card);
    }
  }

  function scheduleRender() {
    if (pending || disposed) return;
    pending = true;
    window.requestAnimationFrame(renderGallery);
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.every((mutation) => overlay.contains(mutation.target))) return;
    scheduleRender();
  });
  observer.observe(document.body ?? document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-testid", "style", "class", "aria-label"],
  });

  scheduleRender();

  registry[cleanupKey] = () => {
    disposed = true;
    observer.disconnect();
    overlay.remove();
    style.remove();
    delete registry[cleanupKey];
  };
})();
`.trim();

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

function hideXRightSidebarItemCss(selector: string) {
  return `${selector} {
  display: none !important;
}`;
}

function hideXVisibleMediaPostCss(selector: string) {
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

function showXRightSidebarAreaCss(selector: string) {
  return `${selector} {
  display: flex !important;
}`;
}

function showXRightSidebarItemCss(selector: string) {
  return `${selector} {
  display: revert !important;
}`;
}

function showXVisibleMediaPostCss(selector: string) {
  return `${selector} {
  display: revert !important;
}`;
}

function squareCropXImagesCss() {
  return `article[data-testid="tweet"] div[aria-labelledby]:has([data-sns-browser-single-media-container="true"] [data-sns-browser-kept-media="true"] a[href*="/photo/"] [data-testid="tweetPhoto"]),
article[data-testid="tweet"] [data-sns-browser-single-media-container="true"]:has([data-sns-browser-kept-media="true"] a[href*="/photo/"] [data-testid="tweetPhoto"]) {
  aspect-ratio: 1 / 1 !important;
  height: auto !important;
  max-height: none !important;
  overflow: hidden !important;
  width: 100% !important;
}

article[data-testid="tweet"] div[aria-labelledby]:has([data-sns-browser-single-media-container="true"] [data-sns-browser-kept-media="true"] a[href*="/photo/"] [data-testid="tweetPhoto"]) > div,
article[data-testid="tweet"] [data-sns-browser-single-media-container="true"] > div,
article[data-testid="tweet"] [data-sns-browser-single-media-path="true"] {
  display: block !important;
  flex: 1 1 100% !important;
  height: 100% !important;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  width: 100% !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]) {
  aspect-ratio: 1 / 1 !important;
  display: block !important;
  height: 100% !important;
  max-height: none !important;
  max-width: none !important;
  overflow: hidden !important;
  width: 100% !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]),
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) {
  aspect-ratio: 1 / 1 !important;
  display: block !important;
  height: 100% !important;
  overflow: hidden !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]) > div,
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div {
  height: 100% !important;
  overflow: hidden !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]) > div > div:first-child,
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div:first-child {
  padding-bottom: 100% !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"] [data-testid="tweetPhoto"],
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] {
  height: 100% !important;
  overflow: hidden !important;
}

article[data-testid="tweet"] [data-sns-browser-kept-media="true"] [data-testid="tweetPhoto"] img,
article[data-testid="tweet"] [data-sns-browser-kept-media="true"] [data-testid="tweetPhoto"] [style*="background-image"],
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] img,
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] [style*="background-image"] {
  height: 100% !important;
  width: 100% !important;
  object-fit: cover !important;
  background-position: center !important;
  background-size: cover !important;
}`;
}

function smallSquareXImagesCss() {
  return `article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) {
  width: var(--sns-browser-small-square-media-size) !important;
  max-width: var(--sns-browser-small-square-media-size) !important;
}

article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div > div > div,
article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div > div > div > div,
article[data-testid="tweet"] div:has(> [data-sns-browser-single-media-container="true"]),
article[data-testid="tweet"] div:has(> div > [data-sns-browser-single-media-container="true"]) {
  aspect-ratio: 1 / 1 !important;
  display: block !important;
  flex: 0 0 var(--sns-browser-small-square-media-size) !important;
  height: var(--sns-browser-small-square-media-size) !important;
  max-height: var(--sns-browser-small-square-media-size) !important;
  max-width: var(--sns-browser-small-square-media-size) !important;
  min-height: 0 !important;
  min-width: 0 !important;
  overflow: hidden !important;
  width: var(--sns-browser-small-square-media-size) !important;
}

article[data-testid="tweet"] [data-sns-browser-single-media-container="true"],
article[data-testid="tweet"] [data-sns-browser-single-media-path="true"],
article[data-testid="tweet"] [data-sns-browser-kept-media="true"]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]),
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])),
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div,
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] {
  aspect-ratio: 1 / 1 !important;
  display: block !important;
  height: 100% !important;
  max-height: 100% !important;
  max-width: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  width: 100% !important;
}

article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div:first-child {
  padding-bottom: 100% !important;
}

article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] img,
article[data-testid="tweet"] a[href*="/photo/"]:has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) [data-testid="tweetPhoto"] [style*="background-image"] {
  height: 100% !important;
  width: 100% !important;
  object-fit: cover !important;
  background-position: center !important;
  background-size: cover !important;
}`;
}

function centerSmallSquareXImagesCss() {
  return `article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])),
article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div > div > div,
article[data-testid="tweet"] div[aria-labelledby]:has(a[href*="/photo/"] [data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) > div > div > div > div > div,
article[data-testid="tweet"] div:has(> [data-sns-browser-single-media-container="true"]),
article[data-testid="tweet"] div:has(> div > [data-sns-browser-single-media-container="true"]) {
  align-self: center !important;
  margin: 0 auto !important;
}`;
}

function wideFluidXLayoutCss() {
  return `html,
body,
#react-root {
  width: 100% !important;
}

:root {
  --sns-browser-left-sidebar-width: 260px;
  --sns-browser-right-sidebar-width: 360px;
}

main,
main > div,
main > div > div {
  max-width: none !important;
}

main {
  flex: 1 1 auto !important;
  margin-left: 0 !important;
  min-width: 0 !important;
  width: auto !important;
}

main > div {
  justify-content: space-between !important;
  width: 100% !important;
}

header[role="banner"],
header[role="banner"] > div,
header[role="banner"] > div > div {
  left: 0 !important;
  max-width: var(--sns-browser-left-sidebar-width) !important;
  width: var(--sns-browser-left-sidebar-width) !important;
}

header[role="banner"] {
  flex: 0 0 var(--sns-browser-left-sidebar-width) !important;
}

header[role="banner"] nav[role="navigation"],
header[role="banner"] nav[role="navigation"] > div,
header[role="banner"] h1,
header[role="banner"] a,
header[role="banner"] button {
  max-width: 100% !important;
}

header[role="banner"] nav[role="navigation"] {
  align-items: stretch !important;
}

main [data-testid="primaryColumn"] {
  flex: 1 1 auto !important;
  max-width: none !important;
  min-width: 0 !important;
  width: auto !important;
}

main [data-testid="primaryColumn"] > div,
main [data-testid="primaryColumn"] section,
main [data-testid="primaryColumn"] [aria-label^="タイムライン"],
main [data-testid="primaryColumn"] [aria-label^="Timeline"] {
  max-width: none !important;
  width: 100% !important;
}

main [data-testid="cellInnerDiv"],
main [data-testid="primaryColumn"] article[data-testid="tweet"] {
  max-width: none !important;
  width: 100% !important;
}

main [data-testid="sidebarColumn"] {
  flex: 0 0 var(--sns-browser-right-sidebar-width) !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  max-width: var(--sns-browser-right-sidebar-width) !important;
}

main [data-testid="sidebarColumn"] > div {
  margin-left: auto !important;
  margin-right: 0 !important;
}

@media (max-width: 1100px) {
  :root {
    --sns-browser-left-sidebar-width: 88px;
    --sns-browser-right-sidebar-width: 320px;
  }
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

function xRightSidebarShowRule(
  id: string,
  name: string,
  selector: string,
  enabled: boolean,
  description = "X の右サイドバー項目を表示します。OFF にすると非表示になります。",
  showCss = showXRightSidebarItemCss,
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
    content: showCss(selector),
  };
}

function xVisibleMediaPostShowRule(
  id: string,
  name: string,
  selector: string,
  description: string,
): BrowserRule {
  return {
    id,
    siteId: "x",
    name,
    description,
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: showXVisibleMediaPostCss(selector),
  };
}

const defaultRules: BrowserRule[] = [
  {
    id: "x-calm-layout",
    siteId: "x",
    name: "読み取り用の余白調整",
    description: "刺激の強い領域を控えめにし、投稿本文を読みやすくします。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `
/* X: calm layout */
[aria-label="Trending"],
[aria-label="Timeline: Trending now"] {
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
    id: "x-wide-fluid-layout",
    siteId: "x",
    name: "サイト全体: ウィンドウ幅を活用",
    description:
      "左サイドバーを左寄せ、右サイドバーを右寄せし、メインカラムとタイムラインを残り幅いっぱいに広げます。OFF にすると X 標準に近い中央寄せ幅へ戻ります。",
    enabled: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: wideFluidXLayoutCss(),
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
  xSidebarShowRule(
    "x-sidebar-show-area",
    "左サイドバー: 全体",
    xSidebarItems.area,
    true,
    "X の左サイドバー全体を表示します。OFF にすると左サイドバー全体を非表示にします。",
  ),
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
    id: "x-right-sidebar-visibility-base",
    siteId: "x",
    name: "X 右サイドバー表示制御の土台",
    description: "右サイドバーの全体と項目別 ON/OFF のために対象項目をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: Object.values(xRightSidebarItems).map(hideXRightSidebarItemCss).join("\n\n"),
  },
  xRightSidebarShowRule(
    "x-right-sidebar-show-area",
    "右サイドバー: 全体",
    xRightSidebarItems.area,
    true,
    "X の右サイドバー全体を表示します。OFF にすると右サイドバー全体を非表示にします。",
    showXRightSidebarAreaCss,
  ),
  xRightSidebarShowRule("x-right-sidebar-show-search", "右サイドバー: 検索", xRightSidebarItems.search, true),
  xRightSidebarShowRule(
    "x-right-sidebar-show-premium",
    "右サイドバー: プレミアムにサブスクライブ",
    xRightSidebarItems.premium,
    true,
  ),
  xRightSidebarShowRule("x-right-sidebar-show-news", "右サイドバー: 本日のニュース", xRightSidebarItems.news, true),
  xRightSidebarShowRule(
    "x-right-sidebar-show-discover",
    "右サイドバー: 「いま」を見つけよう",
    xRightSidebarItems.discover,
    true,
  ),
  xRightSidebarShowRule("x-right-sidebar-show-users", "右サイドバー: おすすめユーザー", xRightSidebarItems.users, true),
  {
    id: "x-timeline-media-description-extra-marker",
    siteId: "x",
    name: "X メディア説明文補助表示の判定",
    description: "リンクカードの出典行やフォロー文など、メディア周辺の補助表示を検出します。",
    enabled: true,
    visible: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xMediaDescriptionExtraMarkerScript,
  },
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
  xTimelineShowRule(
    "x-timeline-show-verification-badge",
    "タイムライン投稿: 認証バッジ",
    xTimelineItems.verificationBadge,
    true,
    "ユーザー名に付く認証バッジや、同じアイコン枠に連なる所属・企業系アイコンを表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule("x-timeline-show-user-id", "タイムライン投稿: ユーザーID", xTimelineItems.userId, false),
  xTimelineShowRule("x-timeline-show-post-time", "タイムライン投稿: 投稿日時", xTimelineItems.postTime, true),
  xTimelineShowRule(
    "x-timeline-show-metadata-separator",
    "タイムライン投稿: 区切り記号",
    xTimelineItems.metadataSeparator,
    false,
    "ユーザーIDと投稿日などの間に表示される「·」を表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-grok-explain",
    "タイムライン投稿: このポストを説明する Grok アイコン",
    xTimelineItems.grokExplain,
    false,
  ),
  xTimelineShowRule("x-timeline-show-more", "タイムライン投稿: もっと見る", xTimelineItems.more, true),
  xTimelineShowRule(
    "x-timeline-show-translation-notice",
    "タイムライン投稿: 翻訳表示",
    xTimelineItems.translationNotice,
    true,
    "Grok アイコン、翻訳元言語、「原文を表示」ボタンを含む翻訳表示行を表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule("x-timeline-show-text", "タイムライン投稿: 本文", xTimelineItems.text, true),
  xTimelineShowRule(
    "x-timeline-show-image",
    "タイムライン投稿: 画像",
    xTimelineItems.image,
    true,
    "通常の投稿添付画像を表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-video",
    "タイムライン投稿: 動画",
    xTimelineItems.video,
    true,
    "動画プレイヤーを表示します。OFF にすると非表示になります。外部カード内の動画にも影響する場合があります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-media-description",
    "タイムライン投稿: メディア説明文",
    xTimelineItems.mediaDescription,
    true,
    "画像の ALT など、メディア下部やメディア上に表示される説明文・説明表示ボタンを表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-image-edit-button",
    "タイムライン投稿: 画像を編集",
    xTimelineItems.imageEditButton,
    true,
    "画像にホバーした時に表示される「画像を編集」ボタンを表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-link-card",
    "タイムライン投稿: 外部リンクカード",
    xTimelineItems.linkCard,
    true,
    "外部リンクのカード表示を表示します。OFF にするとカード全体を非表示にします。",
  ),
  xTimelineShowRule(
    "x-timeline-show-carousel",
    "タイムライン投稿: カルーセル",
    xTimelineItems.carousel,
    true,
    "横スクロールのカルーセル表示を表示します。OFF にすると非表示になります。",
  ),
  xTimelineShowRule(
    "x-timeline-show-embedded-post",
    "タイムライン投稿: 引用・埋め込みポスト",
    xTimelineItems.embeddedPost,
    true,
    "引用リポストや、投稿内に埋め込まれた過去ポストのカードを表示します。OFF にすると非表示になります。",
  ),
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
    id: "x-experimental-ad-post-visibility-base",
    siteId: "x",
    name: "X 広告投稿表示制御の土台",
    description: "広告ラベル付き投稿の ON/OFF のために対象投稿を検出していったん非表示にします。",
    enabled: true,
    visible: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xAdPostVisibilityBaseScript,
  },
  {
    id: "x-experimental-visible-media-post-marker",
    siteId: "x",
    name: "X 表示メディア有無による投稿表示制御の判定",
    description: "表示中メディアの有無で投稿を分類し、実験的表示制御のための属性を付けます。",
    enabled: true,
    visible: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xVisibleMediaPostVisibilityBaseScript,
  },
  {
    id: "x-experimental-reposted-post-marker",
    siteId: "x",
    name: "X リポスト投稿表示制御の判定",
    description: "リポスト由来の投稿を検出し、実験的表示制御のための属性を付けます。",
    enabled: true,
    visible: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xRepostedPostVisibilityBaseScript,
  },
  {
    id: "x-experimental-visible-media-post-visibility-base",
    siteId: "x",
    name: "X 表示メディア有無による投稿表示制御の土台",
    description: "表示メディアあり・なし投稿の ON/OFF のために分類済み投稿をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: Object.values(xVisibleMediaPostItems).map(hideXVisibleMediaPostCss).join("\n\n"),
  },
  {
    id: "x-experimental-reposted-post-visibility-base",
    siteId: "x",
    name: "X リポスト投稿表示制御の土台",
    description: "リポスト由来投稿の ON/OFF のために検出済み投稿をいったん非表示にします。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-start",
    builtin: true,
    content: hideXVisibleMediaPostCss(xRepostedPostItem),
  },
  {
    id: "x-experimental-show-ad-posts",
    siteId: "x",
    name: "実験的機能: 広告投稿",
    description:
      "X の広告ラベル付き投稿を表示します。OFF にすると、タイムライン内で広告として表示されている投稿を非表示にします。",
    enabled: true,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xAdPostShowScript,
  },
  {
    id: "x-experimental-show-reposted-posts",
    siteId: "x",
    name: "実験的機能: リポスト投稿",
    description:
      "タイムライン内で「さんがリポスト」などの social context が付いたリポスト由来の投稿を表示します。OFF にするとセルごと非表示になります。",
    enabled: true,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: showXVisibleMediaPostCss(xRepostedPostItem),
  },
  xVisibleMediaPostShowRule(
    "x-experimental-show-posts-with-visible-media",
    "実験的機能: 表示メディアあり投稿",
    xVisibleMediaPostItems.has,
    "画像、動画、外部カード、カルーセルなど、現在の CSS 設定込みで表示中のメディアがある投稿を表示します。OFF にすると非表示になります。",
  ),
  xVisibleMediaPostShowRule(
    "x-experimental-show-posts-without-visible-media",
    "実験的機能: 表示メディアなし投稿",
    xVisibleMediaPostItems.none,
    "現在の CSS 設定込みで表示中のメディアがない投稿を表示します。OFF にすると非表示になります。",
  ),
  {
    id: "x-experimental-show-first-visible-media-only",
    siteId: "x",
    name: "実験的機能: 表示メディアは1つ目だけ",
    description:
      "1つの投稿に複数メディアがある場合、CSS 設定後に実際に表示されている先頭メディアだけを残します。動画を OFF にしている場合は、次に見える画像などが先頭扱いになります。",
    enabled: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xFirstVisibleMediaOnlyScript,
  },
  {
    id: "x-experimental-square-crop-images",
    siteId: "x",
    name: "実験的機能: 画像を正方形にトリミング",
    description:
      "タイムライン内の通常画像を正方形エリアにトリミング表示します。動画は対象外です。複数メディアを1枚だけ見たい場合は「表示メディアは1つ目だけ」と併用してください。",
    enabled: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: squareCropXImagesCss(),
  },
  {
    id: "x-experimental-small-square-image-size",
    siteId: "x",
    name: "実験的機能: 小さな正方形画像サイズ",
    description: "小さな正方形画像のサイズ指定です。",
    enabled: true,
    visible: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: `:root {
  --sns-browser-small-square-media-size: 96px;
}`,
  },
  {
    id: "x-experimental-small-square-images",
    siteId: "x",
    name: "実験的機能: 画像を小さな正方形で表示",
    description:
      "タイムライン内の通常画像を 96px の小さな正方形として表示します。動画は対象外です。複数メディアの1枚表示と併用した場合は、検出済みの単一メディア親階層にも同じサイズを適用します。",
    enabled: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: smallSquareXImagesCss(),
  },
  {
    id: "x-experimental-center-small-square-images",
    siteId: "x",
    name: "実験的機能: 小さな正方形画像を中央揃え",
    description:
      "小さな正方形で表示したタイムライン画像を中央揃えにします。画像を小さな正方形で表示する機能と併用してください。",
    enabled: false,
    type: "css",
    runAt: "document-end",
    builtin: true,
    content: centerSmallSquareXImagesCss(),
  },
  {
    id: "x-experimental-image-gallery-view",
    siteId: "x",
    name: "実験的機能: 画像ギャラリービュー",
    description:
      "表示中DOMから画像付き投稿だけを拾い、アバター、ユーザー名、先頭画像、いいね操作に絞った別レイヤーのグリッド表示を作ります。X側をスクロールした後は更新ボタンで再抽出できます。",
    enabled: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xImageGalleryViewScript,
  },
  {
    id: "x-experimental-prefer-original-translation",
    siteId: "x",
    name: "実験的機能: 翻訳投稿は原文を表示",
    description:
      "翻訳済み投稿に表示される「原文を表示」ボタンを自動で押し、原文表示を優先します。OFF にしても、すでに原文へ切り替えた投稿は自動では翻訳表示に戻りません。",
    enabled: false,
    type: "script",
    runAt: "document-end",
    builtin: true,
    content: xPreferOriginalTranslationScript,
  },
  customCssRule("x"),
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
  customCssRule("threads"),
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
  customCssRule("mixi2"),
];
