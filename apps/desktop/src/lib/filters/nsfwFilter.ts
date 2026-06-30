import type { AppBskyFeedDefs } from "@atproto/api";

const nsfwLabelValues = new Set([
  "porn",
  "sexual",
  "nudity",
  "graphic-media",
  "nsfw",
  "suggestive",
  "gore",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasNsfwLabelValue(value: unknown) {
  return typeof value === "string" && nsfwLabelValues.has(value);
}

function hasNsfwLabels(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (!isRecord(item)) return false;
      return hasNsfwLabelValue(item.val);
    });
  }

  return false;
}

export function hasNsfwLabel(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasNsfwLabel);
  }

  if (!isRecord(value)) return false;

  if (hasNsfwLabels(value.labels)) return true;

  for (const nested of Object.values(value)) {
    if (nested === value.labels) continue;
    if (hasNsfwLabel(nested)) return true;
  }

  return false;
}

export function isNsfwPost(post: AppBskyFeedDefs.PostView) {
  return hasNsfwLabel(post);
}
