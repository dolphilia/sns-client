export type SiteId = "x" | "threads" | "mixi2";

export interface SiteDefinition {
  id: SiteId;
  label: string;
  homeUrl: string;
  allowedOrigins: string[];
  externalLinkPolicy: "open-external" | "confirm";
  defaultRuleIds: string[];
}

export interface BrowserRule {
  id: string;
  siteId: SiteId;
  name: string;
  description?: string;
  enabled: boolean;
  visible?: boolean;
  type: "css" | "script";
  runAt: "document-start" | "document-end" | "document-idle";
  content: string;
  builtin: boolean;
}

export interface AppSettings {
  activeSiteId: SiteId;
  advancedMode: boolean;
  openExternalLinksInDefaultBrowser: boolean;
  rememberLastUrl: boolean;
}

export interface BrowserState {
  activeSiteId: SiteId;
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
