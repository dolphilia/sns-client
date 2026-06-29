import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const appName = "SNS Client";
const storageDirName = "local-store";
const credentialsDirName = "secure-store";
const bskySessionFileName = "bsky-session.json";

interface EncryptedCredentialFile {
  version: 1;
  kind: "bsky-session";
  encrypted: string;
}

function getStorageDir() {
  return path.join(app.getPath("userData"), storageDirName);
}

function getStorageFilePath(key: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
    throw new Error("Invalid storage key.");
  }
  return path.join(getStorageDir(), `${key}.json`);
}

function getCredentialsDir() {
  return path.join(app.getPath("userData"), credentialsDirName);
}

function getBskySessionFilePath() {
  return path.join(getCredentialsDir(), bskySessionFileName);
}

function registerStorageHandlers() {
  ipcMain.handle("storage:getItem", async (_event, key: string) => {
    try {
      return await fs.readFile(getStorageFilePath(key), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  });

  ipcMain.handle("storage:setItem", async (_event, key: string, value: string) => {
    await fs.mkdir(getStorageDir(), { recursive: true });
    await fs.writeFile(getStorageFilePath(key), value, "utf8");
  });

  ipcMain.handle("storage:removeItem", async (_event, key: string) => {
    await fs.rm(getStorageFilePath(key), { force: true });
  });

  ipcMain.handle("storage:getDirectory", () => getStorageDir());
}

function registerCredentialHandlers() {
  ipcMain.handle("credentials:getBskySession", async () => {
    try {
      const raw = await fs.readFile(getBskySessionFilePath(), "utf8");
      const credential = JSON.parse(raw) as EncryptedCredentialFile;
      if (credential.version !== 1 || credential.kind !== "bsky-session") return null;
      return safeStorage.decryptString(Buffer.from(credential.encrypted, "base64"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  });

  ipcMain.handle("credentials:setBskySession", async (_event, sessionJson: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Safe storage encryption is not available.");
    }
    const encrypted = safeStorage.encryptString(sessionJson).toString("base64");
    const credential: EncryptedCredentialFile = {
      version: 1,
      kind: "bsky-session",
      encrypted,
    };
    await fs.mkdir(getCredentialsDir(), { recursive: true });
    await fs.writeFile(getBskySessionFilePath(), JSON.stringify(credential, null, 2), "utf8");
  });

  ipcMain.handle("credentials:deleteBskySession", async () => {
    await fs.rm(getBskySessionFilePath(), { force: true });
  });

  ipcMain.handle("credentials:getStatus", () => ({
    available: safeStorage.isEncryptionAvailable(),
    backend: process.platform === "linux" ? safeStorage.getSelectedStorageBackend() : null,
  }));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    title: appName,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  app.setName(appName);
  registerStorageHandlers();
  registerCredentialHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
