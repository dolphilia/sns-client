import Editor from "@monaco-editor/react";
import { Check, CircleHelp, Copy, Download, RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { BrowserRule, SiteId } from "../lib/types";

interface RulePanelProps {
  rules: BrowserRule[];
  onRulesChange: (rules: BrowserRule[], options?: { persist?: boolean }) => void;
  onSave: () => void;
  onApply: () => void;
  dirty: boolean;
}

type RulePanelTab = "presets" | "editor" | "export";

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: "top" | "bottom";
}

interface ExportTarget {
  label: string;
  domains: string[];
  matches: string[];
}

const exportTargets: Record<SiteId, ExportTarget> = {
  x: {
    label: "X",
    domains: ["x.com", "twitter.com"],
    matches: ["https://x.com/*", "https://twitter.com/*"],
  },
  threads: {
    label: "Threads",
    domains: ["threads.net", "www.threads.net"],
    matches: ["https://threads.net/*", "https://www.threads.net/*"],
  },
  mixi2: {
    label: "mixi2",
    domains: ["mixi.social"],
    matches: ["https://mixi.social/*"],
  },
};

const smallSquareImageSizeRuleId = "x-experimental-small-square-image-size";

function commentBlock(rule: BrowserRule) {
  return `/* ${rule.name} (${rule.id}) */`;
}

function buildSmallSquareImageSizeCss(size: number) {
  return `:root {
  --sns-browser-small-square-media-size: ${size}px;
}`;
}

