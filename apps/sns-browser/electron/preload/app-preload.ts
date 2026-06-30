import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, BrowserRule, BrowserState, SiteId, ViewBounds } from "../types.js";

contextBridge.exposeInMainWorld("snsBrowser", {
  platform: process.platform,
  getSites: () => ipcRenderer.invoke("sites:list"),
  getRules: (siteId: SiteId) => ipcRenderer.invoke("rules:get", siteId) as Promise<BrowserRule[]>,
  saveRules: (siteId: SiteId, rules: BrowserRule[]) =>
    ipcRenderer.invoke("rules:save", siteId, rules) as Promise<void>,
  getSettings: () => ipcRenderer.invoke("settings:get") as Promise<AppSettings>,
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("settings:save", settings) as Promise<void>,
  setActiveSite: (siteId: SiteId) =>
    ipcRenderer.invoke("browser:setActiveSite", siteId) as Promise<BrowserState>,
  setViewBounds: (bounds: ViewBounds) =>
    ipcRenderer.invoke("browser:setViewBounds", bounds) as Promise<void>,
  getBrowserState: () => ipcRenderer.invoke("browser:getState") as Promise<BrowserState>,
  goBack: () => ipcRenderer.invoke("browser:goBack") as Promise<void>,
  goForward: () => ipcRenderer.invoke("browser:goForward") as Promise<void>,
  reload: () => ipcRenderer.invoke("browser:reload") as Promise<void>,
  loadHome: () => ipcRenderer.invoke("browser:loadHome") as Promise<void>,
  applyRules: (rules?: BrowserRule[]) => ipcRenderer.invoke("browser:applyRules", rules) as Promise<void>,
  openExternal: (url: string) => ipcRenderer.invoke("browser:openExternal", url) as Promise<void>,
  onBrowserStateChanged: (listener: (state: BrowserState) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, state: BrowserState) => listener(state);
    ipcRenderer.on("browser:stateChanged", wrapped);
    return () => ipcRenderer.removeListener("browser:stateChanged", wrapped);
  },
});
