import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { defaultSettings, getDefaultRules } from "./site-registry.js";
import type { AppSettings, BrowserRule, SiteId } from "./types.js";

const storageDirName = "sns-browser";

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
  return (await readJsonFile<BrowserRule[]>(getRulesPath(siteId))) ?? getDefaultRules(siteId);
}

export async function saveRules(siteId: SiteId, rules: BrowserRule[]) {
  await writeJsonFile(getRulesPath(siteId), rules);
}
