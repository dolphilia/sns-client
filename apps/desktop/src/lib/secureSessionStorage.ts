import type { AtpSessionData } from "@atproto/api";

const legacyAuthStorageKey = "bsky-auth";
const browserSessionStorageKey = "bsky-auth-session";

function getDesktopCredentials() {
  return window.desktop?.credentials;
}

function readLegacySession() {
  try {
    const raw = localStorage.getItem(legacyAuthStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { session?: AtpSessionData | null } };
    return parsed.state?.session ?? null;
  } catch {
    return null;
  }
}

function clearLegacySession() {
  try {
    const raw = localStorage.getItem(legacyAuthStorageKey);
    if (!raw) return;

    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (!parsed.state || !("session" in parsed.state)) return;

    delete parsed.state.session;
    localStorage.setItem(legacyAuthStorageKey, JSON.stringify(parsed));
  } catch {
    localStorage.removeItem(legacyAuthStorageKey);
  }
}

function readBrowserSession() {
  try {
    const raw = localStorage.getItem(browserSessionStorageKey);
    return raw ? (JSON.parse(raw) as AtpSessionData) : null;
  } catch {
    localStorage.removeItem(browserSessionStorageKey);
    return null;
  }
}

export async function loadStoredSession() {
  const credentials = getDesktopCredentials();
  if (credentials) {
    const secureSessionJson = await credentials.getBskySession();
    if (secureSessionJson) return JSON.parse(secureSessionJson) as AtpSessionData;

    const legacySession = readLegacySession();
    if (legacySession) {
      try {
        await credentials.setBskySession(JSON.stringify(legacySession));
        clearLegacySession();
      } catch (error) {
        console.warn("Failed to migrate legacy Bluesky session to secure storage.", error);
      }
      return legacySession;
    }

    return null;
  }

  const browserSession = readBrowserSession();
  if (browserSession) return browserSession;

  const legacySession = readLegacySession();
  if (legacySession) {
    localStorage.setItem(browserSessionStorageKey, JSON.stringify(legacySession));
    clearLegacySession();
    return legacySession;
  }

  return null;
}

export async function saveStoredSession(session: AtpSessionData) {
  const credentials = getDesktopCredentials();
  if (credentials) {
    await credentials.setBskySession(JSON.stringify(session));
    clearLegacySession();
    return;
  }

  localStorage.setItem(browserSessionStorageKey, JSON.stringify(session));
  clearLegacySession();
}

export async function deleteStoredSession() {
  const credentials = getDesktopCredentials();
  if (credentials) {
    try {
      await credentials.deleteBskySession();
    } catch (error) {
      console.warn("Failed to delete secure Bluesky session.", error);
    }
  }

  localStorage.removeItem(browserSessionStorageKey);
  clearLegacySession();
}
