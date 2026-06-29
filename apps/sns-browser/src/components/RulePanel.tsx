import Editor from "@monaco-editor/react";
import { Check, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BrowserRule } from "../lib/types";

interface RulePanelProps {
  rules: BrowserRule[];
  onRulesChange: (rules: BrowserRule[]) => void;
  onSave: () => void;
  onApply: () => void;
  dirty: boolean;
}

export function RulePanel({ rules, onRulesChange, onSave, onApply, dirty }: RulePanelProps) {
  const cssRules = useMemo(() => rules.filter((rule) => rule.type === "css"), [rules]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

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

  function updateRule(ruleId: string, patch: Partial<BrowserRule>) {
    onRulesChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
  }

  return (
    <aside className="rule-panel">
      <div className="panel-header">
        <div>
          <h2>CSS Rules</h2>
          <p>Monaco Editor で現在サイト用の CSS を編集します。</p>
        </div>
        {dirty ? <span className="dirty-badge">未保存</span> : <span className="saved-badge">保存済み</span>}
      </div>

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
              <small>{rule.description}</small>
            </span>
            <input
              type="checkbox"
              checked={rule.enabled}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })}
              aria-label={`${rule.name} を有効化`}
            />
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
    </aside>
  );
}
