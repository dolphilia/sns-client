import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/**
 * 3つのドットが交互に呼吸するアニメーション。
 * 吟味中の「静かな待機」を表現する。
 */
export function BreathingDots({ className }: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="breathing-dot" style={{ animationDelay: "0s" }} />
      <span className="breathing-dot" style={{ animationDelay: "0.4s" }} />
      <span className="breathing-dot" style={{ animationDelay: "0.8s" }} />

      <style>{`
        .breathing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          opacity: 0.3;
          transform: scale(0.9);
          animation: breathe 2.4s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%       { opacity: 0.75; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
