import { shell } from "electron";
import type { SiteDefinition } from "./types.js";

export function isAllowedUrl(url: string, site: SiteDefinition) {
  if (url === "about:blank") return true;

  try {
    const parsed = new URL(url);
    return site.allowedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
}

export function handleExternalUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    void shell.openExternal(url);
  }
}
