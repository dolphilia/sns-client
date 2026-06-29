import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RichText } from "@atproto/api";
import { agent } from "@/lib/agent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";

const MAX_LENGTH = 300;

export function PostForm() {
  const [text, setText] = useState("");
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const rt = new RichText({ text });
      await rt.detectFacets(agent);
      return agent.post({
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  const remaining = MAX_LENGTH - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !postMutation.isPending;

  return (
    <div className="border-b border-border px-4 py-3 flex gap-3">
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={session?.handle} alt={session?.handle} />
        <AvatarFallback>{session?.handle?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <Textarea
          placeholder="いまどうしてる？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="resize-none border-0 p-0 shadow-none focus-visible:ring-0 text-base min-h-[72px]"
          rows={3}
        />
        <div className="flex items-center justify-end gap-3 mt-2">
          <span className={`text-xs ${remaining < 20 ? "text-destructive" : "text-muted-foreground"}`}>
            {remaining}
          </span>
          <Button
            size="sm"
            onClick={() => postMutation.mutate(text)}
            disabled={!canPost}
          >
            {postMutation.isPending ? "送信中..." : "投稿"}
          </Button>
        </div>
        {postMutation.isError && (
          <p className="text-xs text-destructive mt-1">
            投稿に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>
    </div>
  );
}
