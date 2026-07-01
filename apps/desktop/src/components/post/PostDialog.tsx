import { ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/post/PostForm";

type PostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PostDialog({ open, onOpenChange }: PostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button className="relative w-full rounded-full bg-sky-600 px-4 py-5 text-white hover:bg-sky-500" size="lg" />
        }
      >
        <ImagePlus size={18} className="absolute left-4" />
        <span className="mx-auto">画像を投稿</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>画像を投稿</DialogTitle>
        </DialogHeader>
        <PostForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
