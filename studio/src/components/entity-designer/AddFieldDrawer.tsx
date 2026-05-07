import { useState, useMemo } from 'react';
import {
  X, Search, BookOpen, FileText, AlertTriangle,
  ChevronDown, ChevronRight, Lock, Check, Info,
} from 'lucide-react';
import { getAdvancedAttributeCatalog } from '../../data/mockService';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import FieldTypeConfigurator from './FieldTypeConfigurator';
import OverlayConfirmationPanel from './OverlayConfirmationPanel';
import type {
  FieldInstance, FieldTypeCode, DataClassification, AdvancedCatalogAttribute,
  OverlayOperation, PresenceBehavior, EditabilityBehavior, VisibilityBehavior,
  AuditBehavior, DefaultSource,
} from '../../types/entityDesigner';
import type { LayerCode } from '../../types';
import { toSlug } from '../../utils/entityDesignerUtils';
import { LAYER_COLORS, LAYER_LABELS } from '../../utils/entityDesignerConstants';

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

interface Props {
  entityType: string;
  entityLabel: string;
  existingFieldIds: string[];
  onClose: () => void;
  editingField?: FieldInstance | null;
  constrainMode?: FieldInstance | null;
}

type DrawerStep = 'source' | 'catalog' | 'identity' | 'configure' | 'behavior' | 'governance';
type FieldSource = 'catalog' | 'local';

const STEP_LABELS: Record<DrawerStep, string> = {
  source:    'Source',
  catalog:   'Attribute',
  identity:  'Identity',
  configure: 'Configure',
  behavior:  'Behavior',
  governance:'Governance',
};

const FIELD_TYPES: { value: FieldTypeCode; label: string; group: string }[] = [
  { value: 'text',         label: 'Text',               group: 'Basic' },
  { value: 'textarea',     label: 'Text Area',          group: 'Basic' },
  { value: 'number',       label: 'Number',             group: 'Basic' },
  { value: 'decimal',      label: 'Decimal',            group: 'Basic' },
  { value: 'boolean',      label: 'Boolean / Toggle',   group: 'Basic' },
  { value: 'date',         label: 'Date',               group: 'Date & Time' },
  { value: 'datetime',     label: 'Date & Time',        group: 'Date & Time' },
  { value: 'time',         label: 'Time',               group: 'Date & Time' },
  { value: 'currency',     label: 'Currency',           group: 'Finance' },
  { value: 'percentage',   label: 'Percentage',         group: 'Finance' },
  { value: 'select',       label: 'Select (dropdown)',  group: 'Selection' },
  { value: 'multi_select', label: 'Multi-Select',       group: 'Selection' },
  { value: 'entity_ref',   label: 'Entity Reference',   group: 'Relations' },
  { value: 'file',         label: 'File Upload',        group: 'Media' },
  { value: 'collection',   label: 'Collection / Grid',  group: 'Complex' },
  { value: 'email',        label: 'Email',              group: 'Contact' },
  { value: 'phone',        label: 'Phone',              group: 'Contact' },
  { value: 'url',          label: 'URL',                group: 'Contact' },
  { value: 'auto_number',  label: 'Auto Number',        group: 'Advanced' },
  { value: 'computed',     label: 'Computed',           group: 'Advanced' },
  { value: 'rollup',       label: 'Rollup (Aggregate)', group: 'Advanced' },
  { value: 'json',         label: 'JSON',               group: 'Advanced' },
  { value: 'rich_text',    label: 'Rich Text',          group: 'Advanced' },
  { value: 'geo_point',    label: 'Geo Point',          group: 'Advanced' },
  { value: 'signature',    label: 'Signature',          group: 'Advanced' },
  { value: 'barcode',      label: 'Barcode / QR',       group: 'Advanced' },
  { value: 'rating',       label: 'Rating',             group: 'Advanced' },
];

const CLASSIFICATION_DEFS: { value: DataClassification; label: string; color: string; desc: string }[] = [
  { value: 'open',      label: 'Open',      color: '#16a34a', desc: 'Safe to share externally — portals, public APIs, exports' },
  { value: 'internal',  label: 'Internal',  color: '#6b7280', desc: 'Business use only — not for external audiences (default)' },
  { value: 'sensitive', label: 'Sensitive', color: '#d97706', desc: 'Personal or commercially confidential data' },
  { value: 'regulated', label: 'Regulated', color: '#dc2626', desc: 'Subject to external legal or regulatory obligation' },
];

const PRESENCE_OPTIONS: { value: PresenceBehavior; label: string; desc: string; disabled?: boolean }[] = [
  { value: 'optional',       label: 'Optional',                 desc: 'Field can be left empty' },
  { value: 'on_create',      label: 'Required on Create',       desc: 'Must be filled when creating a new record' },
  { value: 'on_update',      label: 'Required on Update',       desc: 'Must be filled when updating a record' },
  { value: 'before_submit',  label: 'Required Before Submit',   desc: 'Must be filled before submitting for approval' },
  { value: 'before_approve', label: 'Required Before Approve',  desc: 'Must be filled before the record can be approved' },
  { value: 'conditional',    label: 'Conditional',              desc: 'Required based on a rule condition', disabled: true },
];

