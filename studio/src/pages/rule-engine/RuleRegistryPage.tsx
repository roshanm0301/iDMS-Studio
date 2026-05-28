import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Plus, Search, ArrowRight, Filter,
  CheckCircle2, Clock, FileEdit, Archive, XCircle, Eye, Send,
  ShieldCheck, Calculator, Receipt, Landmark, BookCheck, GitBranch, Users,
} from 'lucide-react';
import { getRuleFamilies, getRuleEngineStats } from '../../data/ruleEngineService';
import { useRuleEngineStore } from '../../hooks/useRuleEngineStore';
import type { RuleLifecycleState, RuleType } from '../../metadata/rule-platform-definition';
import { RULE_TYPES, RULE_LIFECYCLE_STATES } from '../../metadata/rule-platform-definition';

// ── Helpers ──────────────────────────────────────────────────
const RULE_TYPE_LABELS: Record<RuleType, string> = {
  validation: 'Validation',
  calculation: 'Calculation',
  charge: 'Charge',
  tax: 'Tax',
  accounting: 'Accounting',
  approval_decision: 'Approval Decision',
  workflow_decision: 'Workflow Decision',
  field_behavior: 'Field Behavior',
  output_rule: 'Output Rule',
  integration_rule: 'Integration',
};

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  validation: '#ef4444',
  calculation: '#3b82f6',
  charge: '#f59e0b',
  tax: '#10b981',
  accounting: '#8b5cf6',
  approval_decision: '#06b6d4',
  workflow_decision: '#6366f1',
  field_behavior: '#64748b',
  output_rule: '#f97316',
  integration_rule: '#14b8a6',
};

const LIFECYCLE_LABELS: Record<RuleLifecycleState, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  retired: 'Retired',
  rejected: 'Rejected',
  archived: 'Archived',
};

