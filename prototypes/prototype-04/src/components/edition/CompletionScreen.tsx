import { Button } from "@/components/ui/button";
import type { CompletionType } from "@/stores/editionStore";

interface Props {
  type: CompletionType;
  onNext: () => void;
  onClose: () => void;
}

const messages: Record<CompletionType, string> = {
  natural: "読み終えました。",
  manual: "今日はここまで。",
};

export function CompletionScreen({ type, onNext, onClose }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 animate-in fade-in duration-700">
      <div className="text-center space-y-12 max-w-xs">
        <p className="text-2xl font-light text-foreground/70 tracking-wide">
          {messages[type]}
        </p>

        <div className="flex items-center justify-between gap-6 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            閉じる
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
          >
            新しいフィードを取得する
          </Button>
        </div>
      </div>
    </div>
  );
}
