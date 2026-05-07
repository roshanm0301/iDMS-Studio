// ============================================================
// FieldInspector — Right panel for Entity Designer
// Inline-editable common properties + accordion detail sections
// ============================================================
import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Lock, Tag, Database, Settings,
  Shield, Layers, GitBranch, CheckCircle, AlertTriangle, XCircle,
  Eye, EyeOff, Edit,
} from 'lucide-react';
import type {
  EntityDefinition, FieldInstance, DataClassification,
  PresenceBehavior, VisibilityBehavior, FieldLifecycleState,
} from '../../types/entityDesigner';
import type { LayerCode } from '../../types';
import DependencyDetailsPanel from './DependencyDetailsPanel';
import { getCompileReadiness } from '../../data/mockService';
import { LAYER_COLORS, LIFECYCLE_CONFIG } from '../../utils/entityDesignerConstants';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';

// Valid lifecycle transitions (mirrors store — kept local to avoid circular imports)
const ALLOWED_TRANSITIONS: Record<FieldLifecycleState, FieldLifecycleState[]> = {
  draft:    ['active', 'disabled'],
  active:   ['disabled'],
  disabled: ['active'],
};

const TRANSITION_LABELS: Record<FieldLifecycleState, string> = {
  draft:    'Draft',
  active:   'Active',
  disabled: 'Disabled',
};

const TRANSITION_COLORS: Record<FieldLifecycleState, string> = {
  draft:    '#6b7280',
  active:   '#10b981',
  disabled: '#ef4444',
};

interface Props {
  entity: EntityDefinition;
  selectedField: FieldInstance | null;
  /** Opens AddFieldDrawer pre-filled for full editing */
  onEditField?: (field: FieldInstance) => void;
  /** Saves inline property changes to the store */
  onSaveField?: (field: FieldInstance) => void;
}

// ── Classification config ────────────────────────────────────
const CLASS_CONFIG: Record<DataClassification, { label: string; color: string }> = {
  public:         { label: 'Public',          color: '#059669' },
  internal:       { label: 'Internal',        color: '#2563eb' },
  confidential:   { label: 'Confidential',    color: '#7c3aed' },
  regulated:      { label: 'Regulated',       color: '#d97706' },
  pii:            { label: 'PII',             color: '#dc2626' },
  financial:      { label: 'Financial',       color: '#c2410c' },
  audit_sensitive:{ label: 'Audit Sensitive', color: '#991b1b' },
};

const CLASSIFICATION_OPTIONS: DataClassification[] = [
  'public', 'internal', 'confidential', 'regulated', 'pii', 'financial', 'audit_sensitive',
];

const PRESENCE_LABELS: Record<PresenceBehavior, string> = {
  optional:       'Optional',
  on_create:      'Required on Create',
  on_update:      'Required on Update',
  before_submit:  'Before Submit',
  before_approve: 'Before Approve',
  conditional:    'Conditional',
};

// ── Inline toggle ────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: '32px', height: '18px', borderRadius: '9px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? 'var(--primary)' : 'var(--border)',
        position: 'relative', opacity: disabled ? 0.5 : 1, flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: '2px', width: '14px', height: '14px',
        borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
        left: value ? '16px' : '2px',
      }} />
    </button>
  );
}

