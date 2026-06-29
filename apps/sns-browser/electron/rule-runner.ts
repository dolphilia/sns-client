import type { WebContents } from "electron";
import type { BrowserRule } from "./types.js";

export class RuleRunner {
  private cssKeys = new Map<string, string>();

  async apply(webContents: WebContents, rules: BrowserRule[]) {
    await this.clear(webContents);

    const cssRules = rules.filter((rule) => rule.enabled && rule.type === "css");
    for (const rule of cssRules) {
      const key = await webContents.insertCSS(rule.content, { cssOrigin: "user" });
      this.cssKeys.set(rule.id, key);
    }
  }

  async clear(webContents: WebContents) {
    const keys = [...this.cssKeys.values()];
    this.cssKeys.clear();

    await Promise.allSettled(keys.map((key) => webContents.removeInsertedCSS(key)));
  }
}
