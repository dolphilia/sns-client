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
]);

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
        content: defaultRule.visible === false ? defaultRule.content : savedRule.content,
      };
    }),
    ...activeSavedRules.filter((rule) => !defaultIds.has(rule.id)),
  ];
}

export async function saveRules(siteId: SiteId, rules: BrowserRule[]) {
  await writeJsonFile(getRulesPath(siteId), rules);
}
