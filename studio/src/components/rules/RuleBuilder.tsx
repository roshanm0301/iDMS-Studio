// ============================================================
// iDMS Admin Studio — Rule Builder
// Split-pane editor: rule list on the left, full rule editor
// (form / code / graph view) on the right.
// ============================================================
import React, { useState, useMemo, useRef } from 'react';
import {
  Save, Send, Eye, Code2, GitBranch, Plus, Trash2,
  FlaskConical, CheckCircle2, XCircle, Info, FileText, X,
} from 'lucide-react';
import { getRules, getRule } from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import LayerBadge from '../ui/LayerBadge';
import StatusTag from '../ui/StatusTag';
import RulesList from './RulesList';
import type { RuleDefinition, RuleCondition, RuleAction, LayerCode } from '../../types';

// ─── Types ────────────────────────────────────────────────────
type ViewMode = 'form' | 'code' | 'graph';

// Draft copy of a rule used for local edits
interface DraftRule extends RuleDefinition {
  _dirty: boolean;
}

// ─── Constants ────────────────────────────────────────────────
const OPERATORS = [
  { value: 'EQ',          label: '= equals' },
  { value: 'NEQ',         label: '≠ not equals' },
  { value: 'GT',          label: '> greater than' },
  { value: 'GTE',         label: '>= greater or equal' },
  { value: 'LT',          label: '< less than' },
  { value: 'LTE',         label: '<= less or equal' },
  { value: 'IS_NULL',     label: 'is empty' },
  { value: 'IS_NOT_NULL', label: 'is not empty' },
  { value: 'contains',    label: 'contains' },
  { value: 'startsWith',  label: 'starts with' },
  { value: 'in',          label: 'in (comma list)' },
];

const ACTION_TYPES: RuleAction[] = ['BLOCK', 'WARN', 'SET_FIELD', 'ROUTE', 'NOTIFY'];

const ACTION_TYPE_COLORS: Record<string, React.CSSProperties> = {
  BLOCK:      { background: '#FEF2F2', color: '#B91C1C' },
  WARN:       { background: '#FFFBEB', color: '#92400E' },
  SET_FIELD:  { background: '#EFF6FF', color: '#1D4ED8' },
  ROUTE:      { background: '#F0FDF4', color: '#166534' },
  NOTIFY:     { background: '#F5F3FF', color: '#6D28D9' },
};

const RULE_STATUS_OPTIONS = ['active', 'draft', 'paused', 'archived'] as const;

// ─── DSL code generator ───────────────────────────────────────
function generateDSL(rule: DraftRule): string {
  const conditions = rule.conditions
    .map((c, i) => {
      const prefix = i === 0 ? 'WHEN' : (rule.combinator === 'AND' ? '  AND' : '   OR');
      const valStr = typeof c.value === 'string' ? `"${c.value}"` : String(c.value ?? '""');
      return `${prefix}  ${c.field}  ${c.op}  ${valStr}`;
    })
    .join('\n');

  const actionCfg = rule.action_config ?? {};
  let actionLines = `THEN  ${rule.action_type}`;
  if ((actionCfg as any).message)       actionLines += `\n        MESSAGE  "${(actionCfg as any).message}"`;
  if ((actionCfg as any).field)         actionLines += `\n        SET      ${(actionCfg as any).field} = ${(actionCfg as any).value}`;
  if ((actionCfg as any).workflow_key)  actionLines += `\n        WORKFLOW ${(actionCfg as any).workflow_key}`;

  return [
    `RULE  "${rule.rule_name}"`,
    `  ID           ${rule.rule_id}`,
    `  ENTITY       ${rule.entity_type}`,
    `  TRIGGER      ${rule.trigger}`,
    `  LAYER        ${rule.layer}`,
    `  PRIORITY     ${rule.priority_order}`,
    `  COMBINATOR   ${rule.combinator}`,
    `  VERSION      ${rule.version ?? 1}`,
    ``,
    conditions,
    ``,
    actionLines,
  ].join('\n');
}

