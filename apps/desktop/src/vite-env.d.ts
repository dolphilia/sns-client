/// <reference types="vite/client" />

interface DesktopStorageApi {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getDirectory: () => Promise<string>;
}

interface DesktopCredentialsApi {
  getBskySession: () => Promise<string | null>;
  setBskySession: (sessionJson: string) => Promise<void>;
  deleteBskySession: () => Promise<void>;
  getStatus: () => Promise<{
    available: boolean;
    backend: string | null;
  }>;
}

interface Window {
  desktop?: {
    platform: string;
    storage?: DesktopStorageApi;
    credentials?: DesktopCredentialsApi;
  };
}