function getSmallSquareImageSize(content: string) {
  const match = content.match(/--sns-browser-small-square-media-size:\s*(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : 96;
}

function buildStylusCss(rules: BrowserRule[]) {
  const siteId: SiteId = rules[0]?.siteId ?? "x";
  const target = exportTargets[siteId];
  const cssRules = rules.filter((rule) => rule.enabled && rule.type === "css");
  const body = cssRules.map((rule) => `${commentBlock(rule)}\n${rule.content.trim()}`).join("\n\n");
  const domains = target.domains.map((domain) => `domain("${domain}")`).join(", ");

  return [
    `/* SNS Browser Lab: ${target.label} CSS preset */`,
    "/* Stylus などの CSS 拡張へ読み込むための実験用書き出しです。 */",
    `/* Generated: ${new Date().toISOString()} */`,
    "",
    `@-moz-document ${domains} {`,
    body
      .split("\n")
      .map((line) => (line ? `  ${line}` : ""))
      .join("\n"),
    "}",
    "",
  ].join("\n");
}

function buildUserScript(rules: BrowserRule[]) {
  const siteId: SiteId = rules[0]?.siteId ?? "x";
  const target = exportTargets[siteId];
  const cssRules = rules.filter((rule) => rule.enabled && rule.type === "css");
  const scriptRules = rules.filter((rule) => rule.enabled && rule.type === "script");
  const css = cssRules.map((rule) => `${commentBlock(rule)}\n${rule.content.trim()}`).join("\n\n");
  const matches = target.matches.map((match) => `// @match        ${match}`).join("\n");
  const scriptPayload = JSON.stringify(
    scriptRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      content: rule.content,
    })),
    null,
    2,
  );

  return [
    "// ==UserScript==",
    `// @name         SNS Browser Lab - ${target.label} preset`,
    "// @namespace    https://github.com/dolphilia/sns-client",
    "// @version      0.1.0",
    "// @description  SNS Browser Lab の表示設定を Chrome 拡張で検証するための実験用書き出しです。",
    matches,
    "// @run-at       document-start",
    "// @grant        GM_addStyle",
    "// ==/UserScript==",
    "",
    "(function () {",
    '  "use strict";',
    "",
    `  const css = ${JSON.stringify(css)};`,
    `  const scriptRules = ${scriptPayload.split("\n").join("\n  ")};`,
    "",
    "  function addStyle(content) {",
    "    if (!content.trim()) return;",
    '    if (typeof GM_addStyle === "function") {',
    "      GM_addStyle(content);",
    "      return;",
    "    }",
    '    const style = document.createElement("style");',
    '    style.dataset.snsBrowserExport = "true";',
    "    style.textContent = content;",
    "    (document.head || document.documentElement).appendChild(style);",
    "  }",
    "",
    "  addStyle(css);",
    "",
    "  for (const rule of scriptRules) {",
    "    try {",
    "      Function(rule.content)();",
    "    } catch (error) {",
    '      console.error("[SNS Browser Lab export] Failed to run rule:", rule.id, rule.name, error);',
    "    }",
    "  }",
    "})();",
    "",
  ].join("\n");
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RulePanel({ rules, onRulesChange, onSave, onApply, dirty }: RulePanelProps) {
  const presetRules = useMemo(() => rules.filter((rule) => rule.visible !== false), [rules]);
  const enabledCssRules = useMemo(() => rules.filter((rule) => rule.enabled && rule.type === "css"), [rules]);
  const enabledScriptRules = useMemo(() => rules.filter((rule) => rule.enabled && rule.type === "script"), [rules]);
  const activeSiteId: SiteId = rules[0]?.siteId ?? "x";
  const activeExportTarget = exportTargets[activeSiteId];
  const customCssRule = useMemo(
    () => rules.find((rule) => rule.id === `${activeSiteId}-custom-css`) ?? null,
    [activeSiteId, rules],
  );
  const smallSquareImageSizeRule = useMemo(
    () => rules.find((rule) => rule.id === smallSquareImageSizeRuleId) ?? null,
    [rules],
  );
  const smallSquareImageSize = smallSquareImageSizeRule ? getSmallSquareImageSize(smallSquareImageSizeRule.content) : 96;
  const stylusCss = useMemo(() => buildStylusCss(rules), [rules]);
  const userScript = useMemo(() => buildUserScript(rules), [rules]);
  const sidebarRules = useMemo(() => presetRules.filter((rule) => rule.name.startsWith("左サイドバー:")), [presetRules]);
  const rightSidebarRules = useMemo(() => presetRules.filter((rule) => rule.name.startsWith("右サイドバー:")), [presetRules]);
  const timelineRules = useMemo(() => presetRules.filter((rule) => rule.name.startsWith("タイムライン投稿:")), [presetRules]);
  const composerRules = useMemo(() => presetRules.filter((rule) => rule.name.startsWith("ポスト作成:")), [presetRules]);
  const experimentalRules = useMemo(() => presetRules.filter((rule) => rule.name.startsWith("実験的機能:")), [presetRules]);
  const generalRules = useMemo(
    () =>
      presetRules.filter(
        (rule) =>
          !rule.name.startsWith("左サイドバー:") &&
          !rule.name.startsWith("右サイドバー:") &&
          !rule.name.startsWith("タイムライン投稿:") &&
          !rule.name.startsWith("ポスト作成:") &&
          !rule.name.startsWith("実験的機能:"),
      ),
    [presetRules],
  );
  const [activeTab, setActiveTab] = useState<RulePanelTab>("presets");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [exportMessage, setExportMessage] = useState("");

  function updateRule(ruleId: string, patch: Partial<BrowserRule>, options?: { persist?: boolean }) {
    onRulesChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)), options);
  }

  async function copyExport(content: string, label: string) {
    try {
      await navigator.clipboard.writeText(content);
      setExportMessage(`${label} をクリップボードにコピーしました。`);
    } catch {
      setExportMessage("クリップボードへコピーできませんでした。ダウンロードを使ってください。");
    }
  }

  function showTooltip(target: HTMLElement, text: string) {
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 260;
    const margin = 12;
    const x = Math.min(Math.max(rect.left + rect.width / 2, tooltipWidth / 2 + margin), window.innerWidth - tooltipWidth / 2 - margin);
    const hasTopRoom = rect.top >= 72;
    setTooltip({
      text,
      x,
      y: hasTopRoom ? rect.top - 8 : rect.bottom + 8,
      placement: hasTopRoom ? "top" : "bottom",
    });
  }

  function renderPresetRule(rule: BrowserRule) {
    const label = rule.name
      .replace("左サイドバー: ", "")
      .replace("右サイドバー: ", "")
      .replace("タイムライン投稿: ", "")
      .replace("ポスト作成: ", "")
      .replace("サイト全体: ", "")
      .replace("実験的機能: ", "");

    return (
      <label className="preset-toggle" key={rule.id}>
        <span className="preset-label">
          <strong>{label}</strong>
          {rule.description ? (
            <span
              className="preset-help"
              tabIndex={0}
              aria-label={rule.description}
              onBlur={() => setTooltip(null)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onFocus={(event) => showTooltip(event.currentTarget, rule.description ?? "")}
              onMouseEnter={(event) => showTooltip(event.currentTarget, rule.description ?? "")}
              onMouseLeave={() => setTooltip(null)}
            >
              <CircleHelp size={14} />
            </span>
          ) : null}
        </span>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(event) => updateRule(rule.id, { enabled: event.target.checked }, { persist: true })}
          aria-label={`${rule.name} を表示`}
        />
      </label>
    );
  }

  function updateSmallSquareImageSize(size: number) {
    if (!smallSquareImageSizeRule) return;
    const safeSize = Math.min(Math.max(Math.round(size), 24), 640);
    updateRule(
      smallSquareImageSizeRule.id,
      {
        content: buildSmallSquareImageSizeCss(safeSize),
        enabled: true,
      },
      { persist: true },
    );
  }

  return (
    <aside className="rule-panel">
      <div className="panel-header">
        <div>
          <h2>表示設定</h2>
          <p>プリセットの切り替えとカスタム CSS 編集を行います。</p>
        </div>
        {dirty ? <span className="dirty-badge">未保存</span> : <span className="saved-badge">保存済み</span>}
      </div>

      <div className="rule-tabs" role="tablist" aria-label="表示設定の切り替え">
        <button
          className={activeTab === "presets" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "presets"}
          onClick={() => setActiveTab("presets")}
        >
          プリセット設定
        </button>
        <button
          className={activeTab === "editor" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "editor"}
          onClick={() => setActiveTab("editor")}
        >
          カスタム CSS
        </button>
        <button
          className={activeTab === "export" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "export"}
          onClick={() => setActiveTab("export")}
        >
          書き出し
        </button>
      </div>

      <div className="rule-panel-body">
        {activeTab === "presets" ? (
          <div className="preset-scroll" role="tabpanel" aria-label="プリセット設定">
            {generalRules.length ? (
              <section className="preset-section">
                <h3>全体</h3>
                <div className="preset-list">{generalRules.map(renderPresetRule)}</div>
              </section>
            ) : null}
            {sidebarRules.length ? (
              <section className="preset-section">
                <h3>左サイドバー</h3>
                <div className="preset-grid">{sidebarRules.map(renderPresetRule)}</div>
              </section>
            ) : null}
            {rightSidebarRules.length ? (
              <section className="preset-section">
                <h3>右サイドバー</h3>
                <div className="preset-grid">{rightSidebarRules.map(renderPresetRule)}</div>
              </section>
            ) : null}
            {timelineRules.length ? (
              <section className="preset-section">
                <h3>タイムライン投稿</h3>
                <div className="preset-grid">{timelineRules.map(renderPresetRule)}</div>
              </section>
            ) : null}
            {composerRules.length ? (
              <section className="preset-section">
                <h3>ポスト作成</h3>
                <div className="preset-grid">{composerRules.map(renderPresetRule)}</div>
              </section>
            ) : null}
            {experimentalRules.length ? (
              <section className="preset-section">
                <h3>実験的機能</h3>
                <div className="preset-grid">{experimentalRules.map(renderPresetRule)}</div>
                {smallSquareImageSizeRule ? (
                  <label className="numeric-setting">
                    <span>
                      <strong>正方形画像サイズ</strong>
                      <small>画像を小さな正方形で表示する時の一辺</small>
                    </span>
                    <input
                      type="number"
                      min={24}
                      max={640}
                      step={4}
                      value={smallSquareImageSize}
                      onChange={(event) => updateSmallSquareImageSize(Number(event.target.value))}
                    />
                    <em>px</em>
                  </label>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : activeTab === "editor" ? (
          <div className="custom-css-tab" role="tabpanel" aria-label="カスタム CSS">
            <div className="custom-css-note">
              <strong>カスタム CSS</strong>
              <p>プリセットの後に追加で適用する CSS です。既存プリセットの本文はここでは編集しません。</p>
            </div>
            <div className="editor-shell">
              {customCssRule ? (
                <Editor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={customCssRule.content}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                  onChange={(value) => updateRule(customCssRule.id, { content: value ?? "", enabled: true })}
                />
              ) : (
                <div className="empty-editor">カスタム CSS ルールがありません。</div>
              )}
            </div>
          </div>
        ) : (
          <div className="export-tab" role="tabpanel" aria-label="書き出し">
            <section className="export-card">
              <h3>Stylus 用 CSS</h3>
              <p>
                有効な CSS ルール {enabledCssRules.length} 件を {activeExportTarget.label} の対象ドメインに閉じ込めて書き出します。
                Stylus の新規スタイルへ貼り付けて検証できます。
              </p>
              <div className="export-actions">
                <button className="secondary-button" type="button" onClick={() => void copyExport(stylusCss, "Stylus 用 CSS")}>
                  <Copy size={15} />
                  コピー
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => downloadText(`sns-browser-${activeSiteId}.css`, stylusCss)}
                >
                  <Download size={15} />
                  CSS
                </button>
              </div>
            </section>

            <section className="export-card">
              <h3>OrangeMonkey 用 UserScript</h3>
              <p>
                有効な CSS ルール {enabledCssRules.length} 件と script ルール {enabledScriptRules.length} 件をまとめます。
                Tampermonkey や Violentmonkey での検証にも使える形式です。
              </p>
              <div className="export-actions">
                <button className="secondary-button" type="button" onClick={() => void copyExport(userScript, "UserScript")}>
                  <Copy size={15} />
                  コピー
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => downloadText(`sns-browser-${activeSiteId}.user.js`, userScript)}
                >
                  <Download size={15} />
                  UserScript
                </button>
              </div>
            </section>

            <div className="export-preview">
              <strong>対象</strong>
              <code>{activeExportTarget.matches.join(", ")}</code>
            </div>
            {exportMessage ? <p className="export-message">{exportMessage}</p> : null}
          </div>
        )}
      </div>

      <div className="panel-actions">
        <button className="secondary-button" type="button" onClick={onApply}>
          <RotateCcw size={15} />
          適用
        </button>
        <button className="primary-button" type="button" onClick={onSave}>
          {dirty ? <Save size={15} /> : <Check size={15} />}
          保存
        </button>
      </div>

      {tooltip
        ? createPortal(
            <div
              className={`floating-tooltip is-${tooltip.placement}`}
              role="tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}
