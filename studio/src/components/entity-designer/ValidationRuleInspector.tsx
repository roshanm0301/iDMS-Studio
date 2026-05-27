// ============================================================
// ValidationRuleInspector — full-form editor for a ValidationRuleDefinition
// Used inside ValidationRulesPanel as the right-side detail pane
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, X, AlertTriangle, XCircle, Plus, Trash2,
} from 'lucide-react';
import {
  VALIDATION_FAMILY_CONFIG,
  FAMILY_GROUP_LABELS,
} from '../../types/validationDesigner';
import type {
  ValidationRuleDefinition,
  ValidationFamily,
  EvaluationScope,
  TriggerContext,
  EnforcementLayer,
  ValidationSeverity,
  TruthSource,
  EvaluationPhase,
  ApplicabilityScope,
  DeterminismType,
  ValidationFamilyGroup,
} from '../../types/validationDesigner';
import type { LayerCode } from '../../types/index';

// ── Constants ─────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const SEVERITY_COLORS: Record<ValidationSeverity, { bg: string; color: string }> = {
  error_blocking:      { bg: '#fee2e2', color: '#991b1b' },
  warning_acknowledge: { bg: '#fef3c7', color: '#92400e' },
  warning_nonblocking: { bg: '#fef9c3', color: '#854d0e' },
  info:                { bg: '#dbeafe', color: '#1e40af' },
  advisory_async:      { bg: '#f1f5f9', color: '#64748b' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:       { bg: '#f1f5f9', color: '#64748b' },
  active:      { bg: '#dcfce7', color: '#166534' },
  deprecated:  { bg: '#fef3c7', color: '#92400e' },
  disabled:    { bg: '#fee2e2', color: '#991b1b' },
};

const TRIGGER_GROUPS: { label: string; values: TriggerContext[] }[] = [
  {
    label: 'Save / Create / Update',
    values: ['on_create', 'on_save', 'on_update', 'on_field_change_preview'],
  },
  {
    label: 'Lifecycle Transitions',
    values: [
      'before_submit', 'before_approve', 'before_reject', 'before_post',
      'before_cancel', 'before_close', 'before_reopen', 'before_reverse',
      'before_delete', 'before_restore', 'before_convert',
    ],
  },
  {
    label: 'Import / API / Bulk',
    values: [
      'before_import_preview', 'before_import_commit',
      'before_api_create', 'before_api_update', 'before_api_upsert',
      'before_bulk_operation',
    ],
  },
  {
    label: 'Provider / Projection',
    values: [
      'before_provider_write', 'on_provider_response',
      'before_projection_refresh', 'after_projection_refresh_validation',
    ],
  },
];

const SCOPE_OPTIONS: EvaluationScope[] = [
  'field', 'record', 'child_row', 'child_collection', 'related_record',
  'related_collection', 'cross_entity', 'batch', 'provider', 'projection_refresh',
];

const ENFORCEMENT_OPTIONS: EnforcementLayer[] = [
  'application_sync', 'application_async_advisory', 'provider_sync', 'provider_async',
  'import_pipeline', 'projection_pipeline', 'database_constraint',
];

const ENFORCEMENT_DESCRIPTIONS: Record<EnforcementLayer, string> = {
  application_sync:          'Synchronous backend — blocks operation',
  application_async_advisory:'Async advisory — cannot block completed operation',
  provider_sync:             'Blocking provider validation',
  provider_async:            'Provider callback / advisory',
  import_pipeline:           'Import preview/commit pipeline',
  projection_pipeline:       'Refresh/build validation for derived entities',
  database_constraint:       'Structural invariant enforced by database (traceability only)',
};

const SEVERITY_OPTIONS: ValidationSeverity[] = [
  'error_blocking', 'warning_acknowledge', 'warning_nonblocking', 'info', 'advisory_async',
];

const SEVERITY_LABELS: Record<ValidationSeverity, string> = {
  error_blocking:      'Error — Blocking',
  warning_acknowledge: 'Warning — Requires Acknowledgment',
  warning_nonblocking: 'Warning — Non-blocking',
  info:                'Info',
  advisory_async:      'Advisory — Async',
};

const TRUTH_SOURCE_OPTIONS: TruthSource[] = [
  'current_record', 'persisted_record', 'snapshot_field', 'live_relationship',
  'effective_dated_relationship', 'derived_field', 'provider_current',
  'provider_cached', 'projection_value', 'import_batch',
];

const PHASE_OPTIONS: EvaluationPhase[] = [
  'pre_defaulting', 'post_defaulting', 'post_derivation', 'pre_persistence',
  'pre_transition', 'post_provider_response', 'import_row_phase',
  'import_batch_phase', 'projection_refresh_phase',
];

const APPLICABILITY_SCOPE_OPTIONS: ApplicabilityScope[] = [
  'entity_wide', 'document_type_specific', 'view_preview_only', 'channel_specific',
  'lifecycle_state_specific', 'action_specific', 'layer_specific', 'effective_dated',
  'package_specific',
];

const DETERMINISM_OPTIONS: DeterminismType[] = [
  'pure_deterministic', 'time_dependent', 'provider_dependent',
  'projection_dependent', 'configuration_dependent', 'security_context_dependent',
];