// ─── DSL syntax highlighting (inline spans) ──────────────────
function HighlightedDSL({ code }: { code: string }) {
  const keywords = ['RULE', 'WHEN', 'AND', 'OR', 'THEN', 'ID', 'ENTITY', 'TRIGGER', 'LAYER', 'PRIORITY', 'COMBINATOR', 'VERSION', 'MESSAGE', 'SET', 'WORKFLOW', 'BLOCK', 'WARN', 'SET_FIELD', 'ROUTE', 'NOTIFY'];
  const lines = code.split('\n');

  return (
    <pre className="code-block" style={{ margin: 0, lineHeight: 1.7, fontSize: 13 }}>
      {lines.map((line, li) => {
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let key = 0;

        while (remaining.length > 0) {
          let matched = false;

          // Strings
          const strMatch = remaining.match(/^("(?:[^"\\]|\\.)*")/);
          if (strMatch) {
            parts.push(<span key={key++} style={{ color: 'var(--dsl-string, #16A34A)' }}>{strMatch[1]}</span>);
            remaining = remaining.slice(strMatch[1].length);
            matched = true;
          }

          if (!matched) {
            // Number
            const numMatch = remaining.match(/^(\d+(?:\.\d+)?)/);
            if (numMatch) {
              parts.push(<span key={key++} style={{ color: 'var(--dsl-number, #9333EA)' }}>{numMatch[1]}</span>);
              remaining = remaining.slice(numMatch[1].length);
              matched = true;
            }
          }

          if (!matched) {
            // Keyword
            let kwMatched = false;
            for (const kw of keywords) {
              if (remaining.startsWith(kw) && (remaining.length === kw.length || !/\w/.test(remaining[kw.length]))) {
                parts.push(<span key={key++} style={{ color: 'var(--dsl-keyword, #2563EB)', fontWeight: 700 }}>{kw}</span>);
                remaining = remaining.slice(kw.length);
                kwMatched = true;
                matched = true;
                break;
              }
            }
          }

          if (!matched) {
            // Consume one character
            parts.push(<span key={key++}>{remaining[0]}</span>);
            remaining = remaining.slice(1);
          }
        }

        return <div key={li}>{parts.length > 0 ? parts : ' '}</div>;
      })}
    </pre>
  );
}

// ─── Condition Row ────────────────────────────────────────────
interface ConditionRowProps {
  cond: RuleCondition;
  index: number;
  onChange: (updated: RuleCondition) => void;
  onDelete: () => void;
}

