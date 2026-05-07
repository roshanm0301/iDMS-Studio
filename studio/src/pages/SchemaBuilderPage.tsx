// ============================================================
// SchemaBuilderPage — 3-panel Entity Schema Builder
// ============================================================
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, XCircle, X, Copy, Check, Braces } from 'lucide-react';

import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getEntityDefinition } from '../data/mockService';
import { detectAllConflicts } from '../utils/conflictDetection';

import EntityContextBar from '../components/entity-designer/EntityContextBar';
import FieldGrid from '../components/entity-designer/FieldGrid';
import FieldInspector from '../components/entity-designer/FieldInspector';
import AddFieldDrawer from '../components/entity-designer/AddFieldDrawer';
import SchemaDiffViewer from '../components/entity-designer/SchemaDiffViewer';
import GovernancePolicyHints from '../components/entity-designer/GovernancePolicyHints';

import type { SchemaSubTab, FieldInstance } from '../types/entityDesigner';

interface Props {
  entityType?: string;
}

// ── Build compiled JSON from entity fields ────────────────────
function buildSchemaJSON(entity: ReturnType<typeof getEntityDefinition>) {
  if (!entity) return {};
  const fields: Record<string, unknown> = {};
  entity.fields
    .filter(f => f.lifecycle !== 'disabled' && f.lifecycle !== 'draft')
    .forEach(f => {
      const entry: Record<string, unknown> = {
        type: f.fieldType,
        required: f.behaviors.presence !== 'optional',
        layer: f.sourceLayer,
      };
      if (f.fieldType === 'entity_ref')   entry.target_entity   = f.typeConfig?.targetEntity;
      if (f.fieldType === 'currency')     entry.currency_source = f.typeConfig?.currencySource;
      if (f.fieldType === 'select' || f.fieldType === 'multi_select') entry.value_source = f.typeConfig?.valueSource;
      if (f.fieldType === 'computed')     { entry.mode = f.typeConfig?.mode; entry.readonly = true; }
      fields[f.fieldId] = entry;
    });
  return {
    entity_type:   entity.entityType,
    label:         entity.label,
    category:      entity.category,
    owning_layer:  entity.owningLayer,
    behaviors:     entity.behaviors,
    fields,
  };
}

