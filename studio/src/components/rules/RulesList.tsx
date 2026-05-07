// ============================================================
// iDMS Admin Studio — Rules List
// Filterable, searchable table of business rules for an entity.
// ============================================================
import React, { useState, useMemo } from 'react';
import { Search, X, AlertOctagon, AlertTriangle, Settings2, GitMerge, Bell, Layers } from 'lucide-react';
import { getRules } from '../../data/mockService';
import LayerBadge from '../ui/LayerBadge';
import type { RuleDefinition, RuleAction, RuleTrigger, LayerCode } from '../../types';

// ─── Constants ────────────────────────────────────────────────
const ACTION_TYPES: RuleAction[] = ['BLOCK', 'WARN', 'SET_FIELD', 'ROUTE', 'NOTIFY'];
const TRIGGER_OPTIONS: RuleTrigger[] = [
  'BEFORE_CREATE', 'BEFORE_UPDATE', 'BEFORE_SUBMIT',
  'BEFORE_APPROVE', 'BEFORE_CANCEL', 'BEFORE_DELETE',
  'AFTER_CREATE', 'AFTER_SUBMIT', 'AFTER_APPROVE', 'ON_FIELD_CHANGE',
];
const LAYER_OPTIONS: LayerCode[] = ['platform', 'vertical', 'tenant', 'node', 'role'];

// ─── Helpers ──────────────────────────────────────────────────
function actionTagClass(action: string): string {
  switch (action) {
    case 'BLOCK':      return 'tag red';
    case 'WARN':       return 'tag amber';
    case 'SET_FIELD':  return 'tag';   // blue via custom style
    case 'ROUTE':      return 'tag green';
    case 'NOTIFY':     return 'tag';
    default:           return 'tag';
  }
}

function actionTagStyle(action: string): React.CSSProperties {
  if (action === 'SET_FIELD') return { background: 'var(--color-blue-light, #DBEAFE)', color: 'var(--color-blue, #1D4ED8)' };
  if (action === 'NOTIFY')    return { background: 'var(--color-purple-light, #EDE9FE)', color: 'var(--color-purple, #6D28D9)' };
  if (action === 'START_WORKFLOW') return { background: 'var(--color-indigo-light, #E0E7FF)', color: 'var(--color-indigo, #4338CA)' };
  return {};
}

function actionIcon(action: string): React.ReactNode {
  switch (action) {
    case 'BLOCK':     return <AlertOctagon size={12} />;
    case 'WARN':      return <AlertTriangle size={12} />;
    case 'SET_FIELD': return <Settings2 size={12} />;
    case 'ROUTE':     return <GitMerge size={12} />;
    case 'NOTIFY':    return <Bell size={12} />;
    default:          return null;
  }
}

function statusChipClass(status: string): string {
  switch (status) {
    case 'active':   return 'chip inherited';
    case 'draft':    return 'chip draft';
    case 'paused':   return 'chip overridden';
    case 'archived': return 'chip protected';
    default:         return 'chip draft';
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return dateStr;
  }
}

function normalizeRule(raw: any): RuleDefinition & { _raw: any } {
  // Seed data embeds rules in rule_json sub-object; handle both shapes.
  const rj = raw.rule_json ?? raw;
  return {
    rule_id:       rj.id ?? rj.rule_id ?? '',
    rule_name:     rj.name ?? rj.rule_name ?? 'Unnamed Rule',
    description:   raw.business_intent ?? rj.description ?? '',
    entity_type:   rj.entity_type ?? '',
    trigger:       rj.trigger ?? 'BEFORE_SUBMIT',
    layer:         (raw.layer ?? rj.layer ?? 'platform') as LayerCode,
    priority_order:rj.priority ?? rj.priority_order ?? 0,
    priority:      rj.priority_level ?? 'medium',
    status:        rj.enabled === false ? 'paused' : (rj.status ?? 'active'),
    combinator:    rj.combinator ?? (rj.condition?.op === 'AND' ? 'AND' : 'OR'),
    conditions:    rj.conditions ?? [],
    action_type:   (raw.enforcement_level ?? rj.action?.type ?? rj.action_type ?? 'BLOCK') as RuleAction,
    action_config: rj.action ?? {},
    message:       rj.action?.message,
    business_intent: raw.business_intent,
    risk_mitigated:  raw.risk_mitigated,
    last_edited:   rj.last_edited,
    version:       rj.version,
    _raw:          raw,
  } as any;
}