function ConditionRow({ cond, index, onChange, onDelete }: ConditionRowProps) {
  const needsValue = !['IS_NULL', 'IS_NOT_NULL'].includes(cond.op);

  return (
    <div className="cond-row">
      <span className="cond-num">{index + 1}</span>
      <div className="cond-fields">
        {/* Field path */}
        <div className="field-select" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="field-icon"><FileText size={13} /></span>
          <input
            className="value-input mono"
            style={{ fontSize: 12, minWidth: 160 }}
            placeholder="field.path"
            value={cond.field}
            onChange={(e) => onChange({ ...cond, field: e.target.value })}
          />
        </div>

        {/* Operator */}
        <select
          className="op-select"
          value={cond.op}
          onChange={(e) => onChange({ ...cond, op: e.target.value })}
        >
          {OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>

        {/* Value */}
        {needsValue && (
          <input
            className="value-input"
            style={{ fontSize: 13 }}
            placeholder="value"
            value={String(cond.value ?? '')}
            onChange={(e) => onChange({ ...cond, value: e.target.value })}
          />
        )}
        {!needsValue && (
          <span className="muted" style={{ fontSize: 12, fontStyle: 'italic', paddingLeft: 4 }}>
            (no value needed)
          </span>
        )}
      </div>
      <div className="cond-actions">
        <button
          className="btn btn-sm btn-ghost"
          style={{ color: 'var(--color-danger, #EF4444)', padding: '2px 6px' }}
          title="Delete condition"
          onClick={onDelete}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Action Row ───────────────────────────────────────────────
interface ActionRowProps {
  actionType: RuleAction;
  actionConfig: Record<string, unknown>;
  onChangeType: (t: RuleAction) => void;
  onChangeConfig: (cfg: Record<string, unknown>) => void;
}

function ActionRow({ actionType, actionConfig, onChangeType, onChangeConfig }: ActionRowProps) {
  const style = ACTION_TYPE_COLORS[actionType] ?? {};

  return (
    <div className="action-row">
      <span className="action-icon" style={{ ...style, borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>
        {actionType}
      </span>
      <div className="action-fields">
        <select
          className="op-select"
          value={actionType}
          onChange={(e) => onChangeType(e.target.value as RuleAction)}
          style={{ fontWeight: 600, minWidth: 130 }}
        >
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {(actionType === 'BLOCK' || actionType === 'WARN') && (
          <input
            className="value-input"
            style={{ flex: 1, fontSize: 13 }}
            placeholder="User-facing message…"
            value={String(actionConfig.message ?? '')}
            onChange={(e) => onChangeConfig({ ...actionConfig, message: e.target.value })}
          />
        )}

        {actionType === 'SET_FIELD' && (
          <>
            <input
              className="value-input mono"
              style={{ width: 150, fontSize: 12 }}
              placeholder="field.path"
              value={String(actionConfig.field ?? '')}
              onChange={(e) => onChangeConfig({ ...actionConfig, field: e.target.value })}
            />
            <span className="muted" style={{ fontSize: 12 }}>=</span>
            <input
              className="value-input"
              style={{ width: 120, fontSize: 13 }}
              placeholder="value"
              value={String(actionConfig.value ?? '')}
              onChange={(e) => onChangeConfig({ ...actionConfig, value: e.target.value })}
            />
          </>
        )}

        {actionType === 'ROUTE' && (
          <input
            className="value-input"
            style={{ flex: 1, fontSize: 13 }}
            placeholder="Route to state or queue…"
            value={String(actionConfig.route_to ?? '')}
            onChange={(e) => onChangeConfig({ ...actionConfig, route_to: e.target.value })}
          />
        )}

        {actionType === 'NOTIFY' && (
          <input
            className="value-input"
            style={{ flex: 1, fontSize: 13 }}
            placeholder="Notification channel or role…"
            value={String(actionConfig.notify_role ?? '')}
            onChange={(e) => onChangeConfig({ ...actionConfig, notify_role: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Test Panel ───────────────────────────────────────────────
interface TestPanelProps {
  rule: DraftRule;
  onClose: () => void;
}

function TestPanel({ rule, onClose }: TestPanelProps) {
  const [payload, setPayload]     = useState<string>(() =>
    JSON.stringify({ entity_type: rule.entity_type, total_amount: 600000, vehicle_model: 'Pulsar N160' }, null, 2),
  );
  const [result, setResult]       = useState<{ matched: boolean; detail: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function runTest() {
    try {
      const parsed = JSON.parse(payload);
      setParseError(null);
      // Very simple simulation: check each condition
      const condResults = rule.conditions.map((c) => {
        const parts = c.field.split('.');
        const val = parts.reduce((o: any, k) => (o == null ? undefined : o[k]), parsed);
        return { field: c.field, val, op: c.op, expected: c.value };
      });
      const matched = condResults.length === 0 ? false :
        rule.combinator === 'OR'
          ? condResults.some((_r) => true) // simplified
          : condResults.every((_r) => true);
      setResult({
        matched,
        detail: condResults
          .map((r) => `${r.field} [${r.op}] "${r.expected}" → got "${r.val}"`)
          .join('\n'),
      });
    } catch (err: any) {
      setParseError(err.message);
    }
  }

  return (
    <div
      className="card"
      style={{
        marginTop: 16,
        border: '1px solid var(--color-primary-light, #C7D2FE)',
        background: 'var(--color-surface-alt, #F8FAFC)',
      }}
    >
      <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FlaskConical size={15} /> Test Rule
        </span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          <XCircle size={14} />
        </button>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label className="section-label" style={{ fontSize: 12 }}>Payload (JSON)</label>
        <textarea
          className="value-input mono"
          rows={8}
          style={{ fontSize: 12, resize: 'vertical', fontFamily: 'var(--font-mono, monospace)' }}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          spellCheck={false}
        />
        {parseError && (
          <p style={{ color: 'var(--color-danger, #EF4444)', fontSize: 12, margin: 0 }}>{parseError}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-primary" onClick={runTest} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlaskConical size={13} /> Run Test
          </button>
        </div>
        {result && (
          <div
            style={{
              borderRadius: 6,
              padding: '10px 14px',
              background: result.matched ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${result.matched ? '#86EFAC' : '#FECACA'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 6 }}>
              {result.matched
                ? <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                : <XCircle size={14} style={{ color: '#DC2626' }} />}
              <span style={{ fontSize: 13, color: result.matched ? '#166534' : '#991B1B' }}>
                {result.matched ? 'Rule MATCHED — action would fire' : 'Rule DID NOT MATCH'}
              </span>
            </div>
            <pre className="mono" style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', opacity: 0.85 }}>
              {result.detail || '(no conditions defined)'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Graph View (placeholder) ─────────────────────────────────
function GraphView({ rule }: { rule: DraftRule }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
        border: '2px dashed var(--color-border, #E5E7EB)',
        borderRadius: 8,
        background: 'var(--color-surface-alt, #F8FAFC)',
        minHeight: 240,
      }}
    >
      <GitBranch size={36} style={{ opacity: 0.3 }} />
      <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
        Graph view renders a visual condition tree for <strong>{rule.rule_name}</strong>.<br />
        Interactive canvas coming in a future release.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {rule.conditions.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid var(--color-border, #E5E7EB)',
              borderRadius: 6,
              fontSize: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span className="chip draft" style={{ fontSize: 10 }}>Cond {i + 1}</span>
            <span className="mono" style={{ fontSize: 11 }}>{c.field}</span>
            <span className="muted" style={{ fontSize: 11 }}>{c.op} {String(c.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rule Editor (right pane) ─────────────────────────────────
interface RuleEditorProps {
  ruleId: string;
}

function RuleEditor({ ruleId }: RuleEditorProps) {
  const savedRules = useStudioStore(s => s.savedRules);
  const rawFromService = useMemo(() => getRule(ruleId), [ruleId]);
  const raw = savedRules[ruleId] ?? rawFromService;

  // Normalize raw seed rule to a usable DraftRule (or pass through stored DraftRule directly)
  const initial = useMemo<DraftRule | null>(() => {
    if (!raw) return null;
    // Already a DraftRule from store (has rule_id directly)
    if ((raw as any)._dirty !== undefined) return raw as DraftRule;
    const rj = (raw as any).rule_json ?? raw;
    const base: RuleDefinition = {
      rule_id:       rj.id ?? rj.rule_id ?? ruleId,
      rule_name:     rj.name ?? rj.rule_name ?? 'Unnamed Rule',
      description:   (raw as any).business_intent ?? rj.description ?? '',
      entity_type:   rj.entity_type ?? '',
      trigger:       rj.trigger ?? 'BEFORE_SUBMIT',
      layer:         ((raw as any).layer ?? rj.layer ?? 'platform') as LayerCode,
      priority_order:rj.priority ?? rj.priority_order ?? 0,
      priority:      rj.priority_level ?? 'medium',
      status:        rj.enabled === false ? 'paused' : (rj.status ?? 'active'),
      combinator:    rj.combinator ?? 'AND',
      conditions: (rj.conditions ?? []).map((c: any, i: number) => ({
        id:    c.id ?? `cond_${i}`,
        field: c.field ?? '',
        op:    c.op ?? 'EQ',
        value: c.value ?? '',
      })),
      action_type:   ((raw as any).enforcement_level ?? rj.action?.type ?? rj.action_type ?? 'BLOCK') as RuleAction,
      action_config: rj.action ?? {},
      message:       rj.action?.message,
      business_intent: (raw as any).business_intent,
      risk_mitigated:  (raw as any).risk_mitigated,
      version:       rj.version ?? 1,
      last_edited:   rj.last_edited,
    };
    return { ...base, _dirty: false };
  }, [raw, ruleId]);

  const [draft, setDraft]       = useState<DraftRule | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [showTest, setShowTest] = useState(false);
  const saveTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize/reset draft when ruleId changes
  const activeDraft = draft ?? initial;

  function update(partial: Partial<DraftRule>) {
    const base = activeDraft ?? ({} as DraftRule);
    setDraft({ ...base, ...partial, _dirty: true } as DraftRule);
  }

  const saveRule = useStudioStore(s => s.saveRule);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleSaveDraft() {
    if (!activeDraft) return;
    const saved = { ...activeDraft, _dirty: false };
    setDraft(saved);
    saveRule(saved);
  }

  function handlePublish() {
    if (!activeDraft) return;
    const published = { ...activeDraft, status: 'active' as any, _dirty: false };
    setDraft(published);
    saveRule(published);
  }

  // Condition helpers
  function addCondition() {
    const conds = [...(activeDraft?.conditions ?? [])];
    conds.push({ id: `cond_${Date.now()}`, field: '', op: 'EQ', value: '' });
    update({ conditions: conds });
  }

  function updateCondition(idx: number, c: RuleCondition) {
    const conds = [...(activeDraft?.conditions ?? [])];
    conds[idx] = c;
    update({ conditions: conds });
  }

  function deleteCondition(idx: number) {
    const conds = [...(activeDraft?.conditions ?? [])];
    conds.splice(idx, 1);
    update({ conditions: conds });
  }

  if (!activeDraft) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p className="muted">Rule not found: <span className="mono">{ruleId}</span></p>
      </div>
    );
  }

  const dslCode = generateDSL(activeDraft);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '0 0 32px' }}>
      {/* ── Rule header ── */}
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          {/* Title */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="title-input"
              style={{ width: '100%', fontSize: 18, fontWeight: 700 }}
              value={activeDraft.rule_name}
              onChange={(e) => update({ rule_name: e.target.value })}
              placeholder="Rule name…"
            />
            <div className="rule-meta" style={{ marginTop: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                {activeDraft.entity_type} · v{activeDraft.version ?? 1}
              </span>
            </div>
          </div>

          {/* Badges & controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <StatusTag status={activeDraft.status as any} />
            <LayerBadge layer={activeDraft.layer} small />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 10 }}>
          <input
            className="value-input rule-meta-desc"
            style={{ width: '100%', fontSize: 13 }}
            placeholder="Short description of this rule…"
            value={activeDraft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowTest((v) => !v)}
          >
            <FlaskConical size={13} />
            {showTest ? 'Hide Test Panel' : 'Test Rule'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={13} /> Preview DSL
          </button>
          <div style={{ flex: 1 }} />
          {activeDraft._dirty && (
            <span className="chip draft" style={{ fontSize: 11 }}>Unsaved changes</span>
          )}
          <button
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleSaveDraft}
          >
            <Save size={13} /> Save Draft
          </button>
          <button
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handlePublish}
          >
            <Send size={13} /> Publish
          </button>
        </div>
      </div>

      {/* ── View mode toggle ── */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 16,
          borderBottom: '1px solid var(--color-border, #E5E7EB)',
          paddingBottom: 0,
        }}
      >
        {(['form', 'code', 'graph'] as ViewMode[]).map((m) => {
          const Icon = m === 'form' ? FileText : m === 'code' ? Code2 : GitBranch;
          return (
            <button
              key={m}
              className={viewMode === m ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 'var(--radius, 6px) var(--radius, 6px) 0 0',
                borderBottom: viewMode === m ? '2px solid var(--color-primary, #6366F1)' : '2px solid transparent',
                textTransform: 'capitalize',
              }}
              onClick={() => setViewMode(m)}
            >
              <Icon size={13} />
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          );
        })}
      </div>

      {/* ── Test panel ── */}
      {showTest && <TestPanel rule={activeDraft} onClose={() => setShowTest(false)} />}

      {/* ── Form view ── */}
      {viewMode === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* WHEN section */}
          <section className="builder-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="section-label-pill pill-when">
                <span className="section-label-text">WHEN</span>
              </div>
              {/* Combinator toggle */}
              <div className="combinator-bar" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span className="muted" style={{ fontSize: 12 }}>Combine with:</span>
                <div style={{ display: 'flex', border: '1px solid var(--color-border, #E5E7EB)', borderRadius: 6, overflow: 'hidden' }}>
                  {(['AND', 'OR'] as const).map((op) => (
                    <button
                      key={op}
                      className={activeDraft.combinator === op ? 'combinator-toggle active btn btn-sm btn-primary' : 'combinator-toggle btn btn-sm btn-ghost'}
                      style={{ borderRadius: 0, padding: '3px 14px', fontWeight: 700, fontSize: 12 }}
                      onClick={() => update({ combinator: op })}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="condition-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDraft.conditions.length === 0 && (
                <p className="muted" style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                  No conditions defined. Add one below.
                </p>
              )}
              {activeDraft.conditions.map((cond, idx) => (
                <ConditionRow
                  key={cond.id}
                  cond={cond}
                  index={idx}
                  onChange={(c) => updateCondition(idx, c)}
                  onDelete={() => deleteCondition(idx)}
                />
              ))}
            </div>

            <div className="add-cond-row" style={{ marginTop: 10 }}>
              <button
                className="add-cond-btn btn btn-sm btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, borderStyle: 'dashed' }}
                onClick={addCondition}
              >
                <Plus size={13} /> Add condition
              </button>
            </div>
          </section>

          {/* THEN section */}
          <section className="builder-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="section-label-pill pill-then">
                <span className="section-label-text">THEN</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ActionRow
                actionType={activeDraft.action_type}
                actionConfig={activeDraft.action_config}
                onChangeType={(t) => update({ action_type: t })}
                onChangeConfig={(cfg) => update({ action_config: cfg })}
              />
            </div>
          </section>

          {/* Business Intent + Risk */}
          <section className="builder-section">
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Info size={14} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Policy Context</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="section-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                  Business Intent
                </label>
                <textarea
                  className="value-input"
                  rows={2}
                  style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                  placeholder="What business outcome does this rule enforce?"
                  value={activeDraft.business_intent ?? ''}
                  onChange={(e) => update({ business_intent: e.target.value })}
                />
              </div>
              <div>
                <label className="section-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                  Risk Mitigated
                </label>
                <textarea
                  className="value-input"
                  rows={2}
                  style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                  placeholder="What can go wrong without this rule?"
                  value={activeDraft.risk_mitigated ?? ''}
                  onChange={(e) => update({ risk_mitigated: e.target.value })}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Code view ── */}
      {viewMode === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            DSL representation of the current rule definition.
          </p>
          <HighlightedDSL code={dslCode} />
        </div>
      )}

      {/* ── Graph view ── */}
      {viewMode === 'graph' && <GraphView rule={activeDraft} />}

      {/* ── DSL Preview Modal ── */}
      {previewOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
          <div style={{
            background: 'var(--panel)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            width: 680,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>DSL Preview — {activeDraft.rule_name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOpen(false)}><X size={15} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <HighlightedDSL code={dslCode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rule Builder (root component) ───────────────────────────
interface RuleBuilderProps {
  artifactKey: string;
}

function makeBlankRule(artifactKey: string): DraftRule {
  const entityType = artifactKey.replace('entity.', '');
  const newId = `rule_new_${Date.now()}`;
  return {
    rule_id: newId,
    rule_name: 'New Rule',
    description: '',
    entity_type: entityType,
    trigger: 'BEFORE_SUBMIT',
    layer: 'tenant' as LayerCode,
    priority_order: 50,
    priority: 'medium',
    status: 'draft',
    combinator: 'AND',
    conditions: [],
    action_type: 'BLOCK' as RuleAction,
    action_config: { message: '' },
    version: 1,
    _dirty: true,
  };
}

export default function RuleBuilder({ artifactKey }: RuleBuilderProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [newRuleId, setNewRuleId] = useState<string | null>(null);
  const saveRule = useStudioStore(s => s.saveRule);
  const savedRules = useStudioStore(s => s.savedRules);

  // Pre-select first rule on first render
  const firstRuleId = useMemo(() => {
    const entityType = artifactKey.replace('entity.', '');
    const rules = getRules(entityType);
    if (rules.length === 0) return null;
    const first = rules[0] as any;
    return (first.rule_json?.id ?? first.rule_json?.rule_id ?? first.rule_id ?? null);
  }, [artifactKey]);

  const activeId = selectedRuleId ?? newRuleId ?? firstRuleId;

  function handleOpenRule(id: string) {
    setSelectedRuleId(id);
    setNewRuleId(null);
  }

  function handleNewRule() {
    const blank = makeBlankRule(artifactKey);
    saveRule(blank);
    setNewRuleId(blank.rule_id);
    setSelectedRuleId(blank.rule_id);
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* Left pane — 30% rule list */}
      <div
        style={{
          width: '30%',
          minWidth: 220,
          maxWidth: 340,
          borderRight: '1px solid var(--color-border, #E5E7EB)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface-alt, #F8FAFC)',
          overflow: 'hidden',
        }}
      >
        <div
          className="panel-header"
          style={{
            padding: '14px 12px 10px',
            borderBottom: '1px solid var(--color-border, #E5E7EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13 }}>Rules</span>
          <button
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px' }}
            onClick={handleNewRule}
          >
            <Plus size={13} /> New
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <RulesList
            artifactKey={artifactKey}
            onOpenRule={handleOpenRule}
            compact
            selectedRuleId={activeId}
          />
        </div>
      </div>

      {/* Right pane — 70% rule editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px 24px',
        }}
      >
        {activeId ? (
          <RuleEditor key={activeId} ruleId={activeId} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              opacity: 0.6,
            }}
          >
            <GitBranch size={40} />
            <p className="muted" style={{ margin: 0 }}>Select a rule on the left to open the editor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
