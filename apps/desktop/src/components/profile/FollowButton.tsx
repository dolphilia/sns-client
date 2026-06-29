import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agent } from "@/lib/agent";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUnfollowedActorStore } from "@/stores/unfollowedActorStore";

interface Props {
  actor: {
    did: string;
    handle: string;
    viewer?: { following?: string };
  };
}

export function FollowButton({ actor }: Props) {
  const session = useAuthStore((s) => s.session);
  const followSafetySettings = useSettingsStore((s) => s.followSafetySettings);
  const addUnfollowedActorRecord = useUnfollowedActorStore((s) => s.addRecord);
  const hasUnfollowedActorRecord = useUnfollowedActorStore((s) => s.hasRecord);
  const queryClient = useQueryClient();
  const [followUri, setFollowUri] = useState(actor.viewer?.following);

  const isMe = session?.did === actor.did;
  const isFollowing = Boolean(followUri);
  const isRefollowBlocked =
    followSafetySettings.preventRefollowAfterUnfollow &&
    !isFollowing &&
    hasUnfollowedActorRecord(actor.did);

  function invalidateRelatedQueries() {
    queryClient.invalidateQueries({ queryKey: ["connections"] });
    queryClient.invalidateQueries({ queryKey: ["discover"] });
    queryClient.invalidateQueries({ queryKey: ["my-likes", session?.did] });
    queryClient.invalidateQueries({ queryKey: ["timeline"] });
    queryClient.invalidateQueries({ queryKey: ["profile", actor.handle] });
  }

  useEffect(() => {
    setFollowUri(actor.viewer?.following);
  }, [actor.viewer?.following]);

  const followMutation = useMutation({
    mutationFn: () => agent.follow(actor.did),
    onSuccess: (result) => {
      setFollowUri(result.uri);
      invalidateRelatedQueries();
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!followUri) throw new Error("Follow record URI is missing.");
      await agent.deleteFollow(followUri);
      addUnfollowedActorRecord(actor);
      if (followSafetySettings.muteOnUnfollow) {
        try {
          await agent.mute(actor.did);
        } catch (error) {
          console.warn("Failed to mute actor after unfollow", error);
        }
      }
    },
    onSuccess: () => {
      setFollowUri(undefined);
      invalidateRelatedQueries();
    },
  });
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  if (isMe) return null;

  return (
    <Button
      variant={isFollowing ? "destructive" : "outline"}
      size="sm"
      className="h-7 gap-1.5 px-2 text-xs"
      disabled={isPending || isRefollowBlocked}
      onClick={() => {
        if (isFollowing) {
          unfollowMutation.mutate();
        } else {
          followMutation.mutate();
        }
      }}
      title={
        isRefollowBlocked
          ? "フォロー解除済みとして記録されているため、再フォローを防止しています"
          : isFollowing
            ? `${actor.handle} のフォローを解除`
            : `${actor.handle} をフォロー`
      }
    >
      {isFollowing ? <UserMinus size={13} /> : <UserPlus size={13} />}
      {isPending
        ? "処理中..."
        : isRefollowBlocked
          ? "解除済み"
          : isFollowing
            ? "フォロー解除"
            : "フォロー"}
    </Button>
  );
}
