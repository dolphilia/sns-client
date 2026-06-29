export function normalizeFeedUri(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (value.startsWith("at://")) return value;

  try {
    const url = new URL(value);
    if (url.hostname !== "bsky.app") return value;

    const parts = url.pathname.split("/").filter(Boolean);
    const [profile, actor, feed, rkey] = parts;

    if (profile !== "profile" || feed !== "feed" || !actor || !rkey) {
      return value;
    }

    return `at://${decodeURIComponent(actor)}/app.bsky.feed.generator/${decodeURIComponent(rkey)}`;
  } catch {
    return value;
  }
}
