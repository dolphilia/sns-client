import { ArrowLeft, ArrowRight, ExternalLink, Home, RefreshCw } from "lucide-react";
import type { BrowserState } from "../lib/types";

interface BrowserToolbarProps {
  state: BrowserState | null;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onOpenExternal: () => void;
}

export function BrowserToolbar({
  state,
  onBack,
  onForward,
  onReload,
  onHome,
  onOpenExternal,
}: BrowserToolbarProps) {
  return (
    <header className="browser-toolbar">
      <div className="toolbar-actions">
        <button
          className="icon-button"
          type="button"
          onClick={onBack}
          disabled={!state?.canGoBack}
          title="戻る"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onForward}
          disabled={!state?.canGoForward}
          title="進む"
        >
          <ArrowRight size={17} />
        </button>
        <button className="icon-button" type="button" onClick={onReload} title="再読み込み">
          <RefreshCw size={16} className={state?.isLoading ? "spin" : ""} />
        </button>
        <button className="icon-button" type="button" onClick={onHome} title="ホーム">
          <Home size={16} />
        </button>
      </div>
      <div className="url-display" title={state?.currentUrl || ""}>
        {state?.currentUrl || "about:blank"}
      </div>
      <button
        className="icon-button"
        type="button"
        onClick={onOpenExternal}
        disabled={!state?.currentUrl}
        title="外部ブラウザで開く"
      >
        <ExternalLink size={16} />
      </button>
    </header>
  );
}
