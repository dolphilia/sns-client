import type { StateStorage } from "zustand/middleware";

export function createDesktopFileStorage(): StateStorage {
  const desktopStorage = window.desktop?.storage;

  if (!desktopStorage) {
    return {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    };
  }

  return {
    getItem: async (key) => {
      const fileValue = await desktopStorage.getItem(key);
      if (fileValue !== null) return fileValue;

      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        await desktopStorage.setItem(key, localValue);
      }
      return localValue;
    },
    setItem: (key, value) => desktopStorage.setItem(key, value),
    removeItem: async (key) => {
      await desktopStorage.removeItem(key);
      localStorage.removeItem(key);
    },
  };
}