const LAYER_OPTIONS: LayerCode[] = ['platform', 'vertical', 'tenant', 'node'];

const CRITICALITY_OPTIONS = ['compliance_critical', 'business_critical', 'advisory'] as const;

const MVP_FUNCTIONS = [
  'isBlank(field)', 'isNotBlank(field)', 'length(field)',
  'matches(field, pattern)', 'today()', 'businessDate()',
  'daysBetween(a, b)', 'sum(collection, field)', 'count(collection, filter?)',
  'exists(collection, filter)', 'notExists(collection, filter)',
  'all(collection, predicate)', 'any(collection, predicate)',
  'isActiveAsOf(relationship, date)', 'overlaps(rangeA, rangeB)',
  'snapshot(field)', 'live(field)', 'providerResult(binding, key)',
];

// ── Section header component ───────────────────────────────────
function SectionHeader({
  title, expanded, onToggle, required,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  required?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {expanded ? <ChevronDown size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)' }}>
        {title}
      </span>
      {required && (
        <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 2 }}>*</span>
      )}
    </button>
  );
}

// ── Tag input component ────────────────────────────────────────
function TagInput({
  values, onChange, placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      padding: '5px 8px',
      border: '1px solid var(--border)',
      borderRadius: 5,
      background: 'var(--bg)',
      minHeight: 32,
      alignItems: 'center',
    }}>
      {values.map(v => (
        <span key={v} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 7px',
          borderRadius: 4,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text)',
        }}>
          {v}
          <button
            onClick={() => onChange(values.filter(x => x !== v))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--muted)' }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
          if (e.key === 'Backspace' && !input && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={values.length === 0 ? (placeholder ?? 'Type and press Enter') : ''}
        style={{
          flex: 1,
          minWidth: 80,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 11,
          color: 'var(--text)',
        }}
      />
    </div>
  );
}

// ── Toggle component ───────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <span style={{
        display: 'inline-block', width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--accent)' : 'var(--border)',
        position: 'relative', flexShrink: 0, transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </span>
      <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
    </label>
  );
}

