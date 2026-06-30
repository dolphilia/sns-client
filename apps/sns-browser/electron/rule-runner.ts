import type { WebContents } from "electron";
import type { BrowserRule } from "./types.js";

const cleanupScript = `
(() => {
  const registry = window.__snsBrowserRuleCleanups;
  if (!registry || typeof registry !== "object") return;

  for (const cleanup of Object.values(registry)) {
    if (typeof cleanup !== "function") continue;
    try {
      cleanup();
    } catch {
      // Ignore cleanup errors from stale page contexts.
    }
  }

  window.__snsBrowserRuleCleanups = {};
})();
`.trim();

export class RuleRunner {
  private cssKeys = new Map<string, string>();

  async apply(webContents: WebContents, rules: BrowserRule[]) {
    await this.clear(webContents);

    const cssRules = rules.filter((rule) => rule.enabled && rule.type === "css");
    for (const rule of cssRules) {
      const key = await webContents.insertCSS(rule.content, { cssOrigin: "user" });
      this.cssKeys.set(rule.id, key);
    }

    const scriptRules = rules.filter((rule) => rule.enabled && rule.type === "script");
    for (const rule of scriptRules) {
      await webContents.executeJavaScript(rule.content, true);
    }
  }

  async clear(webContents: WebContents) {
    await webContents.executeJavaScript(cleanupScript, true).catch(() => undefined);

    const keys = [...this.cssKeys.values()];
    this.cssKeys.clear();

    await Promise.allSettled(keys.map((key) => webContents.removeInsertedCSS(key)));
  }
}