// ── Accordion section ────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', cursor: 'pointer', background: 'var(--bg-secondary)', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <Icon size={13} style={{ color: iconColor ?? 'var(--muted)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: '11px', flex: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        {open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />}
      </div>
      {open && (
        <div style={{ padding: '10px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── KV row ───────────────────────────────────────────────────
function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '7px', fontSize: '12px' }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{k}</span>
      <span style={{ fontFamily: mono ? 'monospace' : undefined, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function Bool({ v }: { v: boolean }) {
  return <span style={{ color: v ? '#10b981' : '#ef4444', fontWeight: 600 }}>{v ? 'Yes' : 'No'}</span>;
}

// ── Entity Readiness Checklist (shown when no field selected) ─
function EntityReadinessChecklist({ entity }: { entity: EntityDefinition }) {
  const readiness = getCompileReadiness(entity.entityType);
  const hasTitle = entity.fields.some(f => f.behaviors.includeInLookupDisplay && f.lifecycle === 'active');
  const hasDesc = !!entity.description;
  const activeFields = entity.fields.filter(f => f.lifecycle === 'active').length;
  const draftFields = entity.fields.filter(f => f.lifecycle === 'draft').length;

  const checks: { label: string; pass: boolean; desc: string }[] = [
    { label: 'Entity has description', pass: hasDesc, desc: 'Helps collaborators understand the entity purpose' },
    { label: 'Has lookup display field', pass: hasTitle, desc: 'At least one Active field marked "Include in Lookup Display"' },
    { label: 'No compile errors', pass: (readiness?.errors.length ?? 0) === 0, desc: 'Schema must have no blocking errors' },
    { label: 'All system fields active', pass: entity.fields.filter(f => f.protected).every(f => f.lifecycle === 'active'), desc: 'Protected/system fields should be in Active lifecycle' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 700, fontSize: '14px' }}>Entity Readiness</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Total Fields', value: entity.fields.length, color: 'var(--text)' },
          { label: 'Active', value: activeFields, color: '#10b981' },
          { label: 'Draft', value: draftFields, color: '#f59e0b' },
          { label: 'Disabled', value: entity.fields.filter(f => f.lifecycle === 'disabled').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '20px', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Readiness Checks</div>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
            {c.pass
              ? <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '1px' }} />
              : <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{c.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compile issues */}
      {readiness && (readiness.errors.length > 0 || readiness.warnings.length > 0) && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Compile Issues</div>
          {[...readiness.errors, ...readiness.warnings].map((issue, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: '5px', marginBottom: '4px', fontSize: '12px', background: issue.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', display: 'flex', gap: '6px' }}>
              {issue.severity === 'error'
                ? <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                : <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />}
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {readiness?.status === 'pass' && (
        <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px' }}>
          <CheckCircle size={13} style={{ color: '#10b981' }} />
          Schema is ready to compile. No errors or warnings found.
        </div>
      )}

      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
        Click any field in the grid to inspect its details
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function FieldInspector({ entity, selectedField, onEditField, onSaveField }: Props) {
  const { setFieldLifecycle, savedEntities } = useEntityDesignerStore();

  // Local label draft — edited inline, saved on blur
  const [labelDraft, setLabelDraft] = useState(selectedField?.label ?? '');

  // Sync label draft whenever the selected field changes
  useEffect(() => {
    setLabelDraft(selectedField?.label ?? '');
  }, [selectedField?.fieldId]);

  if (!selectedField) {
    return <EntityReadinessChecklist entity={entity} />;
  }

  const f = selectedField;
  const classCfg = CLASS_CONFIG[f.classification] ?? CLASS_CONFIG.internal;
  const layerColor = LAYER_COLORS[f.sourceLayer as LayerCode] ?? '#6b7280';
  const lcCfg = LIFECYCLE_CONFIG[f.lifecycle];
  const readiness = getCompileReadiness(entity.entityType);
  const fieldIssues = readiness?.fieldIssues[f.fieldId] ?? [];
  const isSaved = !!savedEntities[entity.entityType];

  // Save a patch of the field to the store via prop
  const saveField = (patch: Partial<FieldInstance>) => {
    if (!onSaveField) return;
    onSaveField({ ...f, ...patch });
  };

  const saveBehaviors = (patch: Record<string, unknown>) => {
    saveField({ behaviors: { ...f.behaviors, ...patch } });
  };

  const handleLifecycleChange = (next: FieldLifecycleState) => {
    if (!isSaved) return;
    setFieldLifecycle(entity.entityType, f.fieldId, next);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* ── Field header ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          {f.protected && <Lock size={12} style={{ color: '#7c3aed', flexShrink: 0 }} />}

          {/* Editable label */}
          <input
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={() => { if (labelDraft.trim() && labelDraft !== f.label) saveField({ label: labelDraft.trim() }); }}
            disabled={f.protected}
            title={f.protected ? 'Protected fields cannot be renamed' : 'Click to edit label'}
            style={{
              fontWeight: 700, fontSize: '14px', flex: 1, border: 'none',
              background: 'transparent', outline: 'none', color: 'var(--text)',
              cursor: f.protected ? 'not-allowed' : 'text',
              borderBottom: f.protected ? 'none' : '1px dashed var(--border)',
            }}
          />

          {/* Lifecycle badge */}
          <span style={{ fontSize: '11px', fontWeight: 600, color: lcCfg.color, flexShrink: 0 }}>
            {lcCfg.label}
          </span>
        </div>

        <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{f.fieldId}</code>

        {/* Type + layer badges */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          <span style={{ padding: '2px 8px', background: 'var(--bg)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--border)' }}>
            {f.fieldType}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: `${layerColor}18`, color: layerColor }}>
            {f.sourceLayer}
          </span>
        </div>

        {f.description && (
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.4 }}>{f.description}</p>
        )}
      </div>

      {/* ── Quick Edit strip ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '2px' }}>
          Quick Settings
        </div>

        {/* Presence */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>Presence</span>
          <select
            value={f.behaviors.presence}
            onChange={e => !f.protected && saveBehaviors({ presence: e.target.value as PresenceBehavior })}
            disabled={f.protected}
            style={{
              fontSize: '11px', padding: '3px 6px', borderRadius: '4px',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text)', cursor: f.protected ? 'not-allowed' : 'pointer',
              maxWidth: '180px',
            }}
          >
            {(Object.keys(PRESENCE_LABELS) as PresenceBehavior[]).map(v => (
              <option key={v} value={v}>{PRESENCE_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>Visibility</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {(['default', 'hidden', 'masked'] as VisibilityBehavior[]).map(v => {
              const active = f.behaviors.visibility === v;
              const icons: Record<string, React.ReactNode> = {
                default: <Eye size={11} />,
                hidden: <EyeOff size={11} />,
                masked: <span style={{ fontSize: '11px' }}>•••</span>,
              };
              return (
                <button
                  key={v}
                  onClick={() => !f.protected && saveBehaviors({ visibility: v })}
                  disabled={f.protected}
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  style={{
                    padding: '3px 8px', fontSize: '11px', borderRadius: '4px',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: active ? '#fff' : 'var(--muted)',
                    cursor: f.protected ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  {icons[v]}
                  <span style={{ fontSize: '11px' }}>{v === 'default' ? 'Visible' : v.charAt(0).toUpperCase() + v.slice(1)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classification */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>Classification</span>
          <select
            value={f.classification}
            onChange={e => {
              if (f.protected) return;
              const cls = e.target.value as DataClassification;
              saveField({ classification: cls, governance: { ...f.governance, classification: cls } });
            }}
            disabled={f.protected}
            style={{
              fontSize: '11px', padding: '3px 6px', borderRadius: '4px',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: classCfg.color, fontWeight: 600,
              cursor: f.protected ? 'not-allowed' : 'pointer',
            }}
          >
            {CLASSIFICATION_OPTIONS.map(c => (
              <option key={c} value={c} style={{ color: CLASS_CONFIG[c].color }}>
                {CLASS_CONFIG[c].label}
              </option>
            ))}
          </select>
        </div>

        {/* Searchable toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Searchable</span>
          <Toggle
            value={f.behaviors.searchable}
            onChange={v => saveBehaviors({ searchable: v })}
            disabled={f.protected}
          />
        </div>

        {/* Status / Lifecycle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '2px', borderTop: '1px solid var(--border)', marginTop: '2px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Current state badge */}
            <span style={{ fontSize: '12px', fontWeight: 600, color: TRANSITION_COLORS[f.lifecycle] }}>
              {TRANSITION_LABELS[f.lifecycle]}
            </span>
            {/* Transition buttons — only shown when entity is saved */}
            {isSaved && !f.protected && ALLOWED_TRANSITIONS[f.lifecycle]?.map(next => (
              <button
                key={next}
                onClick={() => handleLifecycleChange(next)}
                title={`Change status to ${TRANSITION_LABELS[next]}`}
                style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                  border: `1px solid ${TRANSITION_COLORS[next]}`,
                  background: 'transparent',
                  color: TRANSITION_COLORS[next],
                }}
              >
                → {TRANSITION_LABELS[next]}
              </button>
            ))}
            {!isSaved && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                Save entity to change
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Accordion sections ── */}
      <div style={{ flex: 1 }}>
        {/* Section 1: Identity */}
        <Section title="Identity" icon={Tag} iconColor="#2563eb" defaultOpen={false}>
          <KV k="Field ID" v={<code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{f.fieldId}</code>} />
          {f.attributeRef && <KV k="Catalog Ref" v={<code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{f.attributeRef}</code>} />}
          <KV k="Protected" v={f.protected ? <span style={{ color: '#7c3aed', fontWeight: 600 }}>Yes <Lock size={11} /></span> : 'No'} />
        </Section>

        {/* Section 2: Data Type */}
        <Section title="Data Type" icon={Database} iconColor="#7c3aed" defaultOpen={false}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '10px', fontWeight: 600 }}>
            {f.fieldType}
          </div>
          {Object.keys(f.typeConfig).length > 0 ? (
            Object.entries(f.typeConfig).map(([k, v]) => (
              <KV key={k} k={k.replace(/([A-Z])/g, ' $1')} v={typeof v === 'boolean' ? <Bool v={v} /> : Array.isArray(v) ? v.join(', ') : String(v ?? '—')} mono={typeof v === 'string' && v.length < 40} />
            ))
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>No type-specific configuration</p>
          )}
        </Section>

        {/* Section 3: Behavior */}
        <Section title="Behavior Details" icon={Settings} iconColor="#d97706" defaultOpen={false}>
          <KV k="Presence" v={PRESENCE_LABELS[f.behaviors.presence] ?? f.behaviors.presence} />
          <KV k="Editability" v={f.behaviors.editability.replace(/_/g, ' ')} />
          <KV k="Visibility" v={
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {f.behaviors.visibility === 'default' ? <Eye size={12} /> : f.behaviors.visibility === 'hidden' ? <EyeOff size={12} /> : '•••'}
              {f.behaviors.visibility}
            </span>
          } />
          <KV k="Default Source" v={f.behaviors.defaultSource} />
          <KV k="Filterable" v={<Bool v={f.behaviors.filterable} />} />
          <KV k="Sortable" v={<Bool v={f.behaviors.sortable} />} />
          <KV k="In Default List" v={<Bool v={f.behaviors.includeInDefaultList} />} />
          <KV k="In Lookup Display" v={<Bool v={f.behaviors.includeInLookupDisplay} />} />
          <KV k="Audit" v={f.behaviors.auditBehavior} />
        </Section>

        {/* Section 4: Governance */}
        <Section title="Governance" icon={Shield} iconColor={classCfg.color} defaultOpen={false}>
          <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', background: classCfg.color + '20', color: classCfg.color, fontWeight: 700, fontSize: '12px', marginBottom: '10px' }}>
            {classCfg.label}
          </div>
          <KV k="Downstream Constrain" v={<Bool v={f.governance.canDownstreamConstrain} />} />
          <KV k="Downstream Relax" v={<Bool v={f.governance.canDownstreamRelax} />} />
          <KV k="Include in Export" v={<Bool v={f.governance.includeInExport} />} />
          <KV k="Mask in Export" v={<Bool v={f.governance.maskInExport} />} />
          <KV k="Allow Import" v={<Bool v={f.governance.allowImport} />} />
          <KV k="API Input" v={<Bool v={f.governance.apiInputAllowed} />} />
          <KV k="API Output" v={<Bool v={f.governance.apiOutputAllowed} />} />
        </Section>

        {/* Section 5: Overlay */}
        <Section title="Overlay" icon={Layers} iconColor={layerColor} defaultOpen={false}>
          <KV k="Source Layer" v={<span style={{ fontWeight: 600, color: layerColor }}>{f.sourceLayer}</span>} />
          <KV k="Operation" v={<span style={{ fontWeight: 600 }}>{f.overlayOperation}</span>} />
          {f.lifecycleMeta?.reason && (
            <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '5px', fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              <span style={{ fontWeight: 600 }}>Note:</span> {f.lifecycleMeta.reason}
            </div>
          )}
          {f.lifecycleMeta?.replacementFieldId && (
            <KV k="Replacement" v={<code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{f.lifecycleMeta.replacementFieldId}</code>} />
          )}
        </Section>

        {/* Section 6: Usage / Dependencies */}
        <Section title="Usage / Dependencies" icon={GitBranch} iconColor="#6b7280" defaultOpen={false}>
          <DependencyDetailsPanel
            entityType={entity.entityType}
            fieldId={f.fieldId}
            fieldLabel={f.label}
          />
        </Section>

        {/* Section 7: Compile Readiness */}
        <Section title="Compile Readiness" icon={CheckCircle} iconColor={fieldIssues.length === 0 ? '#10b981' : '#f59e0b'} defaultOpen={false}>
          {fieldIssues.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px' }}>
              <CheckCircle size={13} /> No issues for this field
            </div>
          ) : (
            fieldIssues.map((issue, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: '5px', marginBottom: '4px', fontSize: '12px', background: issue.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', display: 'flex', gap: '6px' }}>
                {issue.severity === 'error'
                  ? <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  : <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />}
                <div>
                  <div style={{ fontWeight: 600 }}>{issue.code}</div>
                  <div>{issue.message}</div>
                </div>
              </div>
            ))
          )}
        </Section>
      </div>

      {/* ── Open full editor footer ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', opacity: f.protected ? 0.5 : 1 }}
          onClick={() => onEditField?.(f)}
          disabled={f.protected}
          title={f.protected ? 'Protected fields cannot be edited in the full editor' : 'Open full field editor for type config, governance, and advanced settings'}
        >
          <Edit size={13} /> Open full editor
        </button>
        {f.protected && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Protected fields are managed by the platform layer
          </p>
        )}
      </div>
    </div>
  );
}