const EDITABILITY_OPTIONS: { value: EditabilityBehavior; label: string }[] = [
  { value: 'always',           label: 'Editable Always' },
  { value: 'create_only',      label: 'Editable on Create Only' },
  { value: 'until_submit',     label: 'Editable Until Submit' },
  { value: 'readonly',         label: 'Read-only' },
  { value: 'system_only',      label: 'System Only' },
  { value: 'integration_only', label: 'Integration Only — populated by external system' },
];

const VISIBILITY_OPTIONS: { value: VisibilityBehavior; label: string }[] = [
  { value: 'default', label: 'Visible by Default' },
  { value: 'hidden',  label: 'Hidden by Default' },
  { value: 'masked',  label: 'Masked (shows •••)' },
];

const DEFAULT_SOURCE_OPTIONS: { value: DefaultSource; label: string }[] = [
  { value: 'none',                    label: 'No Default' },
  { value: 'static',                  label: 'Static Value' },
  { value: 'today',                   label: 'Today (date fields)' },
  { value: 'now',                     label: 'Now (datetime fields)' },
  { value: 'session_tenant',          label: 'Session Tenant' },
  { value: 'session_node',            label: 'Session Node' },
  { value: 'session_user',            label: 'Session User' },
  { value: 'tenant_default_currency', label: 'Tenant Default Currency' },
];

const AUDIT_OPTIONS: { value: AuditBehavior; label: string }[] = [
  { value: 'none',         label: 'None' },
  { value: 'audit_change', label: 'Audit Changes' },
  { value: 'audit_masked', label: 'Audit & Mask Values' },
];

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────

function inferClassification(fieldType: FieldTypeCode): DataClassification {
  if (['email', 'phone', 'signature', 'geo_point'].includes(fieldType)) return 'sensitive';
  return 'internal';
}

function makeDefaultGovernance(classification: DataClassification, isComputed = false) {
  const isSensitive = classification === 'sensitive' || classification === 'regulated';
  return {
    classification,
    canDownstreamConstrain: true,
    canDownstreamRelax:     false,
    canDownstreamDisable:   false,
    includeInExport:        !isSensitive,
    allowImport:            false,
    allowBulkUpdate:        false,
    maskInExport:           isSensitive,
    apiInputAllowed:        !isComputed,
    apiOutputAllowed:       true,
    apiOutputMasked:        isSensitive,
    isExternalId:           false,
  };
}

