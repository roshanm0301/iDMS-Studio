// ============================================================
// iDMS Admin Studio — Entity Designer
// Schema table with column picker, inline field editing,
// catalog picker, and scope-aware visibility.
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  Lock, Plus, Eye, EyeOff, BookOpen, GitBranch, Code2, List, LayoutGrid,
  SlidersHorizontal, Edit2, Trash2, X, Check, Search,
} from 'lucide-react';
import {
  getEntitySchema, getAttributeCatalog, getCompiledPreview,
} from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import LayerBadge from '../ui/LayerBadge';
import StatusTag from '../ui/StatusTag';
import type { FieldDefinition, FormSection, LayerCode } from '../../types';

// ─── Types ────────────────────────────────────────────────────
type TabId = 'schema' | 'form_layout' | 'attribute_catalog' | 'dependencies' | 'resolved_preview';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'schema',            label: 'Schema',            icon: <List size={14} /> },
  { id: 'form_layout',       label: 'Form Layout',       icon: <LayoutGrid size={14} /> },
  { id: 'attribute_catalog', label: 'Attribute Catalog', icon: <BookOpen size={14} /> },
  { id: 'dependencies',      label: 'Dependencies',      icon: <GitBranch size={14} /> },
  { id: 'resolved_preview',  label: 'Resolved Preview',  icon: <Code2 size={14} /> },
];

type ColKey = 'field_id' | 'label' | 'type' | 'required' | 'layer' | 'override' | 'protected' | 'visibility' | 'used_by';

const DEFAULT_COLS: ColKey[] = ['label', 'type', 'required', 'visibility', 'layer'];
const ADVANCED_COLS: ColKey[] = ['field_id', 'override', 'protected', 'used_by'];
const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: 'field_id',   label: 'Field ID' },
  { key: 'label',      label: 'Label' },
  { key: 'type',       label: 'Type' },
  { key: 'required',   label: 'Required' },
  { key: 'layer',      label: 'Layer' },
  { key: 'override',   label: 'Override Status' },
  { key: 'protected',  label: 'Protected' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'used_by',    label: 'Used By' },
];

// ─── Helpers ──────────────────────────────────────────────────
function overrideChipClass(status: string): string {
  switch (status) {
    case 'added':
    case 'added_by_tenant': return 'chip draft';
    case 'inherited':       return 'chip inherited';
    case 'overridden':      return 'chip overridden';
    case 'constrained':
    case 'constrained_by_node': return 'chip protected';
    case 'hidden_by_role':  return 'chip overridden';
    default:                return 'chip inherited';
  }
}

function overrideChipLabel(status: string): string {
  switch (status) {
    case 'added':               return 'Added';
    case 'added_by_tenant':     return 'Tenant Added';
    case 'inherited':           return 'Inherited';
    case 'overridden':          return 'Overridden';
    case 'constrained':         return 'Constrained';
    case 'constrained_by_node': return 'Node Constrained';
    case 'hidden_by_role':      return 'Role Hidden';
    default:                    return status;
  }
}

function visibilityTagClass(vis: string | undefined): string {
  if (vis === 'hidden')   return 'tag red';
  if (vis === 'readonly') return 'tag amber';
  return 'tag green';
}

function visibilityLabel(vis: string | undefined): string {
  if (vis === 'hidden')   return 'HIDDEN';
  if (vis === 'readonly') return 'READONLY';
  return 'VISIBLE';
}

// ─── Catalog Picker Modal ─────────────────────────────────────
interface CatalogPickerProps {
  artifactKey: string;
  existingFieldIds: Set<string>;
  onClose: () => void;
}

