import type { BrowserRule, SiteDefinition, SiteId } from "./types.js";

export const siteDefinitions: Record<SiteId, SiteDefinition> = {
  x: {
    id: "x",
    label: "X",
    homeUrl: "https://x.com/home",
    allowedOrigins: ["https://x.com", "https://twitter.com"],
    externalLinkPolicy: "open-external",
    defaultRuleIds: ["x-calm-layout", "x-hide-metrics"],
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