const LIFECYCLE_COLORS: Record<RuleLifecycleState, { bg: string; color: string }> = {
  draft: { bg: '#FEF3C7', color: '#92400E' },
  in_review: { bg: '#DBEAFE', color: '#1E40AF' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  published: { bg: '#D1FAE5', color: '#065F46' },
  retired: { bg: '#F3F4F6', color: '#6B7280' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
  archived: { bg: '#F3F4F6', color: '#9CA3AF' },
};

const LIFECYCLE_ICONS: Record<RuleLifecycleState, typeof CheckCircle2> = {
  draft: FileEdit,
  in_review: Send,
  approved: CheckCircle2,
  published: CheckCircle2,
  retired: Archive,
  rejected: XCircle,
  archived: Archive,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Sub-Engine Navigation ─────────────────────────────────────
const SUB_ENGINES = [
  { path: '/admin/studio/rule-engine/validations', label: 'Validations', icon: ShieldCheck },
  { path: '/admin/studio/rule-engine/calculations', label: 'Calculations', icon: Calculator },
  { path: '/admin/studio/rule-engine/charges', label: 'Charges', icon: Receipt },
  { path: '/admin/studio/rule-engine/tax', label: 'Tax', icon: Landmark },
  { path: '/admin/studio/rule-engine/accounting', label: 'Accounting', icon: BookCheck },
  { path: '/admin/studio/rule-engine/workflows', label: 'Workflows', icon: GitBranch },
  { path: '/admin/studio/rule-engine/approvals', label: 'Approvals', icon: Users },
];

const NEW_RULE_OPTIONS = [
  { path: '/admin/studio/rule-engine/validations/new', label: 'Validation Rule' },
  { path: '/admin/studio/rule-engine/calculations/new', label: 'Calculation Rule' },
  { path: '/admin/studio/rule-engine/charges/new', label: 'Charge / Discount Rule' },
  { path: '/admin/studio/rule-engine/tax/new', label: 'Tax Rule' },
  { path: '/admin/studio/rule-engine/accounting/new', label: 'Accounting Rule' },
  { path: '/admin/studio/rule-engine/approvals/new', label: 'Approval Policy' },
];

// ── Component ─────────────────────────────────────────────────
export default function RuleRegistryPage() {
  const navigate = useNavigate();
  const { filters, setFilter } = useRuleEngineStore();
  const stats = useMemo(() => getRuleEngineStats(), []);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const entries = useMemo(() => {
    return getRuleFamilies({
      ruleType: filters.ruleType === 'all' ? undefined : filters.ruleType,
      domain: filters.domain === 'all' ? undefined : filters.domain,
      entityType: filters.entityType === 'all' ? undefined : filters.entityType,
      search: filters.search || undefined,
    }).filter(e => {
      if (filters.lifecycleState !== 'all' && e.lifecycleState !== filters.lifecycleState) return false;
      return true;
    });
  }, [filters]);

  const domains = useMemo(
    () => [...new Set(getRuleFamilies().map(e => e.domain).filter(Boolean))] as string[],
    [],
  );

  return (
    <div className="content">
      {/* Header */}
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} />
              Rule Engine
            </h1>
            <div className="page-sub">
              {stats.totalFamilies} rule families · {stats.publishedCount} published · {stats.draftCount} drafts · {stats.inReviewCount} in review
            </div>
          </div>
          <div className="row" style={{ gap: 8, position: 'relative' }} ref={newMenuRef}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewMenu(v => !v)}>
              <Plus size={14} /> New Rule
            </button>
            {showNewMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
                minWidth: 220, padding: '6px 0',
              }}>
                {NEW_RULE_OPTIONS.map(opt => (
                  <div
                    key={opt.path}
                    onClick={() => { navigate(opt.path); setShowNewMenu(false); }}
                    style={{
                      padding: '8px 16px', cursor: 'pointer', fontSize: 13,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg, #f3f4f6)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Engine Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 24px 16px', flexWrap: 'wrap' }}>
        {SUB_ENGINES.map(eng => {
          const Icon = eng.icon;
          return (
            <button
              key={eng.path}
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(eng.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={14} />
              {eng.label}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, padding: '0 24px 16px' }}>
        {(Object.entries(stats.byType) as [RuleType, number][])
          .filter(([, count]) => count > 0)
          .map(([type, count]) => (
            <div
              key={type}
              className="card"
              style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: `3px solid ${RULE_TYPE_COLORS[type]}` }}
              onClick={() => setFilter('ruleType', type)}
            >
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {RULE_TYPE_LABELS[type]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{count}</div>
            </div>
          ))}
      </div>

      {/* Filters */}
      <div className="list-toolbar" style={{ padding: '8px 24px', gap: 8 }}>
        <div className="input" style={{ width: 260 }}>
          <Search size={14} />
          <input
            placeholder="Search rules…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        <select
          className="btn btn-secondary btn-sm"
          value={filters.ruleType}
          onChange={e => setFilter('ruleType', e.target.value as RuleType | 'all')}
          style={{ minWidth: 120 }}
        >
          <option value="all">All Types</option>
          {RULE_TYPES.map(t => (
            <option key={t} value={t}>{RULE_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          className="btn btn-secondary btn-sm"
          value={filters.lifecycleState}
          onChange={e => setFilter('lifecycleState', e.target.value as RuleLifecycleState | 'all')}
          style={{ minWidth: 120 }}
        >
          <option value="all">All States</option>
          {RULE_LIFECYCLE_STATES.map(s => (
            <option key={s} value={s}>{LIFECYCLE_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="btn btn-secondary btn-sm"
          value={filters.domain}
          onChange={e => setFilter('domain', e.target.value)}
          style={{ minWidth: 100 }}
        >
          <option value="all">All Domains</option>
          {domains.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {(filters.search || filters.ruleType !== 'all' || filters.lifecycleState !== 'all' || filters.domain !== 'all') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setFilter('search', '');
              setFilter('ruleType', 'all');
              setFilter('lifecycleState', 'all');
              setFilter('domain', 'all');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ padding: '0 24px 40px' }}>
        <table className="rules" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Rule</th>
              <th>Type</th>
              <th>Status</th>
              <th>Domain</th>
              <th>Entity</th>
              <th>Version</th>
              <th>Last Modified</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  No rules found matching your filters.
                </td>
              </tr>
            )}
            {entries.map(entry => {
              const StateIcon = LIFECYCLE_ICONS[entry.lifecycleState];
              const stateColor = LIFECYCLE_COLORS[entry.lifecycleState];
              return (
                <tr
                  key={entry.familyId}
                  onClick={() => navigate(`/admin/studio/rule-engine/${entry.familyId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{entry.displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {entry.ruleCode}
                    </div>
                  </td>
                  <td>
                    <span
                      className="tag"
                      style={{
                        background: `${RULE_TYPE_COLORS[entry.ruleType]}18`,
                        color: RULE_TYPE_COLORS[entry.ruleType],
                        fontWeight: 500,
                      }}
                    >
                      {RULE_TYPE_LABELS[entry.ruleType]}
                    </span>
                  </td>
                  <td>
                    <span
                      className="tag"
                      style={{ background: stateColor.bg, color: stateColor.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <StateIcon size={11} />
                      {LIFECYCLE_LABELS[entry.lifecycleState]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{entry.domain ?? '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {entry.entityType ?? '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    v{entry.currentVersion}
                    <span style={{ color: 'var(--muted)', marginLeft: 4 }}>
                      ({entry.versionCount})
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(entry.lastModified)}
                  </td>
                  <td>
                    <ArrowRight size={14} className="muted" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