// ── Issues drawer panel ───────────────────────────────────────
function IssuesPanel({
  entity,
  onSelectField,
  onClose,
}: {
  entity: NonNullable<ReturnType<typeof getEntityDefinition>>;
  onSelectField: (id: string) => void;
  onClose: () => void;
}) {
  const { compileErrors } = detectAllConflicts(entity);
  const errors   = compileErrors.filter(c => c.severity === 'error');
  const warnings = compileErrors.filter(c => c.severity === 'warning');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>Schema Issues</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {compileErrors.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '10px', color: '#10b981' }}>
            <Check size={28} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>No issues found</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>Schema has no compile errors or warnings.</span>
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <section style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <XCircle size={12} /> {errors.length} Error{errors.length > 1 ? 's' : ''}
                </div>
                {errors.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => c.fieldId && (onSelectField(c.fieldId), onClose())}
                    style={{
                      padding: '8px 10px', borderRadius: '5px', marginBottom: '6px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: '12px', lineHeight: 1.5,
                      cursor: c.fieldId ? 'pointer' : 'default',
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                    }}
                  >
                    <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <div>{c.message}</div>
                      {c.fieldId && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Click to select field →</div>}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {warnings.length > 0 && (
              <section>
                <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={12} /> {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
                </div>
                {warnings.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => c.fieldId && (onSelectField(c.fieldId), onClose())}
                    style={{
                      padding: '8px 10px', borderRadius: '5px', marginBottom: '6px',
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                      fontSize: '12px', lineHeight: 1.5,
                      cursor: c.fieldId ? 'pointer' : 'default',
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                    }}
                  >
                    <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <div>{c.message}</div>
                      {c.fieldId && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Click to select field →</div>}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Schema JSON drawer panel ──────────────────────────────────
function SchemaPreviewPanel({
  entity,
  onClose,
}: {
  entity: NonNullable<ReturnType<typeof getEntityDefinition>>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(buildSchemaJSON(entity), null, 2), [entity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Braces size={15} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>Schema JSON</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Copy JSON to clipboard"
        >
          {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={14} /></button>
      </div>

      {/* Description */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>
        Active fields only (draft and disabled fields are excluded).
      </div>

      {/* JSON */}
      <pre style={{
        flex: 1, margin: 0, padding: '14px 16px',
        fontSize: '11.5px', fontFamily: 'monospace', lineHeight: 1.6,
        background: 'var(--bg-tertiary, #1a1a2e)',
        color: 'var(--code-text, #e2e8f0)',
        overflowY: 'auto', overflowX: 'auto',
        whiteSpace: 'pre',
      }}>
        {json}
      </pre>
    </div>
  );
}

// ── Right side drawer overlay ─────────────────────────────────
function RightDrawer({
  open, onClose, children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.25)',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '420px', zIndex: 51,
        background: 'var(--bg)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slide-in-right 0.18s ease-out',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function SchemaBuilderPage({ entityType: propEntityType }: Props) {
  const params = useParams<{ entityType: string }>();
  const entityType = propEntityType ?? params.entityType ?? '';

  const {
    savedEntities,
    selectedFieldId, setSelectedField,
    schemaSubTabByEntity, setSchemaSubTab,
    updateEntity,
    saveSchemaField, deleteSchemaField,
    setEntityStatus,
    showToast,
  } = useEntityDesignerStore();

  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingField, setEditingField] = useState<FieldInstance | null>(null);
  const [constrainField, setConstrainField] = useState<FieldInstance | null>(null); // Phase 3: constrain inherited field
  const [rightPanel, setRightPanel]   = useState<null | 'issues' | 'schema'>(null);

  const activeTab: SchemaSubTab = schemaSubTabByEntity[entityType] ?? 'fields';
  const setActiveTab = (tab: SchemaSubTab) => setSchemaSubTab(entityType, tab);

  const entity = useMemo(
    () => getEntityDefinition(entityType, savedEntities),
    [entityType, savedEntities]
  );

  // Phase 3 — Overlay composition: if entity extends a parent, surface parent fields as inherited
  const inheritedFields = useMemo<FieldInstance[]>(() => {
    if (!entity?.parentEntityType) return [];
    const parent = getEntityDefinition(entity.parentEntityType, savedEntities);
    if (!parent) return [];
    // Mark fields from parent so FieldGrid renders them as read-only inherited rows
    return parent.fields.map(f => ({ ...f, inheritedFrom: parent.entityType }));
  }, [entity, savedEntities]);

  const selectedField = useMemo(
    () => entity?.fields.find(f => f.fieldId === selectedFieldId) ?? null,
    [entity, selectedFieldId]
  );

  const compileResult = useMemo(() => {
    if (!entity) return null;
    return detectAllConflicts(entity);
  }, [entity]);

  if (!entity) {
    return (
      <div className="empty">
        <AlertTriangle size={28} style={{ color: '#f59e0b' }} />
        <p className="empty-title">Entity not found</p>
        <p className="empty-desc">No entity with type <code style={{ fontFamily: 'monospace' }}>{entityType}</code> was found.</p>
      </div>
    );
  }

  const handleSaveDraft = () => {
    updateEntity(entityType, { lastModified: new Date().toISOString() });
    showToast('Schema draft saved', 'success');
  };

  const handleDeleteField = (fieldId: string) => {
    if (!savedEntities[entityType]) {
      showToast('Open entity in edit mode to delete fields', 'error');
      return;
    }
    deleteSchemaField(entityType, fieldId);
    if (selectedFieldId === fieldId) setSelectedField(null);
  };

  const handleOpenAddDrawer = () => {
    setEditingField(null);
    setDrawerOpen(true);
  };

  const handleEditField = (field: FieldInstance) => {
    setEditingField(field);
    setDrawerOpen(true);
  };

  const handleStatusChange = (newStatus: any) => {
    if (!savedEntities[entityType]) {
      showToast('Entity must be saved to change status', 'error');
      return;
    }
    setEntityStatus(entityType, newStatus);
  };

  const handleSaveField = (field: FieldInstance) => {
    if (!savedEntities[entityType]) {
      showToast('Entity must be saved before making inline edits', 'info');
      return;
    }
    saveSchemaField(entityType, field);
  };

  const compileErrors   = compileResult?.compileErrors.filter(c => c.severity === 'error').length ?? 0;
  const compileWarnings = compileResult?.compileErrors.filter(c => c.severity === 'warning').length ?? 0;

  const TABS: { key: SchemaSubTab; label: string }[] = [
    { key: 'fields',     label: 'Fields' },
    { key: 'diff',       label: 'Schema Diff' },
    { key: 'governance', label: 'Governance' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Context Bar */}
      <EntityContextBar
        entity={entity}
        onSaveDraft={handleSaveDraft}
        onStatusChange={handleStatusChange}
        compileErrorCount={compileErrors}
        compileWarningCount={compileWarnings}
        onShowIssues={() => setRightPanel(p => p === 'issues' ? null : 'issues')}
        onShowSchemaPreview={() => setRightPanel(p => p === 'schema' ? null : 'schema')}
      />

      {/* 2-panel layout (position: relative so right drawer is anchored here) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Center: Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Sub-tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '9px 16px', fontSize: '13px', border: 'none', cursor: 'pointer', background: 'transparent',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'fields' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <FieldGrid
                  entity={entity}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedField}
                  onAddField={handleOpenAddDrawer}
                  onEditField={handleEditField}
                  onDeleteField={handleDeleteField}
                  inheritedFields={inheritedFields}
                  onConstrainField={field => setConstrainField(field)}
                />
              </div>
            )}

            {activeTab === 'diff' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <SchemaDiffViewer
                  entityType={entityType}
                  entity={entity}
                />
              </div>
            )}

            {activeTab === 'governance' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <GovernancePolicyHints entity={entity} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Field Inspector */}
        <div style={{ width: '360px', flexShrink: 0, borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
          <FieldInspector
            entity={entity}
            selectedField={selectedField}
            onEditField={handleEditField}
            onSaveField={handleSaveField}
          />
        </div>

        {/* Right slide-in drawer — Issues or Schema JSON */}
        <RightDrawer open={rightPanel !== null} onClose={() => setRightPanel(null)}>
          {rightPanel === 'issues' && (
            <IssuesPanel
              entity={entity}
              onSelectField={id => { setSelectedField(id); setActiveTab('fields'); }}
              onClose={() => setRightPanel(null)}
            />
          )}
          {rightPanel === 'schema' && (
            <SchemaPreviewPanel
              entity={entity}
              onClose={() => setRightPanel(null)}
            />
          )}
        </RightDrawer>
      </div>

      {/* Add/Edit Field Drawer */}
      {drawerOpen && (
        <AddFieldDrawer
          entityType={entityType}
          entityLabel={entity.label}
          existingFieldIds={entity.fields.map(f => f.fieldId)}
          onClose={() => { setDrawerOpen(false); setEditingField(null); }}
          editingField={editingField}
        />
      )}

      {/* Phase 3 — Constrain Inherited Field Drawer */}
      {constrainField && (
        <AddFieldDrawer
          entityType={entityType}
          entityLabel={entity.label}
          existingFieldIds={entity.fields.map(f => f.fieldId)}
          onClose={() => setConstrainField(null)}
          constrainMode={constrainField}
        />
      )}
    </div>
  );
}
