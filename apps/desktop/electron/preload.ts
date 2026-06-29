import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  storage: {
    getItem: (key: string) => ipcRenderer.invoke("storage:getItem", key) as Promise<string | null>,
    setItem: (key: string, value: string) =>
      ipcRenderer.invoke("storage:setItem", key, value) as Promise<void>,
    removeItem: (key: string) =>
      ipcRenderer.invoke("storage:removeItem", key) as Promise<void>,
    getDirectory: () => ipcRenderer.invoke("storage:getDirectory") as Promise<string>,
  },
  credentials: {
    getBskySession: () =>
      ipcRenderer.invoke("credentials:getBskySession") as Promise<string | null>,
    setBskySession: (sessionJson: string) =>
      ipcRenderer.invoke("credentials:setBskySession", sessionJson) as Promise<void>,
    deleteBskySession: () =>
      ipcRenderer.invoke("credentials:deleteBskySession") as Promise<void>,
    getStatus: () =>
      ipcRenderer.invoke("credentials:getStatus") as Promise<{
        available: boolean;
        backend: string | null;
      }>,
  },
});
