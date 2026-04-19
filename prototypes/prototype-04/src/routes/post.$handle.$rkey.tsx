import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RichText } from "@atproto/api";
import { agent } from "@/lib/agent";
import { PostCard } from "@/components/post/PostCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import type { AppBskyFeedDefs } from "@atproto/api";

function PostThreadPage() {
  const { handle, rkey } = Route.useParams();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const uri = `at://${handle}/app.bsky.feed.post/${rkey}`;

  const { data, isLoading } = useQuery({
    queryKey: ["thread", uri],
    queryFn: () => agent.getPostThread({ uri, depth: 6 }),
  });

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      const thread = data?.data.thread;
      if (!thread || thread.$type !== "app.bsky.feed.defs#threadViewPost") return;
      const root = (thread as AppBskyFeedDefs.ThreadViewPost).post;
      const rt = new RichText({ text });
      await rt.detectFacets(agent);
      return agent.post({
        text: rt.text,
        facets: rt.facets,
        reply: {
          root: { uri: root.uri, cid: root.cid },
          parent: { uri: root.uri, cid: root.cid },
        },
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["thread", uri] });
    },
  });

  const thread = data?.data.thread;
  const isThreadView = thread?.$type === "app.bsky.feed.defs#threadViewPost";
  const rootPost = isThreadView ? (thread as AppBskyFeedDefs.ThreadViewPost).post : null;
  const replies = isThreadView
    ? ((thread as AppBskyFeedDefs.ThreadViewPost).replies ?? []).filter(
        (r) => r.$type === "app.bsky.feed.defs#threadViewPost"
      ) as AppBskyFeedDefs.ThreadViewPost[]
    : [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/home" })}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="font-semibold text-base">投稿</h1>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          読み込み中...
        </div>
      )}

      {/* ルート投稿 */}
      {rootPost && (
        <PostCard item={{ post: rootPost, $type: "app.bsky.feed.defs#feedViewPost" }} />
      )}

      {/* 返信一覧 */}
      {replies.length > 0 && (
        <div className="border-t border-border">
          <p className="px-4 py-2 text-xs text-muted-foreground font-medium">返信</p>
          {replies.map((reply) => (
            <PostCard
              key={reply.post.uri}
              item={{ post: reply.post, $type: "app.bsky.feed.defs#feedViewPost" }}
            />
          ))}
        </div>
      )}

      {/* 返信フォーム */}
      {session && rootPost && (
        <div className="border-t border-border px-4 py-3 flex gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs">
              {session.handle?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="返信を入力..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="resize-none border-0 p-0 shadow-none focus-visible:ring-0 text-sm min-h-[56px]"
              rows={2}
            />
            <div className="flex justify-end mt-1">
              <Button
                size="sm"
                onClick={() => replyMutation.mutate(replyText)}
                disabled={!replyText.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? "送信中..." : "返信"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/post/$handle/$rkey")({ component: PostThreadPage });