function makeDefaultField(source: FieldSource, layer: LayerCode, catalog?: AdvancedCatalogAttribute): FieldInstance {
  const isComputed = catalog?.field_type === 'computed';
  const cls: DataClassification = catalog?.classification ?? 'internal';
  return {
    fieldId:          catalog ? catalog.attribute_code : '',
    label:            catalog?.label ?? '',
    description:      catalog?.description ?? '',
    fieldType:        (catalog?.field_type ?? 'text') as FieldTypeCode,
    sourceLayer:      layer,
    overlayOperation: 'extend',
    protected:        false,
    classification:   cls,
    behaviors: {
      presence: 'optional', editability: isComputed ? 'readonly' : 'always',
      visibility: 'default', defaultSource: 'none',
      searchable: false, filterable: false, sortable: false,
      includeInDefaultList: false, includeInLookupDisplay: false, auditBehavior: 'none',
      ...(catalog?.defaultBehaviors ?? {}),
    },
    typeConfig: {},
    governance: { ...makeDefaultGovernance(cls, isComputed), ...(catalog?.defaultGovernance ?? {}) },
    lifecycle: 'draft', attributeRef: catalog?.attribute_code, order: 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => !disabled && onChange(!value)}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
        background: value ? 'var(--accent)' : 'var(--border)',
        position: 'relative', opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', left: value ? '18px' : '2px' }} />
    </button>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 14px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Catalog domain group
// ─────────────────────────────────────────────────────────────

function DomainGroup({ domain, attrs, onSelect, onHover, entityType }: {
  domain: string; attrs: AdvancedCatalogAttribute[];
  onSelect: (a: AdvancedCatalogAttribute) => void;
  onHover: (a: AdvancedCatalogAttribute | null) => void;
  entityType: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: '4px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ padding: '7px 12px', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
        {open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />}
        <span style={{ fontWeight: 600, fontSize: '12px' }}>{domain}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>{attrs.length}</span>
      </div>
      {open && attrs.map(attr => {
        const alreadyUsed = attr.used_in.includes(entityType);
        return (
          <div key={attr.attribute_code} onClick={() => onSelect(attr)}
            onMouseEnter={() => onHover(attr)} onMouseLeave={() => onHover(null)}
            style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
            className="catalog-row"
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, fontSize: '13px' }}>{attr.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)' }}>{attr.attribute_code}</span>
                {alreadyUsed && <span className="badge badge-blue" style={{ fontSize: '9px' }}>used</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                {attr.field_type} · {attr.classification}
              </div>
            </div>
            <ChevronRight size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function AddFieldDrawer({
  entityType, entityLabel, existingFieldIds, onClose, editingField, constrainMode,
}: Props) {
  const catalog = useMemo(() => getAdvancedAttributeCatalog(), []);
  const { setPendingField, confirmPendingField } = useEntityDesignerStore();

  const isConstrainMode = !!constrainMode;
  const isEditMode      = !!editingField && !isConstrainMode;

  // ── State ──────────────────────────────────────────────────
  const [selectedLayer, setSelectedLayer] = useState<LayerCode>(
    constrainMode?.sourceLayer ?? editingField?.sourceLayer ?? 'tenant',
  );
  const [source, setSource]   = useState<FieldSource>('catalog');
  const [step, setStep]       = useState<DrawerStep>(
    isConstrainMode ? 'behavior' : isEditMode ? 'configure' : 'source',
  );
  const [selectedCatalogEntry, setSelectedCatalogEntry] = useState<AdvancedCatalogAttribute | null>(null);
  const [hoveredCatalogEntry, setHoveredCatalogEntry]   = useState<AdvancedCatalogAttribute | null>(null);
  const [field, setField]     = useState<FieldInstance>(
    constrainMode ?? editingField ?? makeDefaultField('catalog', 'tenant'),
  );
  const [showConfirmPanel, setShowConfirmPanel]   = useState(false);
  const [catalogSearch, setCatalogSearch]         = useState('');
  const [fieldIdManuallySet, setFieldIdManuallySet] = useState(false);

  // ── Derived ────────────────────────────────────────────────
  const isLayerLocked = !isEditMode && source === 'catalog' && !!selectedCatalogEntry;

  const steps = useMemo((): DrawerStep[] => {
    if (isConstrainMode) return ['behavior', 'governance'];
    if (isEditMode)      return ['configure', 'behavior', 'governance'];
    if (source === 'catalog') return ['source', 'catalog', 'configure', 'behavior', 'governance'];
    return ['source', 'identity', 'configure', 'behavior', 'governance'];
  }, [source, isEditMode, isConstrainMode]);

  const stepIdx = steps.indexOf(step);

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return catalog;
    const q = catalogSearch.toLowerCase();
    return catalog.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.attribute_code.includes(q) ||
      (a.description?.toLowerCase().includes(q) ?? false),
    );
  }, [catalog, catalogSearch]);

  const catalogByDomain = useMemo(() => {
    const grouped: Record<string, AdvancedCatalogAttribute[]> = {};
    for (const attr of filteredCatalog) {
      if (!grouped[attr.domain]) grouped[attr.domain] = [];
      grouped[attr.domain].push(attr);
    }
    return grouped;
  }, [filteredCatalog]);

  const sortedDomains = useMemo(() => Object.keys(catalogByDomain).sort(), [catalogByDomain]);

  const similarCatalogEntries = useMemo(() => {
    if (source !== 'local' || !field.label.trim()) return [];
    const q = field.label.toLowerCase();
    return catalog.filter(a =>
      a.label.toLowerCase().includes(q) || q.includes(a.label.toLowerCase().slice(0, 4))
    ).slice(0, 3);
  }, [catalog, field.label, source]);

  const canProceedFromIdentity =
    field.label.trim().length >= 2 &&
    field.fieldId.length >= 1 &&
    !existingFieldIds.includes(field.fieldId);

  // ── Handlers ───────────────────────────────────────────────

  const handleSourceSelect = (src: FieldSource) => {
    setSource(src);
    if (src === 'catalog') {
      setStep('catalog');
    } else {
      setField(makeDefaultField('local', selectedLayer));
      setFieldIdManuallySet(false);
      setStep('identity');
    }
  };

  const handleSelectCatalog = (entry: AdvancedCatalogAttribute) => {
    setSelectedCatalogEntry(entry);
    setSelectedLayer(entry.owner_layer);
    setField(makeDefaultField('catalog', entry.owner_layer, entry));
    setStep('configure');
  };

  const handleTypeChange = (newType: FieldTypeCode) => {
    const isComputed  = newType === 'computed';
    const inferred    = inferClassification(newType);
    const isSensitive = inferred === 'sensitive' || inferred === 'regulated';
    setField(f => ({
      ...f,
      fieldType: newType, typeConfig: {},
      classification: inferred,
      behaviors: {
        ...f.behaviors,
        editability: isComputed ? 'readonly' : f.behaviors.editability === 'readonly' ? 'always' : f.behaviors.editability,
        presence: isComputed ? 'optional' : f.behaviors.presence,
      },
      governance: {
        ...f.governance,
        classification: inferred,
        includeInExport: !isSensitive,
        maskInExport: isSensitive,
        apiInputAllowed: !isComputed,
        apiOutputMasked: isSensitive,
      },
    }));
  };

  const handleLabelChange = (newLabel: string) => {
    setField(f => ({
      ...f,
      label: newLabel,
      fieldId: fieldIdManuallySet ? f.fieldId : toSlug(newLabel),
    }));
  };

  const handleClassificationChange = (cls: DataClassification) => {
    const isSensitive = cls === 'sensitive' || cls === 'regulated';
    setField(f => ({
      ...f,
      classification: cls,
      governance: {
        ...f.governance,
        classification: cls,
        includeInExport: !isSensitive,
        maskInExport: isSensitive,
        apiOutputMasked: isSensitive,
      },
    }));
  };

  const handleNext = () => {
    if (step === 'identity')   { setStep('configure'); return; }
    if (step === 'configure')  { setStep('behavior'); return; }
    if (step === 'behavior')   { setStep('governance'); return; }
    if (step === 'governance') { setShowConfirmPanel(true); return; }
  };

  const handleBack = () => {
    setShowConfirmPanel(false);
    if (step === 'source')    { onClose(); return; }
    if (step === 'catalog')   { setStep('source'); return; }
    if (step === 'identity')  { setStep('source'); return; }
    if (step === 'configure') {
      if (isEditMode)              { onClose(); return; }
      if (source === 'catalog')    { setStep('catalog'); return; }
      setStep('identity');
      return;
    }
    if (step === 'behavior') {
      if (isConstrainMode) { onClose(); return; }
      setStep('configure');
      return;
    }
    if (step === 'governance') { setStep('behavior'); return; }
  };

  const handleSave = () => {
    let finalField = { ...field };
    if (field.fieldType === 'computed') {
      finalField = { ...finalField, behaviors: { ...finalField.behaviors, editability: 'readonly', presence: 'optional' } };
    }
    if (isConstrainMode && constrainMode) {
      finalField = { ...finalField, overlayOperation: 'constrain', inheritedFrom: constrainMode.inheritedFrom };
    } else if (isEditMode && editingField) {
      const op: OverlayOperation = finalField.fieldType !== editingField.fieldType ? 'replace' : 'constrain';
      finalField = { ...finalField, overlayOperation: op };
    } else {
      finalField = { ...finalField, overlayOperation: 'extend' };
    }
    setPendingField({ entityType, field: finalField });
    confirmPendingField();
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 900 }} onClick={onClose} />

      {/* Drawer — 2/3 of page */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(67vw, 1100px)', minWidth: '720px',
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        zIndex: 901, display: 'flex', flexDirection: 'column',
        boxShadow: '-6px 0 32px rgba(0,0,0,0.18)',
      }}>

        {/* ── Header ── */}
        <div style={{ borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)' }}>
          <div style={{ padding: '16px 28px 12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {isConstrainMode ? 'Constrain Inherited Field' : isEditMode ? 'Edit Field' : 'Add Field'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '1px' }}>{entityLabel}</div>
            </div>

            {/* Active field identity chip */}
            {!['source', 'catalog'].includes(step) && field.label && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px',
                borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{field.label}</span>
                <span style={{
                  padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  background: 'var(--accent)', color: '#fff', fontFamily: 'monospace',
                }}>{field.fieldType}</span>
                {isLayerLocked && (
                  <span style={{
                    padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    background: `${LAYER_COLORS[field.sourceLayer]}18`,
                    border: `1px solid ${LAYER_COLORS[field.sourceLayer]}`,
                    color: LAYER_COLORS[field.sourceLayer],
                  }}>{LAYER_LABELS[field.sourceLayer]}</span>
                )}
              </div>
            )}

            <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={16} /></button>
          </div>

          {/* Step progress */}
          <div style={{ padding: '0 28px 16px', display: 'flex', alignItems: 'flex-start' }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'flex-start', flex: i < steps.length - 1 ? 1 : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
                    background: i <= stepIdx ? 'var(--accent)' : 'var(--bg-secondary)',
                    color:      i <= stepIdx ? '#fff' : 'var(--muted)',
                    border:    `2px solid ${i <= stepIdx ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    {i < stepIdx ? <Check size={12} /> : i + 1}
                  </div>
                  <span style={{
                    fontSize: '11px', whiteSpace: 'nowrap', transition: 'color 0.2s',
                    fontWeight: i === stepIdx ? 700 : 400,
                    color: i === stepIdx ? 'var(--accent)' : i < stepIdx ? 'var(--text)' : 'var(--muted)',
                  }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', marginTop: '13px',
                    background: i < stepIdx ? 'var(--accent)' : 'var(--border)',
                    minWidth: '24px', transition: 'background 0.2s',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ════════════════════════════════════════════
              STEP: source — choose catalog or local
              ════════════════════════════════════════════ */}
          {step === 'source' && (
            <div style={{ padding: '32px 28px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>How would you like to add a field?</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Catalog attributes are governed and reusable. Local fields are specific to this entity.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Catalog card */}
                <div onClick={() => handleSourceSelect('catalog')}
                  style={{
                    padding: '24px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${source === 'catalog' ? 'var(--accent)' : 'var(--border)'}`,
                    background: source === 'catalog' ? 'hsl(22 100% 51% / 0.07)' : 'var(--bg-secondary)',
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: source === 'catalog' ? 'var(--accent)' : 'var(--border)',
                    }}>
                      <BookOpen size={18} style={{ color: source === 'catalog' ? '#fff' : 'var(--muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>Attribute Catalog</div>
                      <span className="badge badge-green" style={{ fontSize: '10px', marginTop: '2px' }}>Recommended</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    Pick from pre-governed, reusable attributes. Type, classification, and default behaviors are pre-configured by your platform team.
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Pre-typed', 'Reusable', 'Policy-backed'].map(t => (
                      <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Local card */}
                <div onClick={() => handleSourceSelect('local')}
                  style={{
                    padding: '24px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${source === 'local' ? 'var(--accent)' : 'var(--border)'}`,
                    background: source === 'local' ? 'hsl(22 100% 51% / 0.07)' : 'var(--bg-secondary)',
                    transition: 'border-color 0.15s, background 0.15s',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: source === 'local' ? 'var(--accent)' : 'var(--border)',
                    }}>
                      <FileText size={18} style={{ color: source === 'local' ? '#fff' : 'var(--muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>Local Field</div>
                      <span className="badge" style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)', marginTop: '2px' }}>Use sparingly</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    Create a field unique to this entity. Only use when no suitable catalog attribute exists — local fields are not reusable.
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Entity-specific', 'Fully customizable', 'Not reusable'].map(t => (
                      <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              STEP: catalog — 2-panel browse + preview
              ════════════════════════════════════════════ */}
          {step === 'catalog' && (
            <div style={{ display: 'flex', height: '100%' }}>
              {/* Left: search + list */}
              <div style={{ flex: '0 0 52%', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px' }}>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="search-input" style={{ paddingLeft: '32px', width: '100%' }}
                    placeholder="Search attributes by name, code, or description…"
                    value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} autoFocus />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                  {filteredCatalog.length} attribute{filteredCatalog.length !== 1 ? 's' : ''} across {sortedDomains.length} domain{sortedDomains.length !== 1 ? 's' : ''}
                </div>
                {sortedDomains.length > 0 ? sortedDomains.map(domain => (
                  <DomainGroup key={domain} domain={domain} attrs={catalogByDomain[domain]}
                    onSelect={handleSelectCatalog} onHover={setHoveredCatalogEntry} entityType={entityType} />
                )) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontSize: '13px' }}>
                    <Search size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <div>No attributes match your search.</div>
                    <button className="btn btn-ghost" style={{ marginTop: '10px', fontSize: '12px' }} onClick={() => handleSourceSelect('local')}>
                      Create a Local Field instead →
                    </button>
                  </div>
                )}
              </div>

              {/* Right: attribute preview */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {hoveredCatalogEntry ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{hoveredCatalogEntry.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>{hoveredCatalogEntry.attribute_code}</div>

                    {hoveredCatalogEntry.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        {hoveredCatalogEntry.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Field Type',      value: hoveredCatalogEntry.field_type },
                        { label: 'Domain',          value: hoveredCatalogEntry.domain },
                        { label: 'Classification',  value: hoveredCatalogEntry.classification },
                        { label: 'Owner Layer',     value: LAYER_LABELS[hoveredCatalogEntry.owner_layer] ?? hoveredCatalogEntry.owner_layer },
                        { label: 'Protected',       value: hoveredCatalogEntry.protected ? 'Yes' : 'No' },
                        { label: 'Reusable',        value: hoveredCatalogEntry.reusable ? 'Yes' : 'No' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--muted)', width: '110px', flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontWeight: 500 }}>{String(row.value)}</span>
                        </div>
                      ))}
                      {hoveredCatalogEntry.used_in.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--muted)', width: '110px', flexShrink: 0 }}>Used in</span>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {hoveredCatalogEntry.used_in.map(e => (
                              <span key={e} style={{ padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '10px' }}>{e}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => handleSelectCatalog(hoveredCatalogEntry)}>
                      Use this attribute →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', textAlign: 'center', gap: '8px' }}>
                    <Info size={28} style={{ opacity: 0.3 }} />
                    <div style={{ fontSize: '13px' }}>Hover over an attribute to preview its details</div>
                    <div style={{ fontSize: '11px' }}>Click to select it and proceed to configuration</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              STEP: identity — label, type, layer, classification
              ════════════════════════════════════════════ */}
          {step === 'identity' && (
            <div style={{ padding: '28px' }}>
              {/* Local field advisory */}
              <div style={{
                padding: '10px 14px', background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px',
                marginBottom: '24px', display: 'flex', gap: '10px', fontSize: '12px', color: '#92400e',
              }}>
                <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                <span>Local fields are not reusable across entities. Before creating one, confirm no catalog attribute meets your need.</span>
              </div>

              {/* Row 1: Label + Field ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Label <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="search-input" style={{ width: '100%' }}
                    value={field.label} autoFocus
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder="e.g. Customer Code" />
                </div>
                <div>
                  <label className="form-label">
                    Field ID <Lock size={10} style={{ color: 'var(--muted)', marginLeft: '3px' }} />
                    <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '4px' }}>(auto-generated, editable before save)</span>
                  </label>
                  <input className="search-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={field.fieldId}
                    onChange={e => {
                      setFieldIdManuallySet(true);
                      setField(f => ({ ...f, fieldId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                    }}
                    placeholder="auto_generated_from_label" />
                  {existingFieldIds.includes(field.fieldId) && field.fieldId !== '' && (
                    <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>⚠ Field ID already exists in this entity</p>
                  )}
                </div>
              </div>

              {/* Row 2: Description full width */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Description <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
                <input className="search-input" style={{ width: '100%' }}
                  value={field.description ?? ''}
                  onChange={e => setField(f => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe what this field captures" />
              </div>

              {/* Row 3: Data Type + Layer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Data Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="search-input" style={{ width: '100%' }}
                    value={field.fieldType}
                    onChange={e => handleTypeChange(e.target.value as FieldTypeCode)}>
                    {Array.from(new Set(FIELD_TYPES.map(t => t.group))).map(group => (
                      <optgroup key={group} label={group}>
                        {FIELD_TYPES.filter(t => t.group === group).map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assign to Layer</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['platform', 'vertical', 'tenant'] as LayerCode[]).map(l => {
                      const color = LAYER_COLORS[l]; const isActive = field.sourceLayer === l;
                      return (
                        <button key={l} type="button"
                          onClick={() => { setSelectedLayer(l); setField(f => ({ ...f, sourceLayer: l })); }}
                          style={{
                            flex: 1, padding: '7px 4px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: `2px solid ${isActive ? color : 'var(--border)'}`,
                            background: isActive ? `${color}18` : 'transparent',
                            color: isActive ? color : 'var(--muted)', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}>
                          {LAYER_LABELS[l]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Classification — 4 cards in a row */}
              <div>
                <label className="form-label">Data Classification</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {CLASSIFICATION_DEFS.map(def => {
                    const selected = field.classification === def.value;
                    return (
                      <div key={def.value} onClick={() => handleClassificationChange(def.value)}
                        style={{
                          padding: '12px', borderRadius: '8px', cursor: 'pointer',
                          border: `2px solid ${selected ? def.color : 'var(--border)'}`,
                          background: selected ? `${def.color}10` : 'transparent',
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: selected ? def.color : 'var(--text)' }}>{def.label}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>{def.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Similar catalog entries warning */}
              {similarCatalogEntries.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center', color: '#d97706' }}>
                    <AlertTriangle size={12} /> Similar catalog attributes found — consider using these instead:
                  </div>
                  {similarCatalogEntries.map(a => (
                    <div key={a.attribute_code} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0', fontSize: '12px' }}>
                      <span style={{ flex: 1, color: 'var(--muted)' }}>{a.label} <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>({a.attribute_code})</span></span>
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => handleSelectCatalog(a)}>Use this</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              STEP: configure — type-specific settings
              ════════════════════════════════════════════ */}
          {step === 'configure' && (
            <div style={{ padding: '28px' }}>
              {/* Constrain mode banner */}
              {isConstrainMode && constrainMode && (
                <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} style={{ color: 'var(--muted)' }} /> Inherited from <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{constrainMode.inheritedFrom}</code>
                  </div>
                  <div style={{ color: 'var(--muted)' }}>You can tighten constraints (requiredness, visibility, classification) but cannot change the field type, ID, or label.</div>
                </div>
              )}

              {/* Field context header */}
              {!isConstrainMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{field.label || '(no label yet)'}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                      {field.fieldId} · {field.sourceLayer}
                    </div>
                    {selectedCatalogEntry && (
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        From catalog · domain: <strong>{selectedCatalogEntry.domain}</strong>
                      </div>
                    )}
                  </div>
                  {/* Layer badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                    background: `${LAYER_COLORS[field.sourceLayer]}18`,
                    border: `2px solid ${LAYER_COLORS[field.sourceLayer]}`,
                    color: LAYER_COLORS[field.sourceLayer],
                  }}>{LAYER_LABELS[field.sourceLayer]}</span>
                </div>
              )}

              {/* Type selector — only for edit mode or local when we want to allow change */}
              {isEditMode && !field.protected && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Data Type</label>
                  <select className="search-input" style={{ width: '360px' }}
                    value={field.fieldType}
                    onChange={e => handleTypeChange(e.target.value as FieldTypeCode)}>
                    {Array.from(new Set(FIELD_TYPES.map(t => t.group))).map(group => (
                      <optgroup key={group} label={group}>
                        {FIELD_TYPES.filter(t => t.group === group).map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* Type configurator */}
              {!isConstrainMode ? (
                <FieldTypeConfigurator
                  fieldType={field.fieldType}
                  typeConfig={field.typeConfig}
                  onChange={typeConfig => setField(f => ({ ...f, typeConfig }))}
                  disabled={field.protected}
                  currentEntityType={entityType}
                />
              ) : (
                <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
                  <Lock size={18} style={{ opacity: 0.4, marginBottom: '6px' }} />
                  <div>Type configuration is locked for inherited fields.</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>Proceed to Behavior to set constraints.</div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              STEP: behavior — 2-column layout
              ════════════════════════════════════════════ */}
          {step === 'behavior' && (
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* Left: Presence */}
                <div>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Presence / Requiredness</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {PRESENCE_OPTIONS.map(opt => {
                      const isSelected = field.behaviors.presence === opt.value;
                      return (
                        <label key={opt.value}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '10px 12px', borderRadius: '7px', cursor: opt.disabled || field.protected ? 'not-allowed' : 'pointer',
                            opacity: opt.disabled ? 0.45 : 1,
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            background: isSelected ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
                            transition: 'all 0.12s',
                          }}>
                          <input type="radio" name="presence" value={opt.value}
                            checked={isSelected} disabled={opt.disabled || field.protected}
                            onChange={() => setField(f => ({ ...f, behaviors: { ...f.behaviors, presence: opt.value } }))}
                            style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Editability, Visibility, Default, Audit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Editability</label>
                    <select className="search-input" style={{ width: '100%' }}
                      value={field.behaviors.editability} disabled={field.protected}
                      onChange={e => setField(f => ({ ...f, behaviors: { ...f.behaviors, editability: e.target.value as EditabilityBehavior } }))}>
                      {EDITABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Visibility</label>
                    <select className="search-input" style={{ width: '100%' }}
                      value={field.behaviors.visibility} disabled={field.protected}
                      onChange={e => setField(f => ({ ...f, behaviors: { ...f.behaviors, visibility: e.target.value as VisibilityBehavior } }))}>
                      {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Default Value Source</label>
                    <select className="search-input" style={{ width: '100%' }}
                      value={field.behaviors.defaultSource}
                      onChange={e => setField(f => ({ ...f, behaviors: { ...f.behaviors, defaultSource: e.target.value as DefaultSource } }))}>
                      {DEFAULT_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {field.behaviors.defaultSource === 'static' && (
                      <input className="search-input" style={{ width: '100%', marginTop: '6px' }}
                        placeholder="Enter static default value…"
                        value={String(field.behaviors.defaultValue ?? '')}
                        onChange={e => setField(f => ({ ...f, behaviors: { ...f.behaviors, defaultValue: e.target.value } }))} />
                    )}
                  </div>

                  <div>
                    <label className="form-label">Audit Behavior</label>
                    <select className="search-input" style={{ width: '100%' }}
                      value={field.behaviors.auditBehavior}
                      onChange={e => setField(f => ({ ...f, behaviors: { ...f.behaviors, auditBehavior: e.target.value as AuditBehavior } }))}>
                      {AUDIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Search & List toggles — full width row */}
              <SectionDivider label="Search & List Behaviour" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {([
                  { key: 'searchable',            label: 'Searchable',              desc: 'Appears in global search' },
                  { key: 'filterable',             label: 'Filterable',              desc: 'Available as a filter' },
                  { key: 'sortable',               label: 'Sortable',                desc: 'Column can be sorted' },
                  { key: 'includeInDefaultList',   label: 'Default List',            desc: 'Shows in list view by default' },
                  { key: 'includeInLookupDisplay', label: 'Lookup Display',          desc: 'Shown in entity_ref dropdowns' },
                ] as const).map(t => {
                  const val = field.behaviors[t.key] as boolean;
                  return (
                    <div key={t.key} onClick={() => !field.protected && setField(f => ({ ...f, behaviors: { ...f.behaviors, [t.key]: !val } }))}
                      style={{
                        padding: '12px', borderRadius: '8px', cursor: field.protected ? 'not-allowed' : 'pointer',
                        border: `2px solid ${val ? 'var(--accent)' : 'var(--border)'}`,
                        background: val ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
                        transition: 'all 0.12s', textAlign: 'center',
                      }}>
                      <div style={{ marginBottom: '6px' }}>
                        <Toggle value={val} onChange={v => !field.protected && setField(f => ({ ...f, behaviors: { ...f.behaviors, [t.key]: v } }))} disabled={field.protected} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: val ? 600 : 400, color: val ? 'var(--accent)' : 'var(--text)' }}>{t.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{t.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              STEP: governance — classification + toggles
              ════════════════════════════════════════════ */}
          {step === 'governance' && (
            <div style={{ padding: '28px' }}>

              {/* Classification display (read-only summary, with change option for local fields) */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Data Classification</label>
                {source === 'local' && !isEditMode ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {CLASSIFICATION_DEFS.map(def => {
                      const selected = field.classification === def.value;
                      return (
                        <div key={def.value} onClick={() => handleClassificationChange(def.value)}
                          style={{
                            padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                            border: `2px solid ${selected ? def.color : 'var(--border)'}`,
                            background: selected ? `${def.color}10` : 'transparent',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: def.color }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: selected ? def.color : 'var(--text)' }}>{def.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{def.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Read-only classification badge */
                  (() => {
                    const def = CLASSIFICATION_DEFS.find(d => d.value === field.classification);
                    return def ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px', background: `${def.color}10`, border: `1px solid ${def.color}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: def.color }}>{def.label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>— {def.desc}</span>
                      </div>
                    ) : null;
                  })()
                )}
              </div>

              {/* Sensitivity alert */}
              {(field.classification === 'sensitive' || field.classification === 'regulated') && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', color: '#dc2626', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span><strong>{field.classification.charAt(0).toUpperCase() + field.classification.slice(1)}</strong> classification — export masking and API output masking defaults have been pre-set. Override only if you have a specific governance reason.</span>
                </div>
              )}

              {/* Export & API toggles — 2x2 grid */}
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Data Access Controls</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {([
                  { key: 'includeInExport', label: 'Include in Export', desc: 'Field is included in CSV / data export files', locked: false },
                  { key: 'maskInExport',    label: 'Mask in Export',    desc: 'Exported value shows ••• instead of actual data', locked: false },
                  { key: 'apiInputAllowed', label: 'API Input Allowed', desc: 'Field can be written via the REST API', locked: field.fieldType === 'computed' || field.fieldType === 'rollup' },
                  { key: 'apiOutputMasked', label: 'API Output Masked', desc: 'API response returns ••• for this field', locked: false },
                ] as const).map(({ key, label, desc, locked }) => {
                  const val = field.governance[key] as boolean;
                  return (
                    <div key={key}
                      style={{
                        padding: '14px 16px', borderRadius: '8px',
                        border: `1px solid ${val && !locked ? 'var(--accent)' : 'var(--border)'}`,
                        background: val && !locked ? 'hsl(22 100% 51% / 0.06)' : 'var(--bg-secondary)',
                        opacity: locked ? 0.55 : 1,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                      }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {desc}{locked ? ' — locked for computed/rollup fields' : ''}
                        </div>
                      </div>
                      <Toggle value={val} onChange={v => !locked && !field.protected && setField(f => ({ ...f, governance: { ...f.governance, [key]: v } }))} disabled={locked || field.protected} />
                    </div>
                  );
                })}
              </div>

              {/* External ID */}
              <SectionDivider label="Integration" />
              {(() => {
                const val = field.governance.isExternalId ?? false;
                return (
                  <div style={{
                    padding: '14px 16px', borderRadius: '8px',
                    border: `1px solid ${val ? 'var(--accent)' : 'var(--border)'}`,
                    background: val ? 'hsl(22 100% 51% / 0.06)' : 'var(--bg-secondary)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>External ID</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        Marks this field as the integration upsert matching key — e.g. SAP material code, ERP customer ID, CRM contact ID
                      </div>
                    </div>
                    <Toggle value={val} onChange={v => !field.protected && setField(f => ({ ...f, governance: { ...f.governance, isExternalId: v } }))} disabled={field.protected} />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {showConfirmPanel ? (
          <OverlayConfirmationPanel
            field={{ ...field, overlayOperation:
              isConstrainMode ? 'constrain'
              : isEditMode && editingField ? (field.fieldType !== editingField.fieldType ? 'replace' : 'constrain')
              : 'extend' }}
            entityType={entityType}
            onConfirm={handleSave}
            onCancel={() => setShowConfirmPanel(false)}
          />
        ) : (
          <div style={{
            padding: '14px 28px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, background: 'var(--bg-secondary)',
          }}>
            <button className="btn btn-ghost" onClick={handleBack}>
              {stepIdx === 0 || (isEditMode && step === 'configure') || (isConstrainMode && step === 'behavior')
                ? 'Cancel' : '← Back'}
            </button>

            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Step {stepIdx + 1} of {steps.length}
            </span>

            {/* Catalog step: clicking attr auto-advances; no Next button */}
            {step !== 'catalog' && step !== 'source' && (
              <button className="btn btn-primary"
                onClick={handleNext}
                disabled={step === 'identity' && !canProceedFromIdentity}>
                {step === 'governance' ? '✓ Save Field' : 'Next →'}
              </button>
            )}

            {/* Source step: no footer button — cards are clickable */}
            {step === 'source' && <div style={{ width: '80px' }} />}
          </div>
        )}
      </div>
    </>
  );
}
