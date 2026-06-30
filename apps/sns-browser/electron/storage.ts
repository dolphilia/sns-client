import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { defaultSettings, getDefaultRules } from "./site-registry.js";
import type { AppSettings, BrowserRule, SiteId } from "./types.js";

const storageDirName = "sns-browser";
const obsoleteRuleIds = new Set([
  "x-composer-show-avatar",
  "x-composer-show-audience",
  "x-composer-show-reply-permission",
  "x-composer-show-media",
  "x-composer-show-gif",
  "x-composer-show-image-generation",
  "x-composer-show-poll",
  "x-composer-show-emoji",
  "x-composer-show-schedule",
  "x-composer-show-location",
  "x-composer-show-content-disclosure",
  "x-timeline-show-media",
  "x-timeline-card-grid-layout",
]);
const useDefaultContentRuleIds = new Set([
  "x-calm-layout",
  "x-wide-fluid-layout",
  "x-composer-show-area",
  "x-sidebar-show-area",
  "x-right-sidebar-show-area",
  "x-right-sidebar-show-search",
  "x-right-sidebar-show-premium",
  "x-right-sidebar-show-news",
  "x-right-sidebar-show-discover",
  "x-right-sidebar-show-users",
  "x-experimental-ad-post-visibility-base",
  "x-experimental-show-ad-posts",
  "x-experimental-visible-media-post-marker",
  "x-experimental-visible-media-post-visibility-base",
  "x-experimental-reposted-post-marker",
  "x-experimental-reposted-post-visibility-base",
  "x-experimental-show-reposted-posts",
  "x-experimental-show-posts-with-visible-media",
  "x-experimental-show-posts-without-visible-media",
  "x-experimental-show-first-visible-media-only",
  "x-experimental-square-crop-images",
  "x-experimental-small-square-images",
  "x-experimental-center-small-square-images",
  "x-experimental-image-gallery-view",
  "x-experimental-prefer-original-translation",
  "x-timeline-media-description-extra-marker",
  "x-timeline-show-avatar",
  "x-timeline-show-embedded-post",
  "x-timeline-show-image",
  "x-timeline-show-video",
  "x-timeline-show-media-description",
  "x-timeline-show-link-card",
  "x-timeline-show-carousel",
  "x-timeline-show-metadata-separator",
  "x-timeline-show-translation-notice",
  "x-timeline-show-verification-badge",
]);
const customCssRuleIds = new Set(["x-custom-css", "threads-custom-css", "mixi2-custom-css"]);
const userContentRuleIds = new Set([...customCssRuleIds, "x-experimental-small-square-image-size"]);

function getStorageDir() {
  return path.join(app.getPath("userData"), storageDirName);
}

function getRulesDir() {
  return path.join(getStorageDir(), "rules");
}

function getSettingsPath() {
  return path.join(getStorageDir(), "settings.json");
}

function getRulesPath(siteId: SiteId) {
  return path.join(getRulesDir(), `${siteId}.json`);
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function loadSettings(): Promise<AppSettings> {
  const saved = await readJsonFile<Partial<AppSettings>>(getSettingsPath());
  return {
    ...defaultSettings,
    ...saved,
  };
}

export async function saveSettings(settings: AppSettings) {
  await writeJsonFile(getSettingsPath(), settings);
}

export async function loadRules(siteId: SiteId): Promise<BrowserRule[]> {
  const defaults = getDefaultRules(siteId);
  const saved = await readJsonFile<BrowserRule[]>(getRulesPath(siteId));
  if (!saved) return defaults;

  const activeSavedRules = saved.filter((rule) => !obsoleteRuleIds.has(rule.id));
  const savedById = new Map(activeSavedRules.map((rule) => [rule.id, rule]));
  const defaultIds = new Set(defaults.map((rule) => rule.id));

  return [
    ...defaults.map((defaultRule) => {
      const savedRule = savedById.get(defaultRule.id);
      if (!savedRule) return defaultRule;

      return {
        ...defaultRule,
        ...savedRule,
        siteId: defaultRule.siteId,
        type: defaultRule.type,
        runAt: defaultRule.runAt,
        builtin: defaultRule.builtin,
        visible: defaultRule.visible,
        content:
          (defaultRule.visible === false && !userContentRuleIds.has(defaultRule.id)) ||
          useDefaultContentRuleIds.has(defaultRule.id)
            ? defaultRule.content
            : savedRule.content,
      };
    }),
    ...activeSavedRules.filter((rule) => !defaultIds.has(rule.id)),
  ];
}

export async function saveRules(siteId: SiteId, rules: BrowserRule[]) {
  await writeJsonFile(getRulesPath(siteId), rules);
}
