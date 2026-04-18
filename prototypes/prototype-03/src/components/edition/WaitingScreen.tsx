import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
}

export function WaitingScreen({ onStart, isLoading, error }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 animate-in fade-in duration-500">
      <div className="text-center space-y-8 max-w-xs">
        <div className="space-y-2">
          <p className="text-2xl font-light text-foreground/80 tracking-wide">
            今日のフィード
          </p>
          <p className="text-sm text-muted-foreground">
            準備ができたら読み始めましょう
          </p>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          onClick={onStart}
          disabled={isLoading}
          variant="outline"
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              取得中...
            </>
          ) : (
            "読み始める"
          )}
        </Button>
      </div>
    </div>
  );
}
