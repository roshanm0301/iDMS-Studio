import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Car, Wrench, Database, Settings, Check, ChevronLeft,
  ChevronRight, AlertTriangle, Lock, Info
} from 'lucide-react';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getEntityTemplates, getEntityDefinitions } from '../data/mockService';
import type {
  EntityDefinition, EntityCategory, CreationPattern,
  EntityBehaviors, FieldInstance,
} from '../types/entityDesigner';
import type { LayerCode } from '../types';
import { toSlug } from '../utils/entityDesignerUtils';

// toEntityType is now toSlug from utils (kept as alias for readability)
const toEntityType = toSlug;

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  tpl_generic_transaction: FileText,
  tpl_automotive_vehicle_order: Car,
  tpl_automotive_service_job: Wrench,
  tpl_master_data: Database,
  tpl_configuration: Settings,
};

// Dynamic step labels per pattern (C-03 fix extended for extend pattern)
function getStepLabels(pattern: CreationPattern): string[] {
  if (pattern === 'template') return ['Creation Pattern', 'Template', 'Identity', 'Behaviors', 'Review'];
  if (pattern === 'extend')  return ['Creation Pattern', 'Base Entity', 'Identity', 'Review'];
  return ['Creation Pattern', 'Identity', 'Behaviors', 'Review'];
}

// Maps raw step index (0-4) to display step index for progress bar
function toDisplayStep(rawStep: number, pattern: CreationPattern): number {
  if (pattern === 'template') return rawStep;
  if (pattern === 'extend') {
    // raw: 0→0, 1→1, 2→2, 4→3
    if (rawStep <= 2) return rawStep;
    return rawStep - 1;
  }
  // blank: raw 0→0, 2→1, 3→2, 4→3
  if (rawStep >= 2) return rawStep - 1;
  return rawStep;
}

