import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicSites } from "./site-registry.js";
import { loadRules, loadSettings, saveRules, saveSettings } from "./storage.js";
import type { AppSettings, BrowserRule, SiteId, ViewBounds } from "./types.js";
import { ViewManager } from "./view-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const appName = "SNS Browser Lab";

let viewManager: ViewManager | null = null;

function getViewManager() {
  if (!viewManager) throw new Error("View manager is not ready.");
  return viewManager;
}

function createWindow(initialSiteId: SiteId) {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    title: appName,
    backgroundColor: "#f7f7f5",
    webPreferences: {
      preload: path.join(__dirname, "preload/app-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  viewManager = new ViewManager(win, initialSiteId);
  viewManager.onStateChanged((state) => {
    win.webContents.send("browser:stateChanged", state);
  });

  if (isDev) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function registerIpcHandlers() {
  ipcMain.handle("sites:list", () => getPublicSites());
  ipcMain.handle("settings:get", () => loadSettings());
  ipcMain.handle("settings:save", (_event, settings: AppSettings) => saveSettings(settings));
  ipcMain.handle("rules:get", (_event, siteId: SiteId) => loadRules(siteId));
  ipcMain.handle("rules:save", async (_event, siteId: SiteId, rules: BrowserRule[]) => {
    await saveRules(siteId, rules);
    if (getViewManager().getState().activeSiteId === siteId) {
      await getViewManager().applyRules();
    }
  });

  ipcMain.handle("browser:setActiveSite", (_event, siteId: SiteId) =>
    getViewManager().setActiveSite(siteId),
  );
  ipcMain.handle("browser:setViewBounds", (_event, bounds: ViewBounds) => {
    getViewManager().setBounds(bounds);
  });
  ipcMain.handle("browser:getState", () => getViewManager().getState());
  ipcMain.handle("browser:goBack", () => getViewManager().goBack());
  ipcMain.handle("browser:goForward", () => getViewManager().goForward());
  ipcMain.handle("browser:reload", () => getViewManager().reload());
  ipcMain.handle("browser:loadHome", () => getViewManager().loadHome());
  ipcMain.handle("browser:applyRules", () => getViewManager().applyRules());
  ipcMain.handle("browser:openExternal", (_event, url: string) => shell.openExternal(url));
}

app.whenReady().then(async () => {
  app.setName(appName);
  registerIpcHandlers();
  const settings = await loadSettings();
  createWindow(settings.activeSiteId);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void loadSettings().then((currentSettings) => createWindow(currentSettings.activeSiteId));
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