// ─── Filter Chip ──────────────────────────────────────────────
interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <button
      onClick={onToggle}
      className={active ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
      style={{ padding: '3px 10px', fontSize: 12 }}
    >
      {label}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <tr>
      <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
        <Layers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p className="muted" style={{ margin: 0 }}>
          {query ? `No rules match "${query}"` : 'No rules defined for this entity.'}
        </p>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────
interface RulesListProps {
  artifactKey: string;
  onOpenRule: (ruleId: string) => void;
  compact?: boolean;
  selectedRuleId?: string | null;
}

export default function RulesList({ artifactKey, onOpenRule, compact = false, selectedRuleId }: RulesListProps) {
  const [search, setSearch]             = useState('');
  const [actionFilters, setActionFilters] = useState<Set<string>>(new Set());
  const [triggerFilters, setTriggerFilters] = useState<Set<string>>(new Set());
  const [layerFilters, setLayerFilters] = useState<Set<string>>(new Set());

  const entityType = useMemo(
    () => artifactKey.replace('entity.', '').replace('rule.', ''),
    [artifactKey],
  );

  const rawRules = useMemo(() => getRules(entityType), [entityType]);

  const rules = useMemo(() => rawRules.map(normalizeRule), [rawRules]);

  const filtered = useMemo(() => {
    let list = rules;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.rule_name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.rule_id.toLowerCase().includes(q),
      );
    }

    if (actionFilters.size > 0) {
      list = list.filter((r) => actionFilters.has(r.action_type));
    }
    if (triggerFilters.size > 0) {
      list = list.filter((r) => triggerFilters.has(r.trigger));
    }
    if (layerFilters.size > 0) {
      list = list.filter((r) => layerFilters.has(r.layer));
    }

    return list;
  }, [rules, search, actionFilters, triggerFilters, layerFilters]);

  function toggleFilter<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  }

  function clearAll() {
    setSearch('');
    setActionFilters(new Set());
    setTriggerFilters(new Set());
    setLayerFilters(new Set());
  }

  const hasFilters = search || actionFilters.size > 0 || triggerFilters.size > 0 || layerFilters.size > 0;

  // ── Compact list mode (used inside RuleBuilder left panel) ──
  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--color-border, #E5E7EB)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} />
            <input
              className="value-input"
              style={{ paddingLeft: 28, width: '100%', fontSize: 13 }}
              placeholder="Search rules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center', padding: 20, fontSize: 13 }}>No rules found.</p>
          ) : (
            filtered.map((rule) => (
              <button
                key={rule.rule_id}
                onClick={() => onOpenRule(rule.rule_id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--color-border, #E5E7EB)',
                  background: selectedRuleId === rule.rule_id ? 'var(--color-primary-light, #EEF2FF)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span
                    className={actionTagClass(rule.action_type)}
                    style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3, ...actionTagStyle(rule.action_type) }}
                  >
                    {actionIcon(rule.action_type)}
                    {rule.action_type}
                  </span>
                  <LayerBadge layer={rule.layer} small />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{rule.rule_name}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{rule.trigger}</div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Full list mode ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} />
            <input
              className="value-input"
              style={{ paddingLeft: 32, width: '100%' }}
              placeholder="Search rules by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hasFilters && (
            <button className="btn btn-sm btn-ghost" onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Filter row: Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="section-label" style={{ fontSize: 11, marginRight: 2 }}>Action:</span>
          {ACTION_TYPES.map((a) => (
            <FilterChip
              key={a}
              label={a}
              active={actionFilters.has(a)}
              onToggle={() => toggleFilter(actionFilters, a, setActionFilters)}
            />
          ))}
        </div>

        {/* Filter row: Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="section-label" style={{ fontSize: 11, marginRight: 2 }}>Trigger:</span>
          {TRIGGER_OPTIONS.slice(0, 6).map((t) => (
            <FilterChip
              key={t}
              label={t.replace('BEFORE_', 'PRE ').replace('AFTER_', 'POST ').replace('ON_', 'ON ')}
              active={triggerFilters.has(t)}
              onToggle={() => toggleFilter(triggerFilters, t, setTriggerFilters)}
            />
          ))}
        </div>

        {/* Filter row: Layer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="section-label" style={{ fontSize: 11, marginRight: 2 }}>Layer:</span>
          {LAYER_OPTIONS.map((l) => (
            <FilterChip
              key={l}
              label={l.charAt(0).toUpperCase() + l.slice(1)}
              active={layerFilters.has(l)}
              onToggle={() => toggleFilter(layerFilters, l, setLayerFilters)}
            />
          ))}
        </div>
      </div>

      {/* Result count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {filtered.length} of {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="schema-table">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Entity Type</th>
              <th>Trigger</th>
              <th>Action</th>
              <th>Layer</th>
              <th style={{ textAlign: 'center' }}>Priority</th>
              <th>Status</th>
              <th>Last Edited</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyState query={search} />
            ) : (
              filtered.map((rule) => (
                <tr
                  key={rule.rule_id}
                  onClick={() => onOpenRule(rule.rule_id)}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpenRule(rule.rule_id)}
                >
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.rule_name}</div>
                    <div className="mono muted" style={{ fontSize: 11, marginTop: 2 }}>{rule.rule_id}</div>
                  </td>
                  <td>
                    <span className="chip inherited" style={{ fontSize: 11 }}>{rule.entity_type}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12 }}>{rule.trigger}</span>
                  </td>
                  <td>
                    <span
                      className={actionTagClass(rule.action_type)}
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, ...actionTagStyle(rule.action_type) }}
                    >
                      {actionIcon(rule.action_type)}
                      {rule.action_type}
                    </span>
                  </td>
                  <td>
                    <LayerBadge layer={rule.layer} small />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="muted mono" style={{ fontSize: 12 }}>{rule.priority_order}</span>
                  </td>
                  <td>
                    <span className={statusChipClass(rule.status)} style={{ fontSize: 11 }}>
                      {rule.status}
                    </span>
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: 12 }}>{formatDate(rule.last_edited)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
