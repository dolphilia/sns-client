import { cn } from "@/lib/utils";

interface Props {
  current: number;
  total: number;
  className?: string;
}

export function EditionProgress({ current, total, className }: Props) {
  const ratio = total === 0 ? 0 : Math.min(current / total, 1);
  const percent = Math.round(ratio * 100);

  return (
    <div
      className={cn("h-0.5 w-full bg-border overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="読書の進み具合"
    >
      <div
        className="h-full bg-foreground/20 transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
