// ============================================================
// FieldGrid — Flat field list for Entity Designer schema view
// ============================================================
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Lock, Edit, Trash2, SlidersHorizontal,
  Plus, Eye, EyeOff, ArrowUpDown, X, Search,
} from 'lucide-react';
import type { EntityDefinition, FieldInstance, FieldLifecycleState, FieldTypeCode } from '../../types/entityDesigner';
import type { LayerCode } from '../../types';
import { LAYER_COLORS, LAYER_COLORS_CHIP, LIFECYCLE_CONFIG } from '../../utils/entityDesignerConstants';

interface Props {
  entity: EntityDefinition;
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onAddField: () => void;
  onEditField: (field: FieldInstance) => void;
  onDeleteField: (fieldId: string) => void;
  // Phase 3 — Overlay composition
  inheritedFields?: FieldInstance[];
  onConstrainField?: (field: FieldInstance) => void;
  // P1-01 / P1-02 — layer highlight + view mode
  editingLayer?: LayerCode | null;
  viewMode?: 'delta' | 'resolved';
}

const PRESENCE_SHORT: Record<string, string> = {
  optional:       'Optional',
  on_create:      'Create',
  on_update:      'Update',
  before_submit:  'Submit',
  before_approve: 'Approve',
  conditional:    'Cond.',
};

const TYPE_LABEL: Partial<Record<FieldTypeCode, string>> = {
  text: 'Text', textarea: 'Textarea', number: 'Number', decimal: 'Decimal',
  currency: 'Currency', percentage: '%', date: 'Date', datetime: 'DateTime',
  boolean: 'Boolean', select: 'Select', multi_select: 'Multi-Select',
  entity_ref: 'Entity Ref', file: 'File', collection: 'Collection',
  email: 'Email', phone: 'Phone', url: 'URL', address: 'Address',
  auto_number: 'Auto #', computed: 'Computed', json: 'JSON',
  rich_text: 'Rich Text', geo_point: 'Geo', signature: 'Signature',
  barcode: 'Barcode', rating: 'Rating',
};

// ── Filter state ──────────────────────────────────────────────
type FilterState = {
  layers:        LayerCode[];
  lifecycle:     FieldLifecycleState[];
  protectedOnly: boolean;
};
const EMPTY_FILTER: FilterState = { layers: [], lifecycle: [], protectedOnly: false };

// ── Column picker ─────────────────────────────────────────────
type ColumnKey = 'label' | 'fieldId' | 'type' | 'layer' | 'required' | 'editable' | 'visible' | 'protected' | 'lifecycle' | 'usedBy' | 'views' | 'actions';
const DEFAULT_COLUMNS: ColumnKey[] = ['label', 'type', 'layer', 'required', 'visible', 'lifecycle', 'actions'];
const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'label',     label: 'Label'     },
  { key: 'fieldId',   label: 'Field ID'  },
  { key: 'type',      label: 'Type'      },
  { key: 'layer',     label: 'Layer'     },
  { key: 'required',  label: 'Required'  },
  { key: 'editable',  label: 'Editable'  },
  { key: 'visible',   label: 'Visible'   },
  { key: 'protected', label: 'Protected' },
  { key: 'lifecycle', label: 'Status'    },
  { key: 'usedBy',    label: 'Used By'   },
  { key: 'views',     label: 'Views'     },
  { key: 'actions',   label: 'Actions'   },
];

