import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppBskyEmbedImages } from "@atproto/api";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { agent } from "@/lib/agent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
type ImageEmbed = AppBskyEmbedImages.Main & { $type: "app.bsky.embed.images" };

function getRkeyFromAtUri(uri: string) {
  const rkey = uri.split("/").pop();
  if (!rkey) throw new Error("投稿 URI から rkey を取得できませんでした");
  return rkey;
}

type PostFormProps = {
  className?: string;
  onSuccess?: () => void;
};

export function PostForm({ className, onSuccess }: PostFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const { data: profileData } = useQuery({
    queryKey: ["profile", session?.did],
    queryFn: () => agent.getProfile({ actor: session!.did }),
    enabled: Boolean(session?.did),
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileData?.data;
  const accountLabel = profile?.displayName || session?.handle;

  const clearImage = () => {
    setImageFile(null);
    setImageAlt("");
    setImageError(null);
    setImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const postMutation = useMutation({
    mutationFn: async ({
      imageFile,
      imageAlt,
    }: {
      imageFile: File;
      imageAlt: string;
    }) => {
      if (!session?.did) throw new Error("ログインセッションがありません");

      const uploaded = await agent.uploadBlob(imageFile, {
        encoding: imageFile.type,
      });
      const createdAt = new Date().toISOString();
      const embed: ImageEmbed = {
        $type: "app.bsky.embed.images",
        images: [
          {
            image: uploaded.data.blob,
            alt: imageAlt.trim(),
          },
        ],
      };

      const post = await agent.post({
        text: "",
        embed,
        createdAt,
      });

      try {
        await agent.app.bsky.feed.threadgate.create(
          {
            repo: session.did,
            rkey: getRkeyFromAtUri(post.uri),
          },
          {
            post: post.uri,
            allow: [],
            createdAt,
          }
        );
      } catch (error) {
        await agent.deletePost(post.uri).catch(() => undefined);
        throw error;
      }

      return post;
    },
    onSuccess: () => {
      clearImage();
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["author-feed", session?.did] });
      queryClient.invalidateQueries({ queryKey: ["profile", session?.did] });
      onSuccess?.();
    },
  });

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleSelectImage = (file: File | undefined) => {
    if (!file) return;
    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("画像ファイルを選択してください");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("画像は 2MB 以下にしてください");
      return;
    }

    setImageFile(file);
    setImageAlt("");
    setImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 1) {
      setImageError("一度に投稿できる画像は 1 枚だけです");
      return;
    }

    handleSelectImage(files[0]);
  };

  const canPost = imageFile !== null && !postMutation.isPending;

  return (
    <div className={cn("flex gap-3", className)}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={profile?.avatar} alt={accountLabel} />
        <AvatarFallback>{accountLabel?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            const nextTarget = event.relatedTarget as Node | null;
            if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary",
            isDragging && "border-sky-500 bg-sky-50"
          )}
        >
          {imagePreviewUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
              <img
                src={imagePreviewUrl}
                alt=""
                className="max-h-80 w-full object-contain"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearImage();
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
                title="画像を削除"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-medium">画像をドラッグ＆ドロップ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                クリックして画像を選択できます。投稿できる画像は 1 枚までです。
              </p>
            </>
          )}
        </div>

        {imagePreviewUrl && (
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="画像の説明を追加"
            className="mt-3 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        )}
        {imageError && <p className="mt-2 text-xs text-destructive">{imageError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleSelectImage(e.target.files?.[0])}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={postMutation.isPending}
            title={imageFile ? "画像を変更" : "画像を選択"}
          >
            <ImagePlus size={16} />
            {imageFile ? "画像を変更" : "画像を選択"}
          </Button>
          <Button
            size="sm"
            onClick={() => imageFile && postMutation.mutate({ imageFile, imageAlt })}
            disabled={!canPost}
          >
            {postMutation.isPending ? "送信中..." : "画像を投稿"}
          </Button>
        </div>
        {postMutation.isError && (
          <p className="mt-2 text-xs text-destructive">
            画像の投稿、または返信制限の設定に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>
    </div>
  );
}
