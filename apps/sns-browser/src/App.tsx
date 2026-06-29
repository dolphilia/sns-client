import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { RulePanel } from "./components/RulePanel";
import { SiteSidebar } from "./components/SiteSidebar";
import { fallbackSettings } from "./lib/defaults";
import type { AppSettings, BrowserRule, BrowserState, SiteId } from "./lib/types";

interface SiteSummary {
  id: SiteId;
  label: string;
  homeUrl: string;
}

function ruleSignature(rules: BrowserRule[]) {
  return JSON.stringify(rules);
}

export default function App() {
  const viewSlotRef = useRef<HTMLDivElement | null>(null);
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [browserState, setBrowserState] = useState<BrowserState | null>(null);
  const [rules, setRules] = useState<BrowserRule[]>([]);
  const [savedRulesSignature, setSavedRulesSignature] = useState("");
  const [ready, setReady] = useState(false);

  const activeSiteId = settings.activeSiteId;
  const dirty = ruleSignature(rules) !== savedRulesSignature;

  const updateViewBounds = useCallback(() => {
    const slot = viewSlotRef.current;
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    void window.snsBrowser.setViewBounds({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useLayoutEffect(() => {
    updateViewBounds();
    const observer = new ResizeObserver(updateViewBounds);
    if (viewSlotRef.current) observer.observe(viewSlotRef.current);
    window.addEventListener("resize", updateViewBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateViewBounds);
    };
  }, [updateViewBounds]);

  useEffect(() => {
    const unsubscribe = window.snsBrowser.onBrowserStateChanged(setBrowserState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function boot() {
      const [loadedSites, loadedSettings, state] = await Promise.all([
        window.snsBrowser.getSites(),
        window.snsBrowser.getSettings(),
        window.snsBrowser.getBrowserState(),
      ]);
      setSites(loadedSites);
      setSettings(loadedSettings);
      setBrowserState(state);
      const loadedRules = await window.snsBrowser.getRules(loadedSettings.activeSiteId);
      setRules(loadedRules);
      setSavedRulesSignature(ruleSignature(loadedRules));
      await window.snsBrowser.setActiveSite(loadedSettings.activeSiteId);
      setReady(true);
      requestAnimationFrame(updateViewBounds);
    }

    void boot();
  }, [updateViewBounds]);

  async function selectSite(siteId: SiteId) {
    const nextSettings = { ...settings, activeSiteId: siteId };
    setSettings(nextSettings);
    await window.snsBrowser.saveSettings(nextSettings);
    const nextRules = await window.snsBrowser.getRules(siteId);
    setRules(nextRules);
    setSavedRulesSignature(ruleSignature(nextRules));
    setBrowserState(await window.snsBrowser.setActiveSite(siteId));
    requestAnimationFrame(updateViewBounds);
  }

  async function saveCurrentRules() {
    await window.snsBrowser.saveRules(activeSiteId, rules);
    setSavedRulesSignature(ruleSignature(rules));
  }

  async function applyCurrentRules() {
    await window.snsBrowser.applyRules();
  }

  async function openExternal() {
    if (!browserState?.currentUrl) return;
    await window.snsBrowser.openExternal(browserState.currentUrl);
  }

  return (
    <main className="app-shell">
      <SiteSidebar sites={sites} activeSiteId={activeSiteId} onSelectSite={selectSite} />
      <section className="browser-column">
        <BrowserToolbar
          state={browserState}
          onBack={() => void window.snsBrowser.goBack()}
          onForward={() => void window.snsBrowser.goForward()}
          onReload={() => void window.snsBrowser.reload()}
          onHome={() => void window.snsBrowser.loadHome()}
          onOpenExternal={() => void openExternal()}
        />
        <div className="browser-frame">
          <div ref={viewSlotRef} className="webview-slot" />
          {!ready ? <div className="loading-cover">SNS ブラウザを準備しています</div> : null}
        </div>
      </section>
      <RulePanel
        rules={rules}
        onRulesChange={setRules}
        onSave={() => void saveCurrentRules()}
        onApply={() => void applyCurrentRules()}
        dirty={dirty}
      />
    </main>
  );
}
