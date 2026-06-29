import type { AppSettings, SiteId } from "./types";

export const fallbackSettings: AppSettings = {
  activeSiteId: "x",
  advancedMode: false,
  openExternalLinksInDefaultBrowser: true,
  rememberLastUrl: true,
};

export const siteColors: Record<SiteId, string> = {
  x: "#111111",
  threads: "#5f5f5f",
  mixi2: "#ff7d5f",
};