// ── Field row ─────────────────────────────────────────────────
function FieldRow({
  field, columns, isSelected, onSelect, onEdit, onDelete, editingLayer = null,
  displayNameFieldId, viewVisibleCount, viewTotalCount,
}: {
  field: FieldInstance;
  columns: ColumnKey[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editingLayer?: LayerCode | null;
  displayNameFieldId?: string;
  viewVisibleCount?: number;
  viewTotalCount?: number;
}) {
  const lc = LIFECYCLE_CONFIG[field.lifecycle];
  const LcIcon = lc.icon;
  const layerColor = LAYER_COLORS_CHIP[field.sourceLayer] ?? LAYER_COLORS_CHIP.platform;

  const isHighlighted = editingLayer != null && field.sourceLayer === editingLayer;
  const isDimmed      = editingLayer != null && field.sourceLayer !== editingLayer;
  const layerHex      = LAYER_COLORS[field.sourceLayer] ?? '#6b7280';

  return (
    <tr
      style={{
        background: isSelected
          ? 'hsl(22 100% 51% / 0.08)'
          : isHighlighted
            ? `${layerHex}0d`   // ~5% tint — subtle, not competing with lifecycle badges
            : field.protected ? 'rgba(124,58,237,0.02)' : 'transparent',
        boxShadow: isHighlighted ? `inset 3px 0 0 ${layerHex}` : 'none',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        // disabled lifecycle → 0.55; dimmed (other layer, but still readable) → 0.78; normal → 1
        opacity: field.lifecycle === 'disabled' ? 0.55 : isDimmed ? 0.78 : 1,
        transition: 'opacity 0.15s, background 0.15s',
      }}
      onClick={onSelect}
    >
      {columns.map(col => (
        <td key={col} style={{ padding: '8px 10px', fontSize: '13px', verticalAlign: 'middle' }}>
          {col === 'label' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {field.protected && <Lock size={11} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{field.label}</span>
                {displayNameFieldId === field.fieldId && (
                  <span
                    title="Record Display Name — used in dropdowns, search results, and notifications"
                    style={{
                      fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                      background: 'hsl(22 100% 51% / 0.12)', color: 'var(--accent)',
                      fontWeight: 600, flexShrink: 0,
                    }}
                  >
                    Display Name
                  </span>
                )}
              </div>
              {field.description && (
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {field.description}
                </div>
              )}
            </div>
          )}
          {col === 'fieldId' && (
            <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{field.fieldId}</code>
          )}
          {col === 'type' && (
            <span style={{ fontSize: '12px', padding: '2px 7px', background: 'var(--bg-secondary)', borderRadius: '4px', fontWeight: 500 }}>
              {TYPE_LABEL[field.fieldType] ?? field.fieldType}
            </span>
          )}
          {col === 'layer' && (
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
              background: layerColor.bg, color: layerColor.text,
            }}>
              {field.sourceLayer}
            </span>
          )}
          {col === 'required' && (
            <span style={{ fontSize: '12px', color: field.behaviors.presence === 'optional' ? 'var(--muted)' : 'var(--text)' }}>
              {PRESENCE_SHORT[field.behaviors.presence] ?? field.behaviors.presence}
            </span>
          )}
          {col === 'editable' && (
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {field.behaviors.editability.replace(/_/g, ' ')}
            </span>
          )}
          {col === 'visible' && (
            <span style={{ color: field.behaviors.visibility === 'hidden' ? '#f59e0b' : field.behaviors.visibility === 'masked' ? '#7c3aed' : '#10b981' }}>
              {field.behaviors.visibility === 'default' ? <Eye size={13} /> : field.behaviors.visibility === 'hidden' ? <EyeOff size={13} /> : '•••'}
            </span>
          )}
          {col === 'protected' && (
            field.protected
              ? <Lock size={13} style={{ color: '#7c3aed' }} />
              : <span style={{ color: 'var(--muted)', fontSize: '11px' }}>—</span>
          )}
          {col === 'lifecycle' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: lc.color, fontSize: '12px', fontWeight: 500 }}>
              <LcIcon size={12} /> {lc.label}
            </span>
          )}
          {col === 'usedBy' && (
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {field.dependencies?.length ?? 0} deps
            </span>
          )}
          {col === 'views' && (
            viewTotalCount !== undefined && viewTotalCount > 0 ? (
              <span style={{
                fontSize: '11px', padding: '1px 6px', borderRadius: '9px',
                background: (viewVisibleCount ?? 0) > 0 ? 'hsl(22 100% 51% / 0.08)' : 'var(--bg-secondary)',
                color: (viewVisibleCount ?? 0) > 0 ? 'var(--accent)' : 'var(--muted)',
                border: `1px solid ${(viewVisibleCount ?? 0) > 0 ? 'hsl(22 100% 51% / 0.2)' : 'var(--border)'}`,
              }}>
                {viewVisibleCount ?? 0} / {viewTotalCount}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>—</span>
            )
          )}
          {col === 'actions' && (
            <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={onEdit} title="Edit field">
                <Edit size={12} />
              </button>
              {!field.protected && (
                <button className="btn btn-ghost" style={{ padding: '5px 8px', color: '#ef4444' }} onClick={onDelete} title="Delete field">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

// ── Active filter chip ────────────────────────────────────────
function FilterChip({ label, color, onRemove }: { label: string; color: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 6px 2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500,
      background: color + '20', border: `1px solid ${color}50`, color,
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', color, display: 'flex', alignItems: 'center', lineHeight: 1 }}
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function FieldGrid({
  entity, selectedFieldId, onSelectField, onAddField, onEditField,
  onDeleteField, inheritedFields = [], onConstrainField,
  editingLayer = null, viewMode = 'delta',
}: Props) {
  const [columns, setColumns]                   = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [filters, setFilters]                   = useState<FilterState>(EMPTY_FILTER);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [search, setSearch]                     = useState('');

  const filterBtnRef   = useRef<HTMLDivElement>(null);
  const columnBtnRef   = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
      if (columnBtnRef.current && !columnBtnRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleColumn = (key: ColumnKey) =>
    setColumns(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);

  const removeLifecycle = (lc: FieldLifecycleState) =>
    setFilters(f => ({ ...f, lifecycle: f.lifecycle.filter(x => x !== lc) }));
  const removeLayer = (l: LayerCode) =>
    setFilters(f => ({ ...f, layers: f.layers.filter(x => x !== l) }));

  const activeFilterCount =
    filters.lifecycle.length + filters.layers.length + (filters.protectedOnly ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  const displayFields = useMemo(() => {
    let fields = entity.fields;
    if (search.trim()) {
      const q = search.toLowerCase();
      fields = fields.filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.fieldId.toLowerCase().includes(q) ||
        f.fieldType.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.layers.length)    fields = fields.filter(f => filters.layers.includes(f.sourceLayer));
    if (filters.lifecycle.length) fields = fields.filter(f => filters.lifecycle.includes(f.lifecycle));
    if (filters.protectedOnly)    fields = fields.filter(f => f.protected);
    return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [entity.fields, search, filters]);

  // Compute per-field view participation counts for the 'views' column
  const viewCountMap = useMemo(() => {
    const views = entity.views ?? [];
    const total = views.length;
    const counts: Record<string, number> = {};
    for (const field of entity.fields) {
      const visibleIn = views.filter(v =>
        v.fieldConfig.find(fc => fc.fieldId === field.fieldId)?.visible !== false &&
        v.fieldConfig.some(fc => fc.fieldId === field.fieldId)
      ).length;
      counts[field.fieldId] = visibleIn;
    }
    return { counts, total };
  }, [entity.fields, entity.views]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={onAddField}>
          <Plus size={13} /> Add Field
        </button>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '140px', maxWidth: '280px' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 28, paddingRight: search ? 28 : 10, width: '100%', fontSize: '12px' }}
            placeholder="Search fields…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 2 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter button + popover */}
        <div ref={filterBtnRef} style={{ position: 'relative' }}>
          <button
            className={`btn ${showFilterPopover || hasFilters ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => setShowFilterPopover(p => !p)}
          >
            <SlidersHorizontal size={13} />
            Filter
            {activeFilterCount > 0 && (
              <span style={{
                background: 'var(--accent)', color: '#fff',
                borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                padding: '1px 5px', lineHeight: 1.4,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilterPopover && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              padding: '16px', minWidth: '300px',
            }}>
              {/* Status */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                  Status
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['draft', 'active', 'disabled'] as FieldLifecycleState[]).map(lc => {
                    const cfg   = LIFECYCLE_CONFIG[lc];
                    const Icon  = cfg.icon;
                    const isOn  = filters.lifecycle.includes(lc);
                    return (
                      <button
                        key={lc}
                        onClick={() => setFilters(f => ({
                          ...f,
                          lifecycle: isOn ? f.lifecycle.filter(x => x !== lc) : [...f.lifecycle, lc],
                        }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '5px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          border: `1px solid ${isOn ? cfg.color : 'var(--border)'}`,
                          background: isOn ? cfg.color + '18' : 'transparent',
                          color: isOn ? cfg.color : 'var(--muted)',
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                      >
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layer */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                  Layer
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['platform', 'vertical', 'tenant', 'node'] as LayerCode[]).map(l => {
                    const lc   = LAYER_COLORS_CHIP[l];
                    const isOn = filters.layers.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() => setFilters(f => ({
                          ...f,
                          layers: isOn ? f.layers.filter(x => x !== l) : [...f.layers, l],
                        }))}
                        style={{
                          padding: '5px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          border: `1px solid ${isOn ? lc.text : 'var(--border)'}`,
                          background: isOn ? lc.bg : 'transparent',
                          color: isOn ? lc.text : 'var(--muted)',
                          cursor: 'pointer', transition: 'all 0.12s',
                          textTransform: 'capitalize',
                        }}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Protected only */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
                  <Lock size={12} style={{ color: '#7c3aed' }} />
                  Protected fields only
                </label>
                {/* Toggle switch */}
                <div
                  onClick={() => setFilters(f => ({ ...f, protectedOnly: !f.protectedOnly }))}
                  style={{
                    width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                    background: filters.protectedOnly ? '#7c3aed' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: filters.protectedOnly ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {/* Clear all */}
              {hasFilters && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setFilters(EMPTY_FILTER)}
                  style={{ marginTop: '12px', width: '100%', fontSize: '12px', color: 'var(--muted)' }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips shown inline */}
        {filters.lifecycle.map(lc => {
          const cfg = LIFECYCLE_CONFIG[lc];
          return <FilterChip key={lc} label={cfg.label} color={cfg.color} onRemove={() => removeLifecycle(lc)} />;
        })}
        {filters.layers.map(l => {
          const lc = LAYER_COLORS_CHIP[l];
          return <FilterChip key={l} label={l} color={lc.text} onRemove={() => removeLayer(l)} />;
        })}
        {filters.protectedOnly && (
          <FilterChip label="Protected" color="#7c3aed" onRemove={() => setFilters(f => ({ ...f, protectedOnly: false }))} />
        )}

        {/* Columns picker */}
        <div ref={columnBtnRef} style={{ position: 'relative', marginLeft: 'auto' }}>
          <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => setShowColumnPicker(p => !p)}>
            <ArrowUpDown size={12} /> Columns
          </button>
          {showColumnPicker && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '8px 4px', zIndex: 60,
              minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            }}>
              {ALL_COLUMNS.map(col => (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}>
                  <input type="checkbox" checked={columns.includes(col.key)} onChange={() => toggleColumn(col.key)} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {displayFields.length === entity.fields.length
            ? `${entity.fields.length} field${entity.fields.length !== 1 ? 's' : ''}`
            : `${displayFields.length} of ${entity.fields.length}`}
        </span>
      </div>

      {/* ── ViewMode / EditingLayer status bar ───────────────── */}
      {(viewMode === 'resolved' || editingLayer != null) && (
        <div style={{
          padding: '4px 12px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)', fontSize: '11px', color: 'var(--muted)',
          display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
        }}>
          {viewMode === 'resolved' ? (
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              ✓ Resolved view — showing all layers merged
            </span>
          ) : (
            <span>Showing current delta</span>
          )}
          {editingLayer != null && (
            <span style={{
              padding: '1px 8px', borderRadius: '10px', fontWeight: 600,
              background: `${LAYER_COLORS[editingLayer] ?? '#6b7280'}18`,
              color: LAYER_COLORS[editingLayer] ?? '#6b7280',
              border: `1px solid ${LAYER_COLORS[editingLayer] ?? '#6b7280'}40`,
            }}>
              Editing as: {editingLayer}
            </span>
          )}
        </div>
      )}

      {/* ── Field table ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>

        {/* ── Phase 3: Inherited fields section ── */}
        {inheritedFields.length > 0 && (
          <div style={{ marginBottom: '0' }}>
            <div style={{
              padding: '6px 10px', background: 'hsl(22 100% 51% / 0.06)',
              borderBottom: '1px solid hsl(22 100% 51% / 0.2)',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)',
              position: 'sticky', top: 0, zIndex: 12,
            }}>
              <Lock size={11} />
              Inherited Fields ({inheritedFields.length}) — from{' '}
              <code style={{ fontFamily: 'monospace', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                {inheritedFields[0]?.inheritedFrom}
              </code>
              <span style={{ marginLeft: 'auto', fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>
                Read-only — click to Constrain
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: '28px', zIndex: 11 }}>
                  {columns.map(col => (
                    <th key={col} style={{
                      textAlign: 'left', padding: '7px 10px', fontWeight: 600,
                      fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)',
                      whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
                    }}>
                      {ALL_COLUMNS.find(c => c.key === col)?.label ?? col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inheritedFields.map(field => {
                  const lc = LIFECYCLE_CONFIG[field.lifecycle];
                  const LcIcon = lc.icon;
                  const layerColor = LAYER_COLORS_CHIP[field.sourceLayer] ?? LAYER_COLORS_CHIP.platform;
                  return (
                    <tr
                      key={field.fieldId}
                      onClick={() => onConstrainField?.(field)}
                      title="Click to add a constraint overlay on this inherited field"
                      style={{
                        cursor: 'pointer', opacity: 0.75,
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(22 100% 51% / 0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    >
                      {columns.map(col => (
                        <td key={col} style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          {col === 'label' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {field.protected && <Lock size={11} style={{ color: 'var(--muted)' }} />}
                              <span style={{ fontWeight: 500 }}>{field.label}</span>
                              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', background: 'hsl(22 100% 51% / 0.12)', color: 'var(--accent)', fontWeight: 600 }}>inherited</span>
                            </div>
                          )}
                          {col === 'fieldId' && <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{field.fieldId}</code>}
                          {col === 'type' && <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{TYPE_LABEL[field.fieldType] ?? field.fieldType}</span>}
                          {col === 'layer' && <span style={{ fontWeight: 600, fontSize: '11px', color: layerColor.text, background: layerColor.bg, padding: '1px 7px', borderRadius: '10px', border: `1px solid ${layerColor.border}` }}>{field.sourceLayer}</span>}
                          {col === 'required' && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{PRESENCE_SHORT[field.behaviors.presence] ?? field.behaviors.presence}</span>}
                          {col === 'editable' && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{field.behaviors.editability}</span>}
                          {col === 'visible' && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{field.behaviors.visibility}</span>}
                          {col === 'protected' && field.protected && <Lock size={12} style={{ color: '#7c3aed' }} />}
                          {col === 'lifecycle' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: lc.color, background: lc.bg, padding: '1px 7px', borderRadius: '10px' }}>
                              <LcIcon size={10} />{lc.label}
                            </span>
                          )}
                          {col === 'usedBy' && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>—</span>}
                          {col === 'actions' && (
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--accent)' }}
                              onClick={e => { e.stopPropagation(); onConstrainField?.(field); }}
                              title="Add constraint overlay on this inherited field"
                            >
                              Constrain
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Owned fields ── */}
        {inheritedFields.length > 0 && (
          <div style={{
            padding: '6px 10px', borderBottom: '1px solid var(--border)',
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--muted)',
            background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10,
          }}>
            Owned Fields ({displayFields.length})
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: inheritedFields.length > 0 ? '28px' : 0, zIndex: 10 }}>
              {columns.map(col => (
                <th key={col} style={{
                  textAlign: 'left', padding: '8px 10px', fontWeight: 600,
                  fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)',
                  whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
                }}>
                  {ALL_COLUMNS.find(c => c.key === col)?.label ?? col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayFields.map(field => (
              <FieldRow
                key={field.fieldId}
                field={field}
                columns={columns}
                isSelected={selectedFieldId === field.fieldId}
                onSelect={() => onSelectField(field.fieldId === selectedFieldId ? null : field.fieldId)}
                onEdit={() => onEditField(field)}
                onDelete={() => onDeleteField(field.fieldId)}
                editingLayer={editingLayer}
                displayNameFieldId={entity.displayNameFieldId}
                viewVisibleCount={viewCountMap.counts[field.fieldId] ?? 0}
                viewTotalCount={viewCountMap.total}
              />
            ))}

            {displayFields.length === 0 && (
              <tr>
                <td colSpan={99} style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {search || hasFilters ? (
                      <>
                        <p style={{ marginBottom: '10px' }}>No fields match{search ? ` "${search}"` : ' the active filters'}.</p>
                        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { setSearch(''); setFilters(EMPTY_FILTER); }}>
                          Clear search &amp; filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ marginBottom: '12px' }}>No fields yet.</p>
                        <button className="btn btn-primary" onClick={onAddField}>
                          <Plus size={13} /> Add First Field
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
