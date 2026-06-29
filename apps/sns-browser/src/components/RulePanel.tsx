import Editor from "@monaco-editor/react";
import { Check, CircleHelp, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { BrowserRule } from "../lib/types";

interface RulePanelProps {
  rules: BrowserRule[];
  onRulesChange: (rules: BrowserRule[], options?: { persist?: boolean }) => void;
  onSave: () => void;
  onApply: () => void;
  dirty: boolean;
}

type RulePanelTab = "presets" | "editor";

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: "top" | "bottom";
}

export function RulePanel({ rules, onRulesChange, onSave, onApply, dirty }: RulePanelProps) {
  const cssRules = useMemo(() => rules.filter((rule) => rule.type === "css" && rule.visible !== false), [rules]);
  const sidebarRules = useMemo(() => cssRules.filter((rule) => rule.name.startsWith("左サイドバー:")), [cssRules]);
  const timelineRules = useMemo(() => cssRules.filter((rule) => rule.name.startsWith("タイムライン投稿:")), [cssRules]);
  const composerRules = useMemo(() => cssRules.filter((rule) => rule.name.startsWith("ポスト作成:")), [cssRules]);
  const generalRules = useMemo(
    () =>
      cssRules.filter(
        (rule) =>
          !rule.name.startsWith("左サイドバー:") &&
          !rule.name.startsWith("タイムライン投稿:") &&
          !rule.name.startsWith("ポスト作成:"),
      ),
    [cssRules],
  );
  const [activeTab, setActiveTab] = useState<RulePanelTab>("presets");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!cssRules.length) {
      setSelectedRuleId(null);
      return;
    }
    if (!selectedRuleId || !cssRules.some((rule) => rule.id === selectedRuleId)) {
      setSelectedRuleId(cssRules[0].id);
    }
  }, [cssRules, selectedRuleId]);

  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? cssRules[0] ?? null;

  function updateRule(ruleId: string, patch: Partial<BrowserRule>, options?: { persist?: boolean }) {
    onRulesChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)), options);
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
      .replace("タイムライン投稿: ", "")
      .replace("ポスト作成: ", "");

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

  return (
    <aside className="rule-panel">
      <div className="panel-header">
        <div>
          <h2>CSS 設定</h2>
          <p>プリセットの切り替えと詳細 CSS 編集を行います。</p>
        </div>
        {dirty ? <span className="dirty-badge">未保存</span> : <span className="saved-badge">保存済み</span>}
      </div>

      <div className="rule-tabs" role="tablist" aria-label="CSS 設定の表示切り替え">
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
          詳細 CSS
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
          </div>
        ) : (
          <div className="editor-tab" role="tabpanel" aria-label="詳細 CSS">
            <div className="rule-list">
              {cssRules.map((rule) => (
                <button
                  className={`rule-item ${rule.id === selectedRule?.id ? "is-active" : ""}`}
                  type="button"
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                >
                  <span>
                    <strong>{rule.name}</strong>
                    <small>{rule.enabled ? "ON" : "OFF"}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="editor-shell">
              {selectedRule ? (
                <Editor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={selectedRule.content}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                  onChange={(value) => updateRule(selectedRule.id, { content: value ?? "" })}
                />
              ) : (
                <div className="empty-editor">CSS ルールがありません。</div>
              )}
            </div>
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
