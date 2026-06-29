import { Globe2, Lock, SlidersHorizontal } from "lucide-react";
import { siteColors } from "../lib/defaults";
import type { SiteId } from "../lib/types";

interface SiteSummary {
  id: SiteId;
  label: string;
  homeUrl: string;
}

interface SiteSidebarProps {
  sites: SiteSummary[];
  activeSiteId: SiteId;
  onSelectSite: (siteId: SiteId) => void;
}

export function SiteSidebar({ sites, activeSiteId, onSelectSite }: SiteSidebarProps) {
  return (
    <aside className="site-sidebar">
      <div className="app-mark">
        <div className="app-mark-icon">
          <SlidersHorizontal size={18} />
        </div>
        <div>
          <h1>SNS Browser Lab</h1>
          <p>個人実験用</p>
        </div>
      </div>

      <section>
        <h2>対象SNS</h2>
        <div className="site-list">
          {sites.map((site) => (
            <button
              className={`site-button ${site.id === activeSiteId ? "is-active" : ""}`}
              type="button"
              key={site.id}
              onClick={() => onSelectSite(site.id)}
            >
              <span
                className="site-dot"
                style={{ backgroundColor: siteColors[site.id] }}
                aria-hidden="true"
              />
              <span>
                <strong>{site.label}</strong>
                <small>{new URL(site.homeUrl).hostname}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-note">
        <h2>実験範囲</h2>
        <p>
          公式Web版を表示し、CSSで読みやすさを調整します。非公開APIの直接利用や自動操作は行いません。
        </p>
        <div className="note-row">
          <Lock size={14} />
          <span>ログイン情報はアプリ独自JSONへ保存しません。</span>
        </div>
        <div className="note-row">
          <Globe2 size={14} />
          <span>許可外リンクは外部ブラウザで開きます。</span>
        </div>
      </section>
    </aside>
  );
}
