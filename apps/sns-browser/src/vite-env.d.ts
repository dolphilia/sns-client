/// <reference types="vite/client" />

import type { AppSettings, BrowserRule, BrowserState, SiteId, ViewBounds } from "./lib/types";

declare global {
  interface Window {
    snsBrowser: {
      platform: string;
      getSites: () => Promise<
        Array<{
          id: SiteId;
          label: string;
          homeUrl: string;
        }>
      >;
      getRules: (siteId: SiteId) => Promise<BrowserRule[]>;
      saveRules: (siteId: SiteId, rules: BrowserRule[]) => Promise<void>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<void>;
      setActiveSite: (siteId: SiteId) => Promise<BrowserState>;
      setViewBounds: (bounds: ViewBounds) => Promise<void>;
      getBrowserState: () => Promise<BrowserState>;
      goBack: () => Promise<void>;
      goForward: () => Promise<void>;
      reload: () => Promise<void>;
      loadHome: () => Promise<void>;
      applyRules: (rules?: BrowserRule[]) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onBrowserStateChanged: (listener: (state: BrowserState) => void) => () => void;
    };
  }
}