// ── Step Progress ─────────────────────────────────────────────
function StepProgress({ currentStep, labels }: { currentStep: number; labels: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
      {labels.map((label, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {i > 0 && <div style={{ flex: 1, height: '2px', background: i <= currentStep ? 'var(--primary)' : 'var(--border)' }} />}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600, flexShrink: 0,
              background: i < currentStep ? 'var(--primary)' : i === currentStep ? 'var(--primary)' : 'var(--bg-secondary)',
              color: i <= currentStep ? '#fff' : 'var(--muted)',
              border: `2px solid ${i <= currentStep ? 'var(--primary)' : 'var(--border)'}`,
            }}>
              {i < currentStep ? <Check size={12} /> : i + 1}
            </div>
            {i < labels.length - 1 && <div style={{ flex: 1, height: '2px', background: i < currentStep ? 'var(--primary)' : 'var(--border)' }} />}
          </div>
          <span style={{ fontSize: '11px', color: i === currentStep ? 'var(--primary)' : 'var(--muted)', fontWeight: i === currentStep ? 600 : 400, textAlign: 'center' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CreateEntityPage() {
  const navigate = useNavigate();
  const { createEntity, savedEntities } = useEntityDesignerStore();
  const templates = getEntityTemplates();

  const [step, setStep] = useState(0);
  const [pattern, setPattern] = useState<CreationPattern>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_automotive_vehicle_order');
  const [selectedBaseEntityType, setSelectedBaseEntityType] = useState(''); // for extend pattern
  const [entitySearchQ, setEntitySearchQ] = useState('');
  const [label, setLabel] = useState('');
  const [entityTypeOverride, setEntityTypeOverride] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Sales');
  const [category, setCategory] = useState<EntityCategory>('transaction');
  const [owningLayer, setOwningLayer] = useState<LayerCode>('tenant');
  const [behaviors, setBehaviors] = useState<EntityBehaviors>({
    workflowEnabled: true,
    auditable: true,
    softDelete: true,
    allowAttachments: false,
    allowBulkImport: false,
    allowDownstreamExtension: true,
    allowDownstreamRequirednessRelaxation: false,
  });

  const derivedEntityType = entityTypeOverride || toEntityType(label);
  const selectedTemplate = templates.find(t => t.templateId === selectedTemplateId);

  // Apply template defaults when template is selected
  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const t = templates.find(tp => tp.templateId === templateId);
    if (t) {
      setCategory(t.category);
      setDomain(t.domain);
    }
  };

  const canProceed = useCallback((): boolean => {
    if (step === 0) return !!pattern;
    if (step === 1) {
      if (pattern === 'template') return !!selectedTemplateId;
      if (pattern === 'extend')   return !!selectedBaseEntityType;
      return true;
    }
    if (step === 2) {
      if (label.trim().length < 2 || derivedEntityType.length < 2) return false;
      // Duplicate entity type check (P1-10)
      const allEntities = getEntityDefinitions(savedEntities);
      if (allEntities.some(e => e.entityType === derivedEntityType)) return false;
      return true;
    }
    return true;
  }, [step, pattern, selectedTemplateId, selectedBaseEntityType, label, derivedEntityType, savedEntities]);

  const handleCreate = () => {
    const systemFields: FieldInstance[] = [
      {
        fieldId: 'record_id',
        label: 'Record ID',
        fieldType: 'text',
        sourceLayer: 'platform',
        overlayOperation: 'extend',
        protected: true,
        classification: 'internal',
        behaviors: { presence: 'on_create', editability: 'system_only', visibility: 'default', defaultSource: 'none', searchable: false, filterable: false, sortable: false, includeInDefaultList: false, includeInLookupDisplay: false, auditBehavior: 'none' },
        typeConfig: {},
        governance: { classification: 'internal', canDownstreamConstrain: false, canDownstreamRelax: false, canDownstreamDisable: false, includeInExport: true, allowImport: false, allowBulkUpdate: false, maskInExport: false, apiInputAllowed: false, apiOutputAllowed: true, apiOutputMasked: false },
        lifecycle: 'active',
        order: 0,
      },
      {
        fieldId: 'status',
        label: 'Status',
        fieldType: 'select',
        sourceLayer: 'platform',
        overlayOperation: 'extend',
        protected: true,
        classification: 'internal',
        behaviors: { presence: 'on_create', editability: 'system_only', visibility: 'default', defaultSource: 'none', searchable: false, filterable: true, sortable: false, includeInDefaultList: true, includeInLookupDisplay: false, auditBehavior: 'none' },
        typeConfig: { valueSource: 'workflow' },
        governance: { classification: 'internal', canDownstreamConstrain: false, canDownstreamRelax: false, canDownstreamDisable: false, includeInExport: true, allowImport: false, allowBulkUpdate: false, maskInExport: false, apiInputAllowed: false, apiOutputAllowed: true, apiOutputMasked: false },
        lifecycle: 'active',
        order: 1,
      },
    ];

    const newEntity: EntityDefinition = {
      entityType: derivedEntityType,
      label: label.trim(),
      description: description.trim(),
      category,
      domain,
      owningLayer,
      behaviors,
      status: 'draft',
      fields: systemFields,
      templateId: pattern === 'template' ? selectedTemplateId : undefined,
      parentEntityType: pattern === 'extend' ? selectedBaseEntityType : undefined,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    createEntity(newEntity);
    navigate(`/admin/studio/entities/${derivedEntityType}/schema`);
  };

  const next = () => {
    if (!canProceed()) return;
    if (step === 0) {
      // template and extend both go to step 1; blank skips to identity (step 2)
      setStep(pattern === 'blank' ? 2 : 1);
    } else if (step === 1 && pattern === 'extend') {
      setStep(2); // entity picker → identity
    } else if (step === 2 && pattern === 'extend') {
      setStep(4); // identity → review (skip behaviors for extend)
    } else {
      setStep(s => Math.min(s + 1, 4));
    }
  };

  const back = () => {
    if (step === 2 && pattern === 'blank') {
      setStep(0);
    } else if (step === 2 && pattern === 'extend') {
      setStep(1); // identity → back to entity picker
    } else if (step === 4 && pattern === 'extend') {
      setStep(2); // review → back to identity
    } else {
      setStep(s => Math.max(s - 1, 0));
    }
  };

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Entity</h1>
          <p className="page-subtitle">Define a new governed entity schema</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/studio/entities')}>
          Cancel
        </button>
      </div>

      <StepProgress currentStep={toDisplayStep(step, pattern)} labels={getStepLabels(pattern)} />

      <div className="card" style={{ padding: '24px', minHeight: '400px' }}>
        {/* ── Step 0: Creation Pattern ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>How would you like to create this entity?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Choose a creation pattern to get started.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { value: 'template', label: 'Create from Template', desc: 'Start from a pre-built template with recommended fields and workflow. Recommended.', recommended: true, disabled: false },
                { value: 'blank', label: 'Create from Blank', desc: 'Start with only system fields. For expert users who need full control.', recommended: false, disabled: false, expert: true },
                { value: 'extend', label: 'Extend Existing Entity', desc: 'Inherit all fields from an existing entity and add or constrain fields at your layer.', recommended: false, disabled: false },
              ] as const).map(opt => (
                <div
                  key={opt.value}
                  onClick={() => !opt.disabled && setPattern(opt.value as CreationPattern)}
                  style={{
                    padding: '14px 16px',
                    border: `2px solid ${pattern === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.5 : 1,
                    background: pattern === opt.value ? 'var(--primary-light, rgba(99,102,241,0.07))' : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${pattern === opt.value ? 'var(--primary)' : 'var(--border)'}`, background: pattern === opt.value ? 'var(--primary)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pattern === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{opt.label}</span>
                      {opt.recommended && <span className="badge badge-green" style={{ fontSize: '10px' }}>Recommended</span>}
                      {(opt as any).expert && <span className="badge badge-amber" style={{ fontSize: '10px' }}>Expert</span>}
                      {opt.disabled && <Lock size={12} style={{ color: 'var(--muted)' }} />}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1 (Extend pattern): Entity Picker ── */}
        {step === 1 && pattern === 'extend' && (() => {
          const allEntities = getEntityDefinitions(savedEntities);
          const q = entitySearchQ.toLowerCase();
          const filtered = allEntities.filter(e =>
            !q || e.label.toLowerCase().includes(q) || e.entityType.includes(q) || e.domain.toLowerCase().includes(q)
          );
          return (
            <div>
              <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Select Base Entity</h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
                Your new entity will inherit all fields from the selected base entity. You can then add new fields or constrain inherited ones at your layer.
              </p>
              <input
                className="search-input"
                style={{ width: '100%', marginBottom: '12px' }}
                placeholder="Search entities…"
                value={entitySearchQ}
                onChange={e => setEntitySearchQ(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
                {filtered.map(e => {
                  const isSelected = selectedBaseEntityType === e.entityType;
                  return (
                    <div
                      key={e.entityType}
                      onClick={() => setSelectedBaseEntityType(e.entityType)}
                      style={{
                        padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary-light, rgba(99,102,241,0.07))' : 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', gap: '12px',
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{e.label}</span>
                          <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{e.entityType}</code>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                          <span>{e.domain}</span>
                          <span>·</span>
                          <span>{e.owningLayer} layer</span>
                          <span>·</span>
                          <span>{e.fields.length} fields</span>
                        </div>
                      </div>
                      {isSelected && <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '24px' }}>No entities match your search.</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Step 1: Template Selection ── */}
        {step === 1 && pattern === 'template' && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Choose a Template</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Select the template that best matches your use case.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {templates.map(t => {
                const Icon = TEMPLATE_ICONS[t.templateId] ?? Database;
                const selected = selectedTemplateId === t.templateId;
                return (
                  <div
                    key={t.templateId}
                    onClick={() => applyTemplate(t.templateId)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selected ? 'var(--primary-light, rgba(99,102,241,0.07))' : 'var(--bg-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <Icon size={18} style={{ color: selected ? 'var(--primary)' : 'var(--muted)' }} />
                      <span style={{ fontWeight: 600 }}>{t.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>{t.description}</p>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      <div><strong>System fields:</strong> {t.systemFields.slice(0, 4).join(', ')}{t.systemFields.length > 4 ? ` +${t.systemFields.length - 4} more` : ''}</div>
                      <div style={{ marginTop: '4px' }}><strong>Workflow:</strong> {t.workflowRecommendation}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Entity Identity ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Entity Identity</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
              {pattern === 'extend'
                ? 'Name your extension entity. It will inherit all fields from the base entity.'
                : 'Define the name, type, and classification of this entity.'}
            </p>
            {/* Extend mode: show base entity banner */}
            {pattern === 'extend' && (() => {
              const base = getEntityDefinitions(savedEntities).find(e => e.entityType === selectedBaseEntityType);
              return base ? (
                <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 600 }}>Extending: </span>
                    {base.label} <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>({base.entityType})</code>
                    <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>— {base.fields.length} fields will be inherited</span>
                  </div>
                </div>
              ) : null;
            })()}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Entity Label *</label>
                <input
                  className="search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g., Insurance Claim"
                  value={label}
                  onChange={e => {
                    setLabel(e.target.value);
                    setEntityTypeOverride('');
                  }}
                />
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Human-readable name shown in the UI</p>
              </div>

              <div>
                <label className="form-label">Entity Type (Auto-generated, locked after creation)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="search-input"
                    style={{ width: '100%', fontFamily: 'monospace', paddingRight: '80px' }}
                    placeholder="entity_type"
                    value={entityTypeOverride || derivedEntityType}
                    onChange={e => setEntityTypeOverride(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 50))}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--muted)' }}>
                    {entityTypeOverride ? 'custom' : 'auto'}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Used as: <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px' }}>entity.{derivedEntityType || 'entity_type'}</code>
                </p>
                {/* Duplicate entity type warning (P1-10) */}
                {derivedEntityType && getEntityDefinitions(savedEntities).some(e => e.entityType === derivedEntityType) && (
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} /> Entity type <code style={{ fontFamily: 'monospace' }}>{derivedEntityType}</code> already exists. Choose a different label.
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Describe the purpose of this entity…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Domain</label>
                  <input className="search-input" style={{ width: '100%' }} placeholder="e.g., Sales" value={domain} onChange={e => setDomain(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="search-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value as EntityCategory)}>
                    <option value="transaction">Transaction</option>
                    <option value="master">Master Data</option>
                    <option value="configuration">Configuration</option>
                    <option value="ledger_like">Ledger-like</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Owning Layer</label>
                  <select className="search-input" style={{ width: '100%' }} value={owningLayer} onChange={e => setOwningLayer(e.target.value as LayerCode)}>
                    <option value="platform">Platform</option>
                    <option value="vertical">Vertical</option>
                    <option value="tenant">Tenant</option>
                    <option value="node">Node</option>
                  </select>
                </div>
              </div>

              {category === 'ledger_like' && (
                <div style={{ padding: '12px', background: 'var(--warning-bg, rgba(245,158,11,0.1))', border: '1px solid var(--warning-border, rgba(245,158,11,0.3))', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    <strong>Ledger-like entities</strong> have strict immutability rules. Records can never be deleted or soft-deleted. Corrections require counter-entries.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Behaviors ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Entity Behaviors</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Configure system capabilities for this entity.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                { key: 'workflowEnabled', label: 'Workflow Enabled', desc: 'Attach a state machine workflow to manage record lifecycle' },
                { key: 'auditable', label: 'Auditable', desc: 'Track all field changes with author, timestamp, and before/after values' },
                { key: 'softDelete', label: 'Soft Delete', desc: 'Records are archived (not permanently removed) when deleted' },
                { key: 'allowAttachments', label: 'Allow Attachments', desc: 'Enable file/document attachments on records' },
                { key: 'allowBulkImport', label: 'Allow Bulk Import', desc: 'Support bulk import via CSV/Excel uploads' },
                { key: 'allowDownstreamExtension', label: 'Allow Downstream Extension', desc: 'Downstream layers (tenant, node) can add new fields to this entity' },
                { key: 'allowDownstreamRequirednessRelaxation', label: 'Allow Requiredness Relaxation', desc: 'Downstream layers can make required fields optional' },
              ] as const).map(b => (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{b.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{b.desc}</div>
                  </div>
                  <button
                    onClick={() => setBehaviors(prev => ({ ...prev, [b.key]: !prev[b.key] }))}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: behaviors[b.key] ? 'var(--primary)' : 'var(--border)',
                      position: 'relative', transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.15s',
                      left: behaviors[b.key] ? '20px' : '2px',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '4px' }}>Review & Create</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Review your choices before creating the entity schema shell.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div className="form-label">Entity</div>
                <div style={{ fontWeight: 600 }}>{label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>entity.{derivedEntityType}</div>
              </div>
              <div>
                <div className="form-label">Category / Domain</div>
                <div>{category} · {domain}</div>
              </div>
              <div>
                <div className="form-label">Owning Layer</div>
                <div>{owningLayer}</div>
              </div>
              <div>
                <div className="form-label">Template</div>
                <div>{selectedTemplate?.label ?? (pattern === 'blank' ? 'Blank (no template)' : '—')}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div className="form-label">Behaviors</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {Object.entries(behaviors).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="tag">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="form-label">System Fields (auto-included)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {['Record ID', 'Status'].map(f => (
                  <span key={f} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={10} /> {f}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
              <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>
                Clicking <strong>Create Schema Shell</strong> will create the entity in draft state. You'll be taken to the Schema Builder to add fields.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button className="btn btn-ghost" onClick={step === 0 ? () => navigate('/admin/studio/entities') : back}>
          <ChevronLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < 4 ? (
          <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleCreate}>
            <Check size={14} /> Create Schema Shell
          </button>
        )}
      </div>
    </div>
  );
}
