import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMuteActor } from "@/hooks/usePostActions";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  actor: {
    did: string;
    handle: string;
    displayName?: string;
  };
}

export function MuteActorButton({ actor }: Props) {
  const session = useAuthStore((s) => s.session);
  const muteMutation = useMuteActor();
  const [open, setOpen] = useState(false);
  const isMe = session?.did === actor.did;
  const actorName = actor.displayName || actor.handle;

  if (isMe) return null;

  const handleConfirm = () => {
    muteMutation.mutate(
      { actorDid: actor.did },
      {
        onSuccess: () => setOpen(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              disabled={muteMutation.isPending}
              title="投稿メニュー"
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <EllipsisVertical size={16} />
          <span className="sr-only">投稿メニュー</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            ミュートする
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>ユーザーをミュートしますか？</DialogTitle>
          <DialogDescription>
            {actorName}（@{actor.handle}）の投稿を Bluesky 上でミュートします。
            この操作はあとから Bluesky 側で解除できます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={muteMutation.isPending}
          >
            {muteMutation.isPending ? "処理中..." : "ミュートする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
