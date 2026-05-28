/**
 * Validation Rules Page — VAL-UI-001
 *
 * Lists all validation rule configs with filters by category, severity,
 * execution point, and entity type.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Plus, Search, AlertTriangle, Info, XCircle, Shield,
  Clock, FileEdit, Zap,
} from 'lucide-react';
import { getValidationRules, getValidationStats } from '../../data/validationService';
import {
  VALIDATION_CATEGORIES,
  VALIDATION_CATEGORY_LABELS,
  EXECUTION_POINTS,
  EXECUTION_POINT_LABELS,
  VALIDATION_SEVERITIES,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '../../metadata/validation-engine-definition';
import type { ValidationCategory, ExecutionPoint, ValidationSeverity } from '../../metadata/validation-engine-definition';

const SEVERITY_ICONS: Record<ValidationSeverity, typeof XCircle> = {
  block: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ValidationRulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ValidationCategory | ''>('');
  const [severityFilter, setSeverityFilter] = useState<ValidationSeverity | ''>('');
  const [execFilter, setExecFilter] = useState<ExecutionPoint | ''>('');

  const stats = useMemo(() => getValidationStats(), []);
  const rules = useMemo(
    () =>
      getValidationRules({
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        executionPoint: execFilter || undefined,
        search: search || undefined,
      }),
    [search, categoryFilter, severityFilter, execFilter],
  );

  return (
    <div className="content" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} />
            Validation Rules
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.total} rules · {stats.bySeverity.block} blocking · {stats.nonOverridable} non-overridable
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/studio/rule-engine/validations/new')}>
          <Plus size={14} /> New Validation Rule
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(stats.bySeverity).map(([sev, count]) => {
          const colors = SEVERITY_COLORS[sev as ValidationSeverity];
          const Icon = SEVERITY_ICONS[sev as ValidationSeverity];
          return (
            <div
              key={sev}
              onClick={() => setSeverityFilter(sev === severityFilter ? '' : sev as ValidationSeverity)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: sev === severityFilter ? colors.bg : 'var(--bg-subtle)',
                border: `1px solid ${sev === severityFilter ? colors.color : 'var(--border)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={14} color={colors.color} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{SEVERITY_LABELS[sev as ValidationSeverity]}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search validation rules…"
            style={{ width: '100%', paddingLeft: 28, fontSize: 12, padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ValidationCategory | '')}
          style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          <option value="">All Categories</option>
          {VALIDATION_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{VALIDATION_CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <select
          value={execFilter}
          onChange={(e) => setExecFilter(e.target.value as ExecutionPoint | '')}
          style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          <option value="">All Exec Points</option>
          {EXECUTION_POINTS.map(ep => (
            <option key={ep} value={ep}>{EXECUTION_POINT_LABELS[ep]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Message</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Severity</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Execution</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>Entity</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 500, color: 'var(--muted)' }}>
              <Shield size={12} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => {
            const Icon = SEVERITY_ICONS[rule.severity];
            const sevColors = SEVERITY_COLORS[rule.severity];
            return (
              <tr
                key={rule.id}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/studio/rule-engine/validation/${rule.id}`)}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{rule.messageTemplate}</div>
                  {rule.remediationHint && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{rule.remediationHint}</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-subtle)' }}>
                    {VALIDATION_CATEGORY_LABELS[rule.category]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: sevColors.bg, color: sevColors.color }}>
                    <Icon size={10} /> {SEVERITY_LABELS[rule.severity]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {rule.executionPoints.map(ep => (
                      <span key={ep} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, backgroundColor: 'var(--bg-subtle)', color: 'var(--muted)' }}>
                        {EXECUTION_POINT_LABELS[ep]}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 11 }}>{rule.entityType}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {rule.nonOverridable && <span title="Non-overridable"><Shield size={12} color="#991B1B" /></span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          No validation rules match the current filters.
        </div>
      )}
    </div>
  );
}