// ── Field row layout ───────────────────────────────────────────
function FieldRow({ label, required, children, hint }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        {required && <span style={{ fontSize: 10, color: '#ef4444' }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function inputStyle(hasError?: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '5px 8px',
    border: `1px solid ${hasError ? '#ef4444' : 'var(--border)'}`,
    borderRadius: 5,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: 5,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  };
}

// ── Compile validation (MVP subset of §21) ────────────────────
type CompileError = { code: string; message: string };

function runCompileChecks(rule: ValidationRuleDefinition): CompileError[] {
  const errors: CompileError[] = [];
  if (!rule.entityId) errors.push({ code: 'VAL-COMP-001', message: 'Entity ID is required.' });
  if (!rule.label?.trim()) errors.push({ code: 'VAL-COMP-007', message: 'Label is required.' });
  if (!rule.apiName?.trim()) errors.push({ code: 'VAL-COMP-007', message: 'API name is required.' });
  if (!rule.assertion?.expression?.trim()) errors.push({ code: 'VAL-COMP-006', message: 'Assertion expression is required.' });
  if (!rule.message?.code?.trim()) errors.push({ code: 'VAL-COMP-007', message: 'Message code is required.' });
  if (!rule.message?.text?.trim()) errors.push({ code: 'VAL-COMP-007', message: 'Message text is required.' });
  if (!rule.message?.localizationKey?.trim()) errors.push({ code: 'VAL-COMP-007', message: 'Localization key is required.' });
  if (!rule.triggerContexts?.length) errors.push({ code: 'VAL-COMP-014', message: 'At least one trigger context is required.' });
  if (rule.severity === 'warning_acknowledge' && !rule.warningAcknowledgmentPolicy) {
    errors.push({ code: 'VAL-COMP-015', message: 'Warning Acknowledgment Policy is required for warning_acknowledge severity.' });
  }
  if (['provider_sync', 'provider_async'].includes(rule.enforcementLayer) && !rule.providerPolicy?.providerBindingId?.trim()) {
    errors.push({ code: 'VAL-COMP-011', message: 'Provider Binding ID is required for provider enforcement layer.' });
  }
  return errors;
}

// ── Props ──────────────────────────────────────────────────────
interface ValidationRuleInspectorProps {
  rule: ValidationRuleDefinition | null;
  entityType: string;
  isNew: boolean;
  onSave: (rule: ValidationRuleDefinition) => void;
  onDelete: (ruleId: string) => void;
  onClose: () => void;
}

// ── Main Component ─────────────────────────────────────────────
export default function ValidationRuleInspector({
  rule, entityType, isNew, onSave, onDelete, onClose,
}: ValidationRuleInspectorProps) {
  const [draft, setDraft] = useState<ValidationRuleDefinition | null>(null);
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExprHelp, setShowExprHelp] = useState(false);

  // Section expand state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    identity: true,
    classification: true,
    applicability: false,
    logic: true,
    dependencies: false,
    targets: false,
    message: true,
    policies: false,
    governance: false,
    lifecycle: false,
    testcases: false,
  });

  const toggleSection = (key: string) => setExpanded(s => ({ ...s, [key]: !s[key] }));

  useEffect(() => {
    setDraft(rule ? { ...rule } : null);
    setCompileErrors([]);
    setShowDeleteConfirm(false);
  }, [rule]);

  const update = useCallback(<K extends keyof ValidationRuleDefinition>(
    key: K, value: ValidationRuleDefinition[K],
  ) => {
    setDraft(d => d ? { ...d, [key]: value } : d);
  }, []);

  const updateNested = useCallback(<P extends keyof ValidationRuleDefinition>(
    parent: P, patch: Partial<Extract<ValidationRuleDefinition[P], object>>,
  ) => {
    setDraft(d => {
      if (!d) return d;
      const existing = d[parent] as object | undefined;
      return { ...d, [parent]: { ...(existing ?? {}), ...patch } };
    });
  }, []);

  if (!draft) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)',
        padding: 24,
      }}>
        <span style={{ fontSize: 32, opacity: 0.2 }}>📋</span>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No rule selected</p>
        <p style={{ fontSize: 12, margin: 0, textAlign: 'center' }}>
          Select a validation rule from the list to edit it, or create a new rule.
        </p>
      </div>
    );
  }

  const isActivated = draft.lifecycle.metadataStatus === 'active';
  const isProviderLayer = ['provider_sync', 'provider_async'].includes(draft.enforcementLayer);
  const isWarnAck = draft.severity === 'warning_acknowledge';

  // Group families by group for the select
  const familyByGroup = (Object.keys(FAMILY_GROUP_LABELS) as ValidationFamilyGroup[]).map(group => ({
    group,
    label: FAMILY_GROUP_LABELS[group],
    families: (Object.keys(VALIDATION_FAMILY_CONFIG) as ValidationFamily[]).filter(
      f => VALIDATION_FAMILY_CONFIG[f].group === group
    ),
  }));

  const handleSaveDraft = () => {
    onSave({ ...draft, lifecycle: { ...draft.lifecycle, metadataStatus: 'draft' } });
  };

  const handleActivate = () => {
    const errors = runCompileChecks(draft);
    if (errors.length > 0) {
      setCompileErrors(errors);
      return;
    }
    setCompileErrors([]);
    onSave({ ...draft, lifecycle: { ...draft.lifecycle, metadataStatus: 'active' } });
  };

  const handleDelete = () => {
    onDelete(draft.validationRuleId);
    setShowDeleteConfirm(false);
  };

  const familyCfg = VALIDATION_FAMILY_CONFIG[draft.validationFamily];
  const statusStyle = STATUS_COLORS[draft.lifecycle.metadataStatus] ?? STATUS_COLORS.draft;
  const sevStyle = SEVERITY_COLORS[draft.severity];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Inspector header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Family badge */}
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 8,
          background: familyCfg.bgColor, color: familyCfg.color,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {familyCfg.label}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {draft.label || (isNew ? 'New Validation Rule' : draft.validationRuleId)}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: statusStyle.bg, color: statusStyle.color, fontWeight: 600 }}>
              {draft.lifecycle.metadataStatus}
            </span>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: sevStyle.bg, color: sevStyle.color, fontWeight: 600 }}>
              {SEVERITY_LABELS[draft.severity]}
            </span>
          </div>
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      {/* Compile errors banner */}
      {compileErrors.length > 0 && (
        <div style={{
          padding: '8px 16px', background: 'rgba(239,68,68,0.08)',
          borderBottom: '1px solid rgba(239,68,68,0.2)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#991b1b' }}>
            <XCircle size={13} /> Activation blocked — fix the following issues:
          </div>
          {compileErrors.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: '#991b1b', marginBottom: 2 }}>
              <span style={{ fontFamily: 'monospace', flexShrink: 0 }}>{e.code}</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable form */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Section 1: Identity ── */}
        <SectionHeader title="Identity" expanded={expanded.identity} onToggle={() => toggleSection('identity')} required />
        {expanded.identity && (
          <>
            <FieldRow label="Rule ID">
              <input readOnly value={draft.validationRuleId} style={{ ...inputStyle(), background: 'var(--bg-secondary)', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 11 }} />
            </FieldRow>
            <FieldRow label="API Name" required hint="snake_case, locked after activation">
              <input
                value={draft.apiName}
                readOnly={isActivated}
                onChange={e => update('apiName', e.target.value)}
                placeholder="e.g. gstin_required_before_post"
                style={inputStyle(!draft.apiName)}
              />
            </FieldRow>
            <FieldRow label="Label" required>
              <input
                value={draft.label}
                onChange={e => update('label', e.target.value)}
                placeholder="Business-readable rule name"
                style={inputStyle(!draft.label)}
              />
            </FieldRow>
            <FieldRow label="Description">
              <textarea
                value={draft.description ?? ''}
                onChange={e => update('description', e.target.value)}
                placeholder="Explain the business purpose of this rule"
                rows={3}
                style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }}
              />
            </FieldRow>
            <FieldRow label="Priority" hint="0–999; lower number = higher priority (evaluated first)">
              <input
                type="number"
                value={draft.priority}
                min={0} max={999}
                onChange={e => update('priority', parseInt(e.target.value) || 0)}
                style={{ ...inputStyle(), width: 100 }}
              />
            </FieldRow>
          </>
        )}

        {/* ── Section 2: Classification ── */}
        <SectionHeader title="Classification (9 Dimensions)" expanded={expanded.classification} onToggle={() => toggleSection('classification')} required />
        {expanded.classification && (
          <>
            {/* Validation Family */}
            <FieldRow label="Validation Family" required>
              <select value={draft.validationFamily} onChange={e => update('validationFamily', e.target.value as ValidationFamily)} style={selectStyle()}>
                {familyByGroup.map(({ group, label, families }) => (
                  <optgroup key={group} label={`— ${label} —`}>
                    {families.map(f => (
                      <option key={f} value={f}>{VALIDATION_FAMILY_CONFIG[f].label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {familyCfg && (
                <div style={{
                  marginTop: 5, padding: '5px 8px', borderRadius: 5,
                  background: familyCfg.bgColor, fontSize: 11, color: familyCfg.color,
                }}>
                  {familyCfg.description}
                </div>
              )}
            </FieldRow>

            {/* Evaluation Scope */}
            <FieldRow label="Evaluation Scope" required>
              <select value={draft.evaluationScope} onChange={e => update('evaluationScope', e.target.value as EvaluationScope)} style={selectStyle()}>
                {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>

            {/* Trigger Contexts */}
            <FieldRow label="Trigger Contexts" required hint="Rule fires when any listed context occurs">
              <div style={{ border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                {TRIGGER_GROUPS.map(({ label, values }) => (
                  <div key={label}>
                    <div style={{ padding: '4px 8px', background: 'var(--bg-secondary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 0' }}>
                      {values.map(v => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>
                          <input
                            type="checkbox"
                            checked={draft.triggerContexts.includes(v)}
                            onChange={e => {
                              const next = e.target.checked
                                ? [...draft.triggerContexts, v]
                                : draft.triggerContexts.filter(x => x !== v);
                              update('triggerContexts', next);
                            }}
                          />
                          <span style={{ color: 'var(--text)' }}>{v.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FieldRow>

            {/* Enforcement Layer */}
            <FieldRow label="Enforcement Layer" required>
              <select value={draft.enforcementLayer} onChange={e => update('enforcementLayer', e.target.value as EnforcementLayer)} style={selectStyle()}>
                {ENFORCEMENT_OPTIONS.map(l => <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>)}
              </select>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                {ENFORCEMENT_DESCRIPTIONS[draft.enforcementLayer]}
              </div>
            </FieldRow>

            {/* Severity */}
            <FieldRow label="Severity / Outcome" required>
              <select value={draft.severity} onChange={e => update('severity', e.target.value as ValidationSeverity)} style={selectStyle()}>
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
              </select>
              <div style={{ marginTop: 4, display: 'inline-flex' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: SEVERITY_COLORS[draft.severity].bg, color: SEVERITY_COLORS[draft.severity].color, fontWeight: 600 }}>
                  {SEVERITY_LABELS[draft.severity]}
                </span>
              </div>
            </FieldRow>

            {/* Truth Source */}
            <FieldRow label="Truth Source" required hint="The authoritative data source used to evaluate this rule">
              <select value={draft.truthSource} onChange={e => update('truthSource', e.target.value as TruthSource)} style={selectStyle()}>
                {TRUTH_SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>

            {/* Evaluation Phase */}
            <FieldRow label="Evaluation Phase" required hint="Phase at which this rule is guaranteed to have all required data available">
              <select value={draft.evaluationPhase} onChange={e => update('evaluationPhase', e.target.value as EvaluationPhase)} style={selectStyle()}>
                {PHASE_OPTIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>

            {/* Determinism Type */}
            <FieldRow label="Determinism Type">
              <select
                value={draft.determinismType ?? 'pure_deterministic'}
                onChange={e => update('determinismType', e.target.value as DeterminismType)}
                style={selectStyle()}
              >
                {DETERMINISM_OPTIONS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>
          </>
        )}

        {/* ── Section 3: Applicability ── */}
        <SectionHeader title="Applicability" expanded={expanded.applicability} onToggle={() => toggleSection('applicability')} />
        {expanded.applicability && (
          <>
            <FieldRow label="Applicability Scope">
              <select
                value={draft.applicability.applicabilityScope}
                onChange={e => updateNested('applicability', { applicabilityScope: e.target.value as ApplicabilityScope })}
                style={selectStyle()}
              >
                {APPLICABILITY_SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Document Types" hint="Leave empty for all document types">
              <TagInput
                values={draft.applicability.documentTypes ?? []}
                onChange={v => updateNested('applicability', { documentTypes: v })}
                placeholder="e.g. vehicle_sales_invoice"
              />
            </FieldRow>
            <FieldRow label="Channels">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['web', 'api', 'mobile', 'import', 'bulk'].map(ch => (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={(draft.applicability.channels ?? []).includes(ch)}
                      onChange={e => {
                        const curr = draft.applicability.channels ?? [];
                        updateNested('applicability', {
                          channels: e.target.checked ? [...curr, ch] : curr.filter(x => x !== ch),
                        });
                      }}
                    />
                    <span style={{ color: 'var(--text)' }}>{ch}</span>
                  </label>
                ))}
              </div>
            </FieldRow>
            <FieldRow label="Lifecycle States" hint="Leave empty to apply to all states">
              <TagInput
                values={draft.applicability.lifecycleStates ?? []}
                onChange={v => updateNested('applicability', { lifecycleStates: v })}
                placeholder="e.g. ready_to_post"
              />
            </FieldRow>
            <FieldRow label="Effective From">
              <input
                type="date"
                value={draft.applicability.effectiveFrom ?? ''}
                onChange={e => updateNested('applicability', { effectiveFrom: e.target.value || undefined })}
                style={inputStyle()}
              />
            </FieldRow>
            <FieldRow label="Effective To">
              <input
                type="date"
                value={draft.applicability.effectiveTo ?? ''}
                onChange={e => updateNested('applicability', { effectiveTo: e.target.value || null })}
                style={inputStyle()}
              />
            </FieldRow>
            <FieldRow label="Layer Code">
              <select
                value={draft.applicability.layerCode ?? ''}
                onChange={e => updateNested('applicability', { layerCode: (e.target.value as LayerCode) || undefined })}
                style={selectStyle()}
              >
                <option value="">— Any layer —</option>
                {LAYER_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </FieldRow>
          </>
        )}

        {/* ── Section 4: Logic ── */}
        <SectionHeader title="Logic — Condition & Assertion" expanded={expanded.logic} onToggle={() => toggleSection('logic')} required />
        {expanded.logic && (
          <>
            {/* Condition (optional) */}
            <div style={{ padding: '8px 16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Condition (optional — if omitted, assertion always applies)
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <select
                  value={draft.condition?.expressionLanguage ?? 'none'}
                  onChange={e => {
                    if (e.target.value === 'none') {
                      setDraft(d => d ? { ...d, condition: undefined } : d);
                    } else {
                      setDraft(d => d ? { ...d, condition: { expressionLanguage: 'idms_expression_v2', expression: d.condition?.expression ?? '' } } : d);
                    }
                  }}
                  style={{ ...selectStyle(), width: 'auto', flexShrink: 0 }}
                >
                  <option value="none">No condition</option>
                  <option value="idms_expression_v2">idms_expression_v2</option>
                </select>
              </div>
              {draft.condition && (
                <textarea
                  value={draft.condition.expression}
                  onChange={e => setDraft(d => d ? { ...d, condition: { expressionLanguage: 'idms_expression_v2', expression: e.target.value } } : d)}
                  placeholder={`e.g. tax_treatment == 'REGISTERED_TAXABLE_SUPPLY'`}
                  rows={3}
                  style={{ ...inputStyle(), fontFamily: 'monospace', fontSize: 11, resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }}
                />
              )}
            </div>

            {/* Assertion (required) */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assertion</span>
                <span style={{ fontSize: 10, color: '#ef4444' }}>*</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>Must evaluate to true for the operation to pass</span>
              </div>
              <div style={{ marginBottom: 6 }}>
                <select
                  value={draft.assertion.expressionLanguage}
                  onChange={e => updateNested('assertion', { expressionLanguage: e.target.value as 'idms_expression_v2' })}
                  style={{ ...selectStyle(), width: 'auto' }}
                >
                  <option value="idms_expression_v2">idms_expression_v2</option>
                </select>
              </div>
              <textarea
                value={draft.assertion.expression}
                onChange={e => updateNested('assertion', { expression: e.target.value })}
                placeholder={`e.g. isNotBlank(snapshot(gstin_snapshot))\ne.g. delivery_date >= booking_date\ne.g. count(lines, status == 'active') >= 1`}
                rows={4}
                style={{ ...inputStyle(!draft.assertion.expression.trim()), fontFamily: 'monospace', fontSize: 11, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Expression function reference */}
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setShowExprHelp(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--muted)',
                }}
              >
                {showExprHelp ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                MVP expression function reference
              </button>
              {showExprHelp && (
                <div style={{ padding: '6px 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {MVP_FUNCTIONS.map(fn => (
                    <code key={fn} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontFamily: 'monospace',
                    }}>
                      {fn}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Section 5: Dependency Profile ── */}
        <SectionHeader title="Dependency Profile" expanded={expanded.dependencies} onToggle={() => toggleSection('dependencies')} />
        {expanded.dependencies && (
          <>
            <div style={{ padding: '6px 16px 8px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
              Declare all fields, relationships, and bindings referenced in your expressions. Used by the compiler for dependency tracking.
            </div>
            <FieldRow label="Field IDs">
              <TagInput values={draft.dependencyProfile.fieldIds} onChange={v => updateNested('dependencyProfile', { fieldIds: v })} placeholder="e.g. fld_tax_treatment" />
            </FieldRow>
            <FieldRow label="Relationship IDs">
              <TagInput values={draft.dependencyProfile.relationshipIds} onChange={v => updateNested('dependencyProfile', { relationshipIds: v })} placeholder="e.g. rel_customer_ref" />
            </FieldRow>
            <FieldRow label="Derived Field IDs" hint="Fields whose values must be computed before this rule can evaluate">
              <TagInput values={draft.dependencyProfile.derivedFieldIds} onChange={v => updateNested('dependencyProfile', { derivedFieldIds: v })} placeholder="e.g. fld_gstin_snapshot" />
            </FieldRow>
            <FieldRow label="Query Binding IDs">
              <TagInput values={draft.dependencyProfile.queryBindingIds} onChange={v => updateNested('dependencyProfile', { queryBindingIds: v })} />
            </FieldRow>
            <FieldRow label="Provider Binding IDs">
              <TagInput values={draft.dependencyProfile.providerBindingIds} onChange={v => updateNested('dependencyProfile', { providerBindingIds: v })} />
            </FieldRow>
          </>
        )}

        {/* ── Section 6: Affected Targets ── */}
        <SectionHeader title="Affected Targets" expanded={expanded.targets} onToggle={() => toggleSection('targets')} />
        {expanded.targets && (
          <>
            <div style={{ padding: '6px 16px 8px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
              Fields and relations that the runtime highlights in the UI when this rule fails.
            </div>
            <FieldRow label="Field IDs">
              <TagInput values={draft.affectedTargets.fieldIds} onChange={v => updateNested('affectedTargets', { fieldIds: v })} placeholder="e.g. fld_gstin_snapshot" />
            </FieldRow>
            <FieldRow label="Relationship IDs">
              <TagInput values={draft.affectedTargets.relationshipIds} onChange={v => updateNested('affectedTargets', { relationshipIds: v })} />
            </FieldRow>
            <FieldRow label="Child Relation IDs">
              <TagInput values={draft.affectedTargets.childRelationIds} onChange={v => updateNested('affectedTargets', { childRelationIds: v })} />
            </FieldRow>
          </>
        )}

        {/* ── Section 7: Message ── */}
        <SectionHeader title="Message" expanded={expanded.message} onToggle={() => toggleSection('message')} required />
        {expanded.message && (
          <>
            <div style={{
              margin: '8px 16px', padding: '6px 10px', borderRadius: 5,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: '#92400e',
            }}>
              <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>VAL-COMP-019:</strong> Do not expose masked, regulated, or hidden field values in message text. Use only user-visible labels and safe business values.</span>
            </div>
            <FieldRow label="Message Code" required hint="Stable unique code (e.g. VO-CUST-001). Never change after activation.">
              <input
                value={draft.message.code}
                onChange={e => updateNested('message', { code: e.target.value })}
                placeholder="e.g. INV-GST-POST-001"
                style={inputStyle(!draft.message.code)}
              />
            </FieldRow>
            <FieldRow label="Localization Key" required hint="Used for i18n lookup">
              <input
                value={draft.message.localizationKey ?? ''}
                onChange={e => updateNested('message', { localizationKey: e.target.value })}
                placeholder="e.g. validation.invoice.gstin_snapshot_required"
                style={inputStyle(!draft.message.localizationKey)}
              />
            </FieldRow>
            <FieldRow label="Message Text" required hint="User-facing message displayed when rule fails">
              <textarea
                value={draft.message.text}
                onChange={e => updateNested('message', { text: e.target.value })}
                placeholder="e.g. GSTIN snapshot is required before posting this registered GST invoice."
                rows={3}
                style={{ ...inputStyle(!draft.message.text), resize: 'vertical', lineHeight: 1.5 }}
              />
            </FieldRow>
            <FieldRow label="Remediation Hint" hint="Optional business-safe guidance for resolving the issue">
              <textarea
                value={draft.message.remediationHint ?? ''}
                onChange={e => updateNested('message', { remediationHint: e.target.value || undefined })}
                placeholder="e.g. Review customer tax details and regenerate the invoice snapshot before posting."
                rows={2}
                style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }}
              />
            </FieldRow>
          </>
        )}

        {/* ── Section 8: Policies ── */}
        <SectionHeader title="Policies" expanded={expanded.policies} onToggle={() => toggleSection('policies')} />
        {expanded.policies && (
          <>
            {/* Warning Acknowledgment Policy — conditional */}
            {isWarnAck && (
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ padding: '6px 16px', background: 'var(--bg-secondary)', fontSize: 11, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                  Warning Acknowledgment Policy
                  <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 4 }}>*</span>
                </div>
                <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Toggle
                    checked={draft.warningAcknowledgmentPolicy?.acknowledgmentRequired ?? false}
                    onChange={v => updateNested('warningAcknowledgmentPolicy', { acknowledgmentRequired: v, reasonRequired: draft.warningAcknowledgmentPolicy?.reasonRequired ?? false })}
                    label="Acknowledgment required before continuation"
                  />
                  <FieldRow label="Acknowledgment Code">
                    <input
                      value={draft.warningAcknowledgmentPolicy?.acknowledgmentCode ?? ''}
                      onChange={e => updateNested('warningAcknowledgmentPolicy', { acknowledgmentCode: e.target.value || undefined })}
                      placeholder="e.g. ACK-HIGH-DISCOUNT"
                      style={inputStyle()}
                    />
                  </FieldRow>
                  <Toggle
                    checked={draft.warningAcknowledgmentPolicy?.reasonRequired ?? false}
                    onChange={v => updateNested('warningAcknowledgmentPolicy', { reasonRequired: v, acknowledgmentRequired: draft.warningAcknowledgmentPolicy?.acknowledgmentRequired ?? false })}
                    label="Reason text required when acknowledging"
                  />
                  <FieldRow label="Expiry (minutes)" hint="Acknowledgment expires after N minutes; 0 = no expiry">
                    <input
                      type="number"
                      value={draft.warningAcknowledgmentPolicy?.expiryAfterMinutes ?? 0}
                      min={0}
                      onChange={e => updateNested('warningAcknowledgmentPolicy', { expiryAfterMinutes: parseInt(e.target.value) || 0 })}
                      style={{ ...inputStyle(), width: 100 }}
                    />
                  </FieldRow>
                </div>
              </div>
            )}

            {/* Provider Policy — conditional */}
            {isProviderLayer && (
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ padding: '6px 16px', background: 'var(--bg-secondary)', fontSize: 11, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                  Provider Policy
                  <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 4 }}>*</span>
                </div>
                <FieldRow label="Provider Binding ID" required>
                  <input
                    value={draft.providerPolicy?.providerBindingId ?? ''}
                    onChange={e => updateNested('providerPolicy', {
                      providerBindingId: e.target.value,
                      timeoutMs: draft.providerPolicy?.timeoutMs ?? 5000,
                      onTimeout: draft.providerPolicy?.onTimeout ?? 'block',
                      retryCount: draft.providerPolicy?.retryCount ?? 0,
                    })}
                    placeholder="e.g. oem_portal_binding"
                    style={inputStyle(!draft.providerPolicy?.providerBindingId)}
                  />
                </FieldRow>
                <FieldRow label="Timeout (ms)" hint="Maximum time to wait for provider response">
                  <input
                    type="number"
                    value={draft.providerPolicy?.timeoutMs ?? 5000}
                    min={0}
                    onChange={e => updateNested('providerPolicy', { timeoutMs: parseInt(e.target.value) || 5000 })}
                    style={{ ...inputStyle(), width: 100 }}
                  />
                </FieldRow>
                <FieldRow label="On Timeout">
                  <select
                    value={draft.providerPolicy?.onTimeout ?? 'block'}
                    onChange={e => updateNested('providerPolicy', { onTimeout: e.target.value as 'block' | 'allow_with_warning' | 'cache_last_known' })}
                    style={selectStyle()}
                  >
                    <option value="block">block — fail closed (safe default)</option>
                    <option value="allow_with_warning">allow_with_warning — continue with warning</option>
                    <option value="cache_last_known">cache_last_known — use last cached response</option>
                  </select>
                </FieldRow>
                <FieldRow label="Retry Count">
                  <input
                    type="number"
                    value={draft.providerPolicy?.retryCount ?? 0}
                    min={0} max={5}
                    onChange={e => updateNested('providerPolicy', { retryCount: parseInt(e.target.value) || 0 })}
                    style={{ ...inputStyle(), width: 80 }}
                  />
                </FieldRow>
              </div>
            )}

            {/* Bypass Policy — always shown */}
            <div>
              <div style={{ padding: '6px 16px', background: 'var(--bg-secondary)', fontSize: 11, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                Bypass Policy
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Toggle
                  checked={draft.bypassPolicy.allowed}
                  onChange={v => updateNested('bypassPolicy', { allowed: v, reasonRequired: draft.bypassPolicy.reasonRequired })}
                  label="Allow bypass (requires explicit permission)"
                />
                {draft.bypassPolicy.allowed && (
                  <>
                    <FieldRow label="Permission Code" hint="Code that grants bypass capability">
                      <input
                        value={draft.bypassPolicy.permissionCode ?? ''}
                        onChange={e => updateNested('bypassPolicy', { permissionCode: e.target.value || null })}
                        placeholder="e.g. VAL_BYPASS_GSTIN_CHECK"
                        style={inputStyle()}
                      />
                    </FieldRow>
                    <Toggle
                      checked={draft.bypassPolicy.reasonRequired}
                      onChange={v => updateNested('bypassPolicy', { reasonRequired: v })}
                      label="Bypass reason required (audited)"
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Section 9: Governance ── */}
        <SectionHeader title="Governance" expanded={expanded.governance} onToggle={() => toggleSection('governance')} />
        {expanded.governance && (
          <>
            <FieldRow label="Owning Layer">
              <select
                value={draft.governance?.owningLayer ?? ''}
                onChange={e => updateNested('governance', { owningLayer: (e.target.value as LayerCode) || undefined })}
                style={selectStyle()}
              >
                <option value="">— Select layer —</option>
                {LAYER_OPTIONS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Owning Package ID">
              <input
                value={draft.governance?.owningPackageId ?? ''}
                onChange={e => updateNested('governance', { owningPackageId: e.target.value || undefined })}
                placeholder="e.g. pkg_india_gst_core"
                style={inputStyle()}
              />
            </FieldRow>
            <FieldRow label="Criticality">
              <select
                value={draft.governance?.criticality ?? ''}
                onChange={e => updateNested('governance', { criticality: (e.target.value as typeof CRITICALITY_OPTIONS[number]) || undefined })}
                style={selectStyle()}
              >
                <option value="">— Select —</option>
                {CRITICALITY_OPTIONS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </FieldRow>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Toggle
                checked={draft.governance?.canDownstreamConstrain ?? true}
                onChange={v => updateNested('governance', { canDownstreamConstrain: v })}
                label="Downstream can constrain (tighten)"
              />
              <Toggle
                checked={draft.governance?.canDownstreamRelax ?? false}
                onChange={v => updateNested('governance', { canDownstreamRelax: v })}
                label="Downstream can relax (weaken)"
              />
              <Toggle
                checked={draft.governance?.canDownstreamDisable ?? false}
                onChange={v => updateNested('governance', { canDownstreamDisable: v })}
                label="Downstream can disable"
              />
            </div>
          </>
        )}

        {/* ── Section 10: Lifecycle ── */}
        <SectionHeader title="Lifecycle" expanded={expanded.lifecycle} onToggle={() => toggleSection('lifecycle')} />
        {expanded.lifecycle && (
          <>
            <FieldRow label="Metadata Status">
              <select
                value={draft.lifecycle.metadataStatus}
                onChange={e => updateNested('lifecycle', { metadataStatus: e.target.value as ValidationRuleDefinition['lifecycle']['metadataStatus'] })}
                style={selectStyle()}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
                <option value="disabled">Disabled</option>
              </select>
            </FieldRow>
            <FieldRow label="Version" hint="Semantic version (e.g. 1.0.0)">
              <input
                value={draft.lifecycle.version ?? ''}
                onChange={e => updateNested('lifecycle', { version: e.target.value || undefined })}
                placeholder="e.g. 1.0.0"
                style={{ ...inputStyle(), width: 120 }}
              />
            </FieldRow>
            {draft.createdAt && (
              <FieldRow label="Created">
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{draft.createdAt}</span>
              </FieldRow>
            )}
            {draft.lastModified && (
              <FieldRow label="Last Modified">
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{draft.lastModified}</span>
              </FieldRow>
            )}
          </>
        )}

        {/* ── Section 11: Test Cases ── */}
        <SectionHeader title="Test Cases (optional)" expanded={expanded.testcases} onToggle={() => toggleSection('testcases')} />
        {expanded.testcases && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
              Required for compliance_critical, provider-backed, and blocking transition rules. Each test case documents an expected runtime outcome.
            </div>
            {(draft.testCases ?? []).map((tc, idx) => (
              <div key={tc.caseId} style={{
                padding: '8px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{tc.description || `Test case ${idx + 1}`}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                    background: tc.expectedResult === 'pass' ? '#dcfce7' : tc.expectedResult === 'fail' ? '#fee2e2' : '#fef3c7',
                    color: tc.expectedResult === 'pass' ? '#166534' : tc.expectedResult === 'fail' ? '#991b1b' : '#92400e',
                  }}>
                    {tc.expectedResult}
                  </span>
                  <button
                    onClick={() => update('testCases', (draft.testCases ?? []).filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, display: 'flex' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <input
                  value={tc.description}
                  onChange={e => {
                    const next = [...(draft.testCases ?? [])];
                    next[idx] = { ...next[idx], description: e.target.value };
                    update('testCases', next);
                  }}
                  placeholder="Test case description"
                  style={{ ...inputStyle(), marginBottom: 4, fontSize: 11 }}
                />
                <select
                  value={tc.expectedResult}
                  onChange={e => {
                    const next = [...(draft.testCases ?? [])];
                    next[idx] = { ...next[idx], expectedResult: e.target.value as 'pass' | 'fail' | 'warn' };
                    update('testCases', next);
                  }}
                  style={{ ...selectStyle(), width: 'auto' }}
                >
                  <option value="pass">pass — rule should pass</option>
                  <option value="fail">fail — rule should block</option>
                  <option value="warn">warn — rule should warn</option>
                </select>
              </div>
            ))}
            <button
              onClick={() => update('testCases', [
                ...(draft.testCases ?? []),
                { caseId: `tc_${Date.now()}`, description: '', expectedResult: 'pass' },
              ])}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 6,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={11} /> Add Test Case
            </button>
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: 80 }} />
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={handleSaveDraft}
          style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Save Draft
        </button>
        <button
          onClick={handleActivate}
          style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {isActivated ? 'Save Active' : 'Activate Rule'}
        </button>

        <div style={{ flex: 1 }} />

        {!isNew && (
          showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#991b1b' }}>Delete this rule?</span>
              <button onClick={handleDelete} style={{ padding: '4px 10px', borderRadius: 5, background: '#ef4444', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                Confirm Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '4px 10px', borderRadius: 5, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 11, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 6,
                background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={11} /> Delete
            </button>
          )
        )}
      </div>
    </div>
  );
}
