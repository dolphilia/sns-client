import { BrowserWindow, WebContentsView, session } from "electron";
import { handleExternalUrl, isAllowedUrl } from "./navigation-policy.js";
import { installPermissionPolicy } from "./permission-policy.js";
import { RuleRunner } from "./rule-runner.js";
import { getSite } from "./site-registry.js";
import { loadRules } from "./storage.js";
import type { BrowserState, SiteId, ViewBounds } from "./types.js";

type StateListener = (state: BrowserState) => void;

export class ViewManager {
  private readonly ruleRunner = new RuleRunner();
  private readonly listeners = new Set<StateListener>();
  private readonly browserSession = session.fromPartition("persist:sns-browser-lab");
  private view: WebContentsView;
  private activeSiteId: SiteId;
  private bounds: ViewBounds = { x: 280, y: 56, width: 900, height: 700 };

  constructor(
    private readonly window: BrowserWindow,
    initialSiteId: SiteId,
  ) {
    this.activeSiteId = initialSiteId;
    installPermissionPolicy(this.browserSession);
    this.view = this.createView();
    this.window.contentView.addChildView(this.view);
    this.view.setBounds(this.bounds);
    this.installViewEvents();
  }

  onStateChanged(listener: StateListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): BrowserState {
    const webContents = this.view.webContents;
    return {
      activeSiteId: this.activeSiteId,
      currentUrl: webContents.getURL(),
      canGoBack: webContents.canGoBack(),
      canGoForward: webContents.canGoForward(),
      isLoading: webContents.isLoading(),
    };
  }

  setBounds(bounds: ViewBounds) {
    this.bounds = {
      x: Math.max(0, Math.round(bounds.x)),
      y: Math.max(0, Math.round(bounds.y)),
      width: Math.max(1, Math.round(bounds.width)),
      height: Math.max(1, Math.round(bounds.height)),
    };
    this.view.setBounds(this.bounds);
  }

  async setActiveSite(siteId: SiteId) {
    if (siteId !== this.activeSiteId) {
      await this.ruleRunner.clear(this.view.webContents);
      this.activeSiteId = siteId;
    }

    await this.loadHome();
    return this.getState();
  }

  async loadHome() {
    await this.view.webContents.loadURL(getSite(this.activeSiteId).homeUrl);
  }

  goBack() {
    if (this.view.webContents.canGoBack()) this.view.webContents.goBack();
  }

  goForward() {
    if (this.view.webContents.canGoForward()) this.view.webContents.goForward();
  }

  reload() {
    this.view.webContents.reload();
  }

  async applyRules() {
    await this.ruleRunner.apply(this.view.webContents, await loadRules(this.activeSiteId));
  }

  private createView() {
    return new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        session: this.browserSession,
      },
    });
  }

  private installViewEvents() {
    const webContents = this.view.webContents;

    webContents.setWindowOpenHandler(({ url }) => {
      handleExternalUrl(url);
      return { action: "deny" };
    });

    webContents.on("will-navigate", (event, url) => {
      if (!isAllowedUrl(url, getSite(this.activeSiteId))) {
        event.preventDefault();
        handleExternalUrl(url);
      }
    });

    webContents.on("did-navigate", () => this.emitState());
    webContents.on("did-navigate-in-page", () => this.emitState());
    webContents.on("did-start-loading", () => this.emitState());
    webContents.on("did-stop-loading", () => {
      this.emitState();
      void this.applyRules();
    });
  }

  private emitState() {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}
