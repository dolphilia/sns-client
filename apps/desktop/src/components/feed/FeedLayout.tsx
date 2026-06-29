import type { ReactNode } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

export function FeedContent({ children }: { children: ReactNode }) {
  const display = useSettingsStore((s) => s.feedDisplaySettings);

  return (
    <div
      className={cn("w-full", !display.fullWidth && "mx-auto")}
      style={display.fullWidth ? undefined : { maxWidth: `${display.feedWidth}px` }}
    >
      {children}
    </div>
  );
}

export function FeedPosts({ children }: { children: ReactNode }) {
  const display = useSettingsStore((s) => s.feedDisplaySettings);

  if (!display.grid) return <>{children}</>;

  return (
    <div
      className="grid gap-3 p-3"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${display.gridPostSize}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
