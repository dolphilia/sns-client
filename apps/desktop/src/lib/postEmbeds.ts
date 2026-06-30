import type {
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from "@atproto/api";

type PostEmbed = NonNullable<AppBskyFeedDefs.PostView["embed"]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isImagesView(embed: unknown): embed is AppBskyEmbedImages.View {
  return (
    isRecord(embed) &&
    embed.$type === "app.bsky.embed.images#view" &&
    Array.isArray(embed.images)
  );
}

export function isRecordWithMediaView(
  embed: unknown
): embed is AppBskyEmbedRecordWithMedia.View {
  return (
    isRecord(embed) &&
    embed.$type === "app.bsky.embed.recordWithMedia#view" &&
    isRecord(embed.media)
  );
}

export function getFirstImage(embed: PostEmbed | undefined): AppBskyEmbedImages.ViewImage | null {
  if (isImagesView(embed)) {
    return embed.images[0] ?? null;
  }

  if (isRecordWithMediaView(embed) && isImagesView(embed.media)) {
    return embed.media.images[0] ?? null;
  }

  return null;
}

export function hasPostImage(post: AppBskyFeedDefs.PostView) {
  return getFirstImage(post.embed) !== null;
}