function CatalogPickerModal({ artifactKey, existingFieldIds, onClose }: CatalogPickerProps) {
  const catalog = useMemo(() => getAttributeCatalog(), []);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addCatalogField = useStudioStore(s => s.addCatalogField);

  const filtered = catalog.filter(a =>
    !existingFieldIds.has(a.attribute_code) &&
    (a.label.toLowerCase().includes(search.toLowerCase()) ||
     a.attribute_code.toLowerCase().includes(search.toLowerCase()) ||
     a.domain?.toLowerCase().includes(search.toLowerCase()))
  );

  function toggle(code: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  function handleAdd() {
    const toAdd = catalog.filter(a => selected.has(a.attribute_code));
    toAdd.forEach(attr => {
      addCatalogField(artifactKey, {
        field_id: attr.attribute_code,
        label: attr.label,
        field_type: attr.field_type as any,
        required: false,
        source_layer: 'tenant',
        override_status: 'added_by_tenant' as any,
        protected: false,
        visibility: 'visible',
      });
    });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        width: 640,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Add Fields from Catalog</h3>
            <p className="muted" style={{ margin: '3px 0 0', fontSize: 12 }}>
              Select attributes to add as tenant-layer fields.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 28, width: '100%', fontSize: 13 }}
              placeholder="Search catalog…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: 32 }}>
              <p className="empty-title">No matching attributes</p>
              <p className="empty-desc">All catalog fields are already in the schema, or no match.</p>
            </div>
          )}
          {filtered.map(attr => {
            const sel = selected.has(attr.attribute_code);
            return (
              <div
                key={attr.attribute_code}
                onClick={() => toggle(attr.attribute_code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: sel ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${sel ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: sel ? 'var(--accent)' : 'transparent',
                  flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                }}>
                  {sel && <Check size={11} style={{ color: '#fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{attr.label}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{attr.attribute_code}</div>
                </div>
                <span className="chip inherited" style={{ fontSize: 11 }}>{attr.field_type}</span>
                <span className="muted" style={{ fontSize: 11 }}>{attr.domain}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 12 }}>
            {selected.size > 0 ? `${selected.size} field${selected.size !== 1 ? 's' : ''} selected` : 'Select fields to add'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={selected.size === 0}>
              Add {selected.size > 0 ? `${selected.size} ` : ''}Field{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Field Edit Modal ──────────────────────────────────
interface FieldEditModalProps {
  field: any;
  onSave: (updated: any) => void;
  onClose: () => void;
}

function FieldEditModal({ field, onSave, onClose }: FieldEditModalProps) {
  const [draft, setDraft] = useState({ ...field });

  function update(key: string, val: any) {
    setDraft((prev: any) => ({ ...prev, [key]: val }));
  }

  const FIELD_TYPES = ['text', 'number', 'boolean', 'date', 'datetime', 'select', 'multiselect', 'reference', 'textarea', 'currency'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--panel)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        width: 480,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Edit Field</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Form */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>Label</label>
            <input className="input" style={{ width: '100%', fontSize: 13 }} value={draft.label} onChange={e => update('label', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>Field Type</label>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={draft.field_type ?? draft.type}
              onChange={e => update('field_type', e.target.value)}
              disabled={draft.protected}
            >
              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>Required</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    className={draft.required === v ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'}
                    onClick={() => update('required', v)}
                    disabled={draft.protected}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>Visibility</label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={draft.visibility ?? 'visible'}
                onChange={e => update('visibility', e.target.value)}
                disabled={draft.protected}
              >
                <option value="visible">Visible</option>
                <option value="readonly">Read-only</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          {draft.protected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <Lock size={13} style={{ color: 'var(--amber)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Protected field — type and required cannot be changed.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onSave(draft); onClose(); }}>
            Save Field
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Column Picker Popover ────────────────────────────────────
function ColumnPicker({
  visibleCols,
  onChange,
  onClose,
}: {
  visibleCols: Set<ColKey>;
  onChange: (cols: Set<ColKey>) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 100,
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      padding: '12px 14px',
      minWidth: 200,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Show columns</div>
      {ALL_COLS.map(col => {
        const isDefault = DEFAULT_COLS.includes(col.key);
        const checked = visibleCols.has(col.key);
        return (
          <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={isDefault}
              onChange={e => {
                const next = new Set(visibleCols);
                if (e.target.checked) next.add(col.key); else next.delete(col.key);
                onChange(next);
              }}
            />
            {col.label}
            {isDefault && <span className="muted" style={{ fontSize: 10 }}>default</span>}
          </label>
        );
      })}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%', fontSize: 12 }} onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ─── Sub-tab: Schema ──────────────────────────────────────────
interface SchemaTabProps {
  artifactKey: string;
  fields: any[];
  scopeRole: string;
}

function SchemaTab({ artifactKey, fields: seedFields, scopeRole }: SchemaTabProps) {
  const { saveField, deleteField, savedFields, showToast } = useStudioStore();
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(DEFAULT_COLS));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Merge seed fields with saved mutations
  const localFields: any[] = savedFields[artifactKey] ?? [];
  const allFields = useMemo(() => {
    const merged = [...seedFields];
    // Apply saved edits
    for (const lf of localFields) {
      const idx = merged.findIndex((f: any) => f.field_id === lf.field_id);
      if (idx >= 0) merged[idx] = lf;
      else merged.push(lf);
    }
    return merged;
  }, [seedFields, localFields]);

  const existingFieldIds = useMemo(() => new Set(allFields.map((f: any) => f.field_id)), [allFields]);

  function effectiveVisibility(field: any): string {
    if (field.visibility_by_role && field.visibility_by_role[scopeRole]) {
      return field.visibility_by_role[scopeRole];
    }
    return field.visibility ?? 'visible';
  }

  function handleSaveField(updated: any) {
    saveField(artifactKey, updated);
  }

  function handleDelete(fieldId: string) {
    deleteField(artifactKey, fieldId);
    setConfirmDelete(null);
  }

  const colDef = ALL_COLS.filter(c => visibleCols.has(c.key));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {allFields.length} field{allFields.length !== 1 ? 's' : ''} · Role preview: <strong>{scopeRole}</strong>
        </span>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button
            className="btn btn-sm btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setPickerOpen(v => !v)}
          >
            <SlidersHorizontal size={13} /> Columns
          </button>
          {pickerOpen && (
            <ColumnPicker
              visibleCols={visibleCols}
              onChange={setVisibleCols}
              onClose={() => setPickerOpen(false)}
            />
          )}
          <button
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setCatalogOpen(true)}
          >
            <Plus size={14} />
            Add from catalog
          </button>
        </div>
      </div>

      <div className="schema-table">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {colDef.map(c => <th key={c.key}>{c.label}</th>)}
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allFields.map((field: any) => {
              const vis = effectiveVisibility(field);
              const isProtected = !!field.protected;
              const isHiddenForRole = vis === 'hidden';
              const fieldId = field.field_id ?? field.name ?? '';
              const usedByRules = (field.used_by_rules ?? []).length;
              const usedByWorkflows = (field.used_by_workflows ?? []).length;
              const usedCount = usedByRules + usedByWorkflows;
              const isSaved = localFields.some((lf: any) => lf.field_id === fieldId);

              return (
                <tr
                  key={fieldId}
                  style={{ opacity: isHiddenForRole ? 0.65 : 1 }}
                >
                  {visibleCols.has('field_id') && (
                    <td>
                      <span className="mono" style={{ fontSize: 12 }}>{fieldId}</span>
                      {isSaved && <span className="chip draft" style={{ fontSize: 9, marginLeft: 5 }}>edited</span>}
                    </td>
                  )}
                  {visibleCols.has('label') && (
                    <td style={{ fontWeight: 500 }}>
                      {field.label}
                      {isSaved && !visibleCols.has('field_id') && <span className="chip draft" style={{ fontSize: 9, marginLeft: 5 }}>edited</span>}
                    </td>
                  )}
                  {visibleCols.has('type') && (
                    <td>
                      <span className="chip inherited" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {field.field_type ?? field.type}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('required') && (
                    <td style={{ textAlign: 'center' }}>
                      {field.required
                        ? <span className="tag green" style={{ fontSize: 11 }}>Yes</span>
                        : <span className="subtle" style={{ fontSize: 12 }}>—</span>}
                    </td>
                  )}
                  {visibleCols.has('layer') && (
                    <td>
                      <LayerBadge layer={(field.source_layer as LayerCode) ?? 'platform'} small />
                    </td>
                  )}
                  {visibleCols.has('override') && (
                    <td>
                      <span className={overrideChipClass(field.override_status ?? 'inherited')}>
                        {overrideChipLabel(field.override_status ?? 'inherited')}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('protected') && (
                    <td style={{ textAlign: 'center' }}>
                      {isProtected
                        ? <Lock size={13} style={{ color: 'var(--amber)' }} title="Protected" />
                        : <span className="subtle" style={{ fontSize: 12 }}>—</span>}
                    </td>
                  )}
                  {visibleCols.has('visibility') && (
                    <td>
                      <span className={visibilityTagClass(vis)} style={{ fontSize: 11 }}>
                        {vis === 'hidden'
                          ? <EyeOff size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          : <Eye size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                        {visibilityLabel(vis)}
                      </span>
                    </td>
                  )}
                  {visibleCols.has('used_by') && (
                    <td>
                      {usedCount > 0
                        ? <span className="chip inherited" style={{ fontSize: 11 }}>{usedCount}</span>
                        : <span className="subtle" style={{ fontSize: 12 }}>—</span>}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 5px' }}
                        title="Edit field"
                        onClick={() => setEditingField(field)}
                      >
                        <Edit2 size={12} />
                      </button>
                      {!isProtected && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 5px', color: 'var(--red)' }}
                          title="Remove field"
                          onClick={() => setConfirmDelete(fieldId)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', padding: 24, width: 360, boxShadow: 'var(--shadow-lg)' }}>
            <h4 style={{ margin: '0 0 8px', fontWeight: 700 }}>Remove field?</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px' }}>
              Remove <strong className="mono">{confirmDelete}</strong> from this schema? This cannot be undone in this session.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => handleDelete(confirmDelete)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {catalogOpen && (
        <CatalogPickerModal
          artifactKey={artifactKey}
          existingFieldIds={existingFieldIds}
          onClose={() => setCatalogOpen(false)}
        />
      )}

      {editingField && (
        <FieldEditModal
          field={editingField}
          onSave={handleSaveField}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-tab: Form Layout ─────────────────────────────────────
interface FormLayoutTabProps {
  sections: FormSection[];
  fields: any[];
}

function FormLayoutTab({ sections, fields }: FormLayoutTabProps) {
  const fieldMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const f of fields) {
      const id = f.field_id ?? f.name ?? '';
      m[id] = f;
    }
    return m;
  }, [fields]);

  if (!sections || sections.length === 0) {
    return <p className="muted" style={{ padding: 24 }}>No form layout defined for this entity.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map(section => {
        const sectionId = (section as any).section_id ?? section.label;
        const sectionFields = (section.fields ?? []) as string[];
        return (
          <div key={sectionId} className="card">
            <div className="card-head">
              <span className="card-title">{section.label}</span>
              <span className="muted" style={{ fontSize: 12 }}>{sectionFields.length} field{sectionFields.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="panel-body" style={{ padding: '0 0 4px 0' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>Field ID</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionFields.map((fid, idx) => {
                    const f = fieldMap[fid];
                    return (
                      <tr key={fid}>
                        <td className="muted" style={{ fontSize: 12 }}>{idx + 1}</td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{fid}</span></td>
                        <td style={{ fontWeight: 500 }}>{f?.label ?? fid}</td>
                        <td><span className="chip inherited" style={{ fontSize: 11 }}>{f?.field_type ?? '—'}</span></td>
                        <td>{f?.required ? <span className="tag green" style={{ fontSize: 11 }}>Yes</span> : <span className="subtle">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-tab: Attribute Catalog ───────────────────────────────
function AttributeCatalogTab() {
  const catalog = useMemo(() => getAttributeCatalog(), []);
  const [search, setSearch] = useState('');

  const filtered = search
    ? catalog.filter(a => a.label.toLowerCase().includes(search.toLowerCase()) || a.attribute_code.toLowerCase().includes(search.toLowerCase()))
    : catalog;

  return (
    <div>
      <div style={{ marginBottom: 12, position: 'relative', maxWidth: 320 }}>
        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input className="input" style={{ paddingLeft: 28, width: '100%', fontSize: 13 }} placeholder="Search catalog…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Attribute Code</th>
            <th>Label</th>
            <th>Field Type</th>
            <th>Domain</th>
            <th>Reusable</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(attr => (
            <tr key={attr.attribute_code}>
              <td><span className="mono" style={{ fontSize: 12 }}>{attr.attribute_code}</span></td>
              <td style={{ fontWeight: 500 }}>{attr.label}</td>
              <td><span className="chip inherited" style={{ fontSize: 11 }}>{attr.field_type}</span></td>
              <td><span className="subtle" style={{ fontSize: 12 }}>{attr.domain}</span></td>
              <td>
                {attr.reusable
                  ? <span className="tag green" style={{ fontSize: 11 }}>Reusable</span>
                  : <span className="tag red" style={{ fontSize: 11 }}>Single-use</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-tab: Dependencies ────────────────────────────────────
function DependenciesTab({ deps }: { deps: any }) {
  const rules = deps.rules ?? [];
  const workflows = deps.workflows ?? deps.workflow ?? [];
  const permissions = deps.permissions ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[
        { title: 'Rules', items: rules, tagClass: 'tag amber', tagLabel: 'Rule' },
        { title: 'Workflows', items: workflows, tagClass: 'tag green', tagLabel: 'Workflow' },
        { title: 'Permission Sets', items: permissions, tagClass: 'tag red', tagLabel: 'Permission' },
      ].map(({ title, items, tagClass, tagLabel }) => (
        <div key={title} className="card">
          <div className="card-head">
            <span className="card-title">{title}</span>
            <span className="chip draft" style={{ marginLeft: 8, fontSize: 11 }}>{items.length}</span>
          </div>
          <div className="panel-body">
            {items.length === 0
              ? <p className="muted" style={{ fontSize: 13 }}>No {title.toLowerCase()} reference this entity.</p>
              : <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((r: string) => (
                    <li key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={tagClass} style={{ fontSize: 11 }}>{tagLabel}</span>
                      <span className="mono" style={{ fontSize: 12 }}>{r}</span>
                    </li>
                  ))}
                </ul>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-tab: Resolved Preview ────────────────────────────────
function ResolvedPreviewTab({ artifactKey, schema }: { artifactKey: string; schema: any }) {
  const compiled = useMemo(() => getCompiledPreview(artifactKey), [artifactKey]);
  const json = compiled ?? schema;
  return (
    <div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Merged entity definition as resolved at the current scope context.</p>
      <pre className="code-block" style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>
        {JSON.stringify(json, null, 2)}
      </pre>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function EntityDesigner({ artifactKey }: { artifactKey: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('schema');
  const scope = useStudioStore(s => s.scope);

  const schema = useMemo(() => getEntitySchema(artifactKey), [artifactKey]);

  if (!schema) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p className="muted">Entity schema not found for <span className="mono">{artifactKey}</span>.</p>
      </div>
    );
  }

  const fields: any[] = schema.fields ?? [];
  const sections: FormSection[] = schema.form_layout?.sections ?? [];
  const deps = (schema as any).dependencies ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 0, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>{schema.label}</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{(schema as any).description}</p>
          </div>
          <StatusTag status={(schema as any).status ?? 'active'} />
        </div>

        {/* Sub-tab bar */}
        <div role="tablist" style={{ display: 'flex', gap: 2, marginTop: 16, borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 'var(--radius) var(--radius) 0 0',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {activeTab === 'schema' && (
          <SchemaTab
            artifactKey={artifactKey}
            fields={fields}
            scopeRole={scope.role_code}
          />
        )}
        {activeTab === 'form_layout' && <FormLayoutTab sections={sections} fields={fields} />}
        {activeTab === 'attribute_catalog' && <AttributeCatalogTab />}
        {activeTab === 'dependencies' && <DependenciesTab deps={deps} />}
        {activeTab === 'resolved_preview' && <ResolvedPreviewTab artifactKey={artifactKey} schema={schema} />}
      </div>
    </div>
  );
}
