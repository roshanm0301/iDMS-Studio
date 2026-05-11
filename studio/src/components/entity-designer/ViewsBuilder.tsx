// ============================================================
// ViewsBuilder — Phase 1 "Views" sub-tab in Schema Builder
// Lets designers define list_view, form_view, quick_view and
// print_view screens for an entity, each with its own field
// config, column behaviour, and default filter.
// ============================================================
import { useState, useMemo } from 'react';
import { Plus, Trash2, Star, Lock, ChevronDown, ChevronRight, LayoutList, FileText, Layers, Printer } from 'lucide-react';
import type {
  EntityDefinition, EntityView, ViewFieldConfig, ViewSection,
  ViewType, SummaryType, GroupInterval, FreezePosition,
} from '../../types/entityDesigner';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { effectiveViewParticipation, defaultSummaryType } from '../../utils/entityDesignerUtils';
import { ConditionBuilder } from './ConditionBuilder';
import type { LayerCode } from '../../types';

interface Props {
  entity: EntityDefinition;
  editingLayer: LayerCode;
}

// ── Constants ─────────────────────────────────────────────────

const VIEW_TYPES: { type: ViewType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'list_view',  label: 'List View',   icon: LayoutList, desc: 'Browse / search grid' },
  { type: 'form_view',  label: 'Form View',   icon: FileText,   desc: 'Create / edit / detail form' },
  { type: 'quick_view', label: 'Quick View',  icon: Layers,     desc: 'Compact inline card' },
  { type: 'print_view', label: 'Print View',  icon: Printer,    desc: 'Print / PDF layout' },
];

const SUMMARY_OPTS: { value: SummaryType; label: string }[] = [
  { value: 'none',  label: 'None'    },
  { value: 'sum',   label: 'Sum'     },
  { value: 'count', label: 'Count'   },
  { value: 'avg',   label: 'Avg'     },
  { value: 'min',   label: 'Min'     },
  { value: 'max',   label: 'Max'     },
];

const GROUP_INTERVAL_OPTS: { value: GroupInterval; label: string }[] = [
  { value: 'none',    label: 'None'    },
  { value: 'day',     label: 'Day'     },
  { value: 'week',    label: 'Week'    },
  { value: 'month',   label: 'Month'   },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year',    label: 'Year'    },
];

const DATE_TYPES = new Set(['date', 'datetime', 'time']);
const NUMERIC_TYPES = new Set(['number', 'decimal', 'currency', 'percentage', 'integer']);

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── ViewsBuilder component ────────────────────────────────────

export function ViewsBuilder({ entity, editingLayer }: Props) {
  const { createView, updateView, deleteView, updateViewFieldConfig } = useEntityDesignerStore();

  // Merge stored views with entity's own views
  const views: EntityView[] = entity.views ?? [];
  const [activeViewType, setActiveViewType] = useState<ViewType>('list_view');
  const [selectedViewId, setSelectedViewId] = useState<string | null>(views[0]?.viewId ?? null);
  const [addViewOpen, setAddViewOpen] = useState(false);
  const [newViewLabel, setNewViewLabel] = useState('');
  const [showSections, setShowSections] = useState(true);

  const viewsOfType = views.filter(v => v.viewType === activeViewType);
  const selectedView = views.find(v => v.viewId === selectedViewId) ?? null;

  // Switch type tab — auto-select first view of that type
  const handleTypeTab = (t: ViewType) => {
    setActiveViewType(t);
    const first = views.find(v => v.viewType === t);
    setSelectedViewId(first?.viewId ?? null);
  };

  // Create a new view
  const handleAddView = () => {
    if (!newViewLabel.trim()) return;
    const view: EntityView = {
      viewId: makeId(),
      label: newViewLabel.trim(),
      viewType: activeViewType,
      isDefault: viewsOfType.length === 0, // first view of this type is default
      owningLayer: editingLayer,
      filterConditions: { logic: 'AND', conditions: [] },
      fieldConfig: autoPopulateFieldConfig(),
      sections: activeViewType === 'form_view' ? [
        { sectionId: 'general', label: 'General', columns: 2, collapsible: false, defaultCollapsed: false },
      ] : undefined,
    };
    createView(entity.entityType, view);
    setSelectedViewId(view.viewId);
    setNewViewLabel('');
    setAddViewOpen(false);
  };

  // Auto-populate field config from entity fields using viewParticipation
  const autoPopulateFieldConfig = (): ViewFieldConfig[] => {
    return entity.fields
      .filter(f => {
        const vp = effectiveViewParticipation(f);
        if (vp === 'explicit') return false;
        if (vp === 'form_only' && activeViewType === 'list_view') return false;
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(f => ({
        fieldId: f.fieldId,
        visible: true,
        summaryType: defaultSummaryType(f.fieldType),
        textAlign: NUMERIC_TYPES.has(f.fieldType) ? 'right' : 'left',
        showInColumnChooser: true,
      }));
  };

  const isOwned = (view: EntityView) =>
    view.owningLayer === editingLayer;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* LEFT RAIL — view type tabs + view list */}
      <div style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* View type tabs */}
        <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--border)' }}>
          {VIEW_TYPES.map(({ type, label, icon: Icon }) => {
            const count = views.filter(v => v.viewType === type).length;
            return (
              <button key={type}
                onClick={() => handleTypeTab(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  width: '100%', padding: '7px 10px', borderRadius: '6px',
                  background: activeViewType === type ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
                  border: `1px solid ${activeViewType === type ? 'var(--accent)' : 'transparent'}`,
                  color: activeViewType === type ? 'var(--accent)' : 'var(--text)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: activeViewType === type ? 600 : 400,
                  marginBottom: '2px',
                }}>
                <Icon size={13} />
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
                    background: activeViewType === type ? 'hsl(22 100% 51% / 0.15)' : 'var(--bg-secondary)',
                    color: activeViewType === type ? 'var(--accent)' : 'var(--muted)',
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* View list for selected type */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {viewsOfType.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', padding: '12px 4px' }}>
              No {activeViewType.replace('_', ' ')}s defined
            </p>
          )}
          {viewsOfType.map(v => (
            <button key={v.viewId}
              onClick={() => setSelectedViewId(v.viewId)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                width: '100%', padding: '7px 8px', borderRadius: '6px', marginBottom: '2px',
                background: selectedViewId === v.viewId ? 'var(--bg-secondary)' : 'transparent',
                border: `1px solid ${selectedViewId === v.viewId ? 'var(--border)' : 'transparent'}`,
                color: 'var(--text)', cursor: 'pointer', fontSize: '12px', textAlign: 'left',
              }}>
              {v.isDefault && <Star size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              {!isOwned(v) && <Lock size={10} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</span>
            </button>
          ))}
        </div>

        {/* Add view button */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {addViewOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                className="search-input"
                style={{ fontSize: '12px' }}
                placeholder={`${VIEW_TYPES.find(t => t.type === activeViewType)?.label} name…`}
                value={newViewLabel}
                onChange={e => setNewViewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddView(); if (e.key === 'Escape') setAddViewOpen(false); }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: '11px' }} onClick={handleAddView}>Add</button>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: '11px' }} onClick={() => setAddViewOpen(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm"
              style={{ width: '100%', fontSize: '11px', justifyContent: 'center' }}
              onClick={() => setAddViewOpen(true)}>
              <Plus size={11} style={{ marginRight: 4 }} />
              Add {VIEW_TYPES.find(t => t.type === activeViewType)?.label}
            </button>
          )}
        </div>
      </div>

      {/* EDITOR PANEL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!selectedView ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--muted)', gap: '8px' }}>
            <LayoutList size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '13px', margin: 0 }}>Select a view to configure, or create a new one</p>
          </div>
        ) : (
          <ViewEditor
            view={selectedView}
            entity={entity}
            canEdit={isOwned(selectedView)}
            onUpdate={(patch) => updateView(entity.entityType, selectedView.viewId, patch)}
            onUpdateFieldConfig={(fieldId, patch) =>
              updateViewFieldConfig(entity.entityType, selectedView.viewId, fieldId, patch)
            }
            onDelete={() => {
              deleteView(entity.entityType, selectedView.viewId);
              setSelectedViewId(viewsOfType.find(v => v.viewId !== selectedView.viewId)?.viewId ?? null);
            }}
            showSections={showSections}
            onToggleSections={() => setShowSections(v => !v)}
            viewsOfType={viewsOfType}
            onSetDefault={() => {
              // Clear old default, set new one
              viewsOfType.forEach(v => {
                if (v.isDefault && v.viewId !== selectedView.viewId) {
                  updateView(entity.entityType, v.viewId, { isDefault: false });
                }
              });
              updateView(entity.entityType, selectedView.viewId, { isDefault: true });
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── ViewEditor ────────────────────────────────────────────────

interface ViewEditorProps {
  view: EntityView;
  entity: EntityDefinition;
  canEdit: boolean;
  onUpdate: (patch: Partial<EntityView>) => void;
  onUpdateFieldConfig: (fieldId: string, patch: Partial<ViewFieldConfig>) => void;
  onDelete: () => void;
  showSections: boolean;
  onToggleSections: () => void;
  viewsOfType: EntityView[];
  onSetDefault: () => void;
}

function ViewEditor({ view, entity, canEdit, onUpdate, onUpdateFieldConfig, onDelete, showSections, onToggleSections, viewsOfType, onSetDefault }: ViewEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fieldConfigMap = useMemo(
    () => Object.fromEntries(view.fieldConfig.map(fc => [fc.fieldId, fc])),
    [view.fieldConfig],
  );

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          {canEdit ? (
            <input
              className="search-input"
              style={{ fontSize: '16px', fontWeight: 600, border: 'none', padding: '4px 0', background: 'transparent', borderBottom: '1px solid var(--border)' }}
              value={view.label}
              onChange={e => onUpdate({ label: e.target.value })}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{view.label}</h3>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--muted)' }}>
              {view.viewType.replace('_', ' ')}
            </span>
            {view.isDefault && (
              <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: 'hsl(22 100% 51% / 0.1)', color: 'var(--accent)' }}>
                <Star size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />default
              </span>
            )}
            {!canEdit && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Lock size={10} />Platform-owned — read-only at this layer
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {!view.isDefault && viewsOfType.length > 1 && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={onSetDefault}>
                <Star size={12} style={{ marginRight: 3 }} />Set as Default
              </button>
            )}
            {!view.isDefault && (
              confirmDelete ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Delete?</span>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444', fontSize: '11px' }} onClick={onDelete}>Yes</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setConfirmDelete(false)}>No</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)', fontSize: '11px' }} onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={12} />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Default Filter */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Default Filter</h4>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
          Records are pre-filtered when this view opens. Leave empty to show all records.
        </p>
        <ConditionBuilder
          conditions={view.filterConditions ?? { logic: 'AND', conditions: [] }}
          currentEntityType={entity.entityType}
          targetEntityType={entity.entityType}
          onChange={group => onUpdate({ filterConditions: group })}
          disabled={!canEdit}
        />
      </div>

      {/* Sections (form_view only) */}
      {view.viewType === 'form_view' && (
        <SectionManager
          sections={view.sections ?? []}
          canEdit={canEdit}
          onUpdate={sections => onUpdate({ sections })}
          showSections={showSections}
          onToggle={onToggleSections}
        />
      )}

      {/* Field Configuration */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
          {view.viewType === 'list_view' ? 'Column Configuration' : 'Field Configuration'}
        </h4>
        <FieldConfigTable
          view={view}
          entity={entity}
          fieldConfigMap={fieldConfigMap}
          canEdit={canEdit}
          onUpdateField={onUpdateFieldConfig}
        />
      </div>
    </div>
  );
}

// ── SectionManager ────────────────────────────────────────────

function SectionManager({ sections, canEdit, onUpdate, showSections, onToggle }: {
  sections: ViewSection[];
  canEdit: boolean;
  onUpdate: (s: ViewSection[]) => void;
  showSections: boolean;
  onToggle: () => void;
}) {
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const makeSection = (): ViewSection => ({
    sectionId: makeId(),
    label: newLabel.trim(),
    columns: 2,
    collapsible: true,
    defaultCollapsed: false,
  });

  return (
    <div style={{ marginBottom: '16px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)',
          border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text)',
        }}>
        <span>Form Sections ({sections.length})</span>
        {showSections ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {showSections && (
        <div style={{ padding: '10px 12px' }}>
          {sections.map((s, i) => (
            <div key={s.sectionId}
              style={{
                display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 8px',
                borderRadius: '6px', marginBottom: '4px', background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}>
              {canEdit ? (
                <input className="search-input" style={{ flex: 1, fontSize: '12px' }}
                  value={s.label}
                  onChange={e => onUpdate(sections.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              ) : (
                <span style={{ flex: 1, fontSize: '12px' }}>{s.label}</span>
              )}
              {canEdit && (
                <select className="search-input" style={{ width: '80px', fontSize: '11px' }}
                  value={s.columns}
                  onChange={e => onUpdate(sections.map((x, j) => j === i ? { ...x, columns: Number(e.target.value) as 1 | 2 | 3 } : x))}>
                  <option value={1}>1 col</option>
                  <option value={2}>2 cols</option>
                  <option value={3}>3 cols</option>
                </select>
              )}
              {canEdit && sections.length > 1 && (
                <button className="btn btn-ghost" style={{ padding: '3px 5px', color: 'var(--muted)' }}
                  onClick={() => onUpdate(sections.filter((_, j) => j !== i))}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            adding ? (
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <input className="search-input" style={{ flex: 1, fontSize: '12px' }}
                  placeholder="Section label…" value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) { onUpdate([...sections, makeSection()]); setNewLabel(''); setAdding(false); } if (e.key === 'Escape') setAdding(false); }}
                  autoFocus />
                <button className="btn btn-primary" style={{ fontSize: '11px' }}
                  onClick={() => { if (newLabel.trim()) { onUpdate([...sections, makeSection()]); setNewLabel(''); setAdding(false); } }}>
                  Add
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '11px' }} onClick={() => setAdding(false)}>✕</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '6px', fontSize: '11px' }} onClick={() => setAdding(true)}>
                <Plus size={11} style={{ marginRight: 3 }} />Add Section
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── FieldConfigTable ──────────────────────────────────────────

function FieldConfigTable({ view, entity, fieldConfigMap, canEdit, onUpdateField }: {
  view: EntityView;
  entity: EntityDefinition;
  fieldConfigMap: Record<string, ViewFieldConfig>;
  canEdit: boolean;
  onUpdateField: (fieldId: string, patch: Partial<ViewFieldConfig>) => void;
}) {
  const isListView = view.viewType === 'list_view';

  // Fields that have an entry in fieldConfig, plus any entity fields not yet in config
  const allFields = useMemo(() => {
    const configured = view.fieldConfig.map(fc => {
      const field = entity.fields.find(f => f.fieldId === fc.fieldId);
      return { fc, field };
    });
    // Also include entity fields not yet in the config (visible = false by default)
    const configuredIds = new Set(view.fieldConfig.map(fc => fc.fieldId));
    const unconfigureds = entity.fields
      .filter(f => !configuredIds.has(f.fieldId))
      .map(f => ({ fc: { fieldId: f.fieldId, visible: false } as ViewFieldConfig, field: f }));
    return [...configured, ...unconfigureds];
  }, [view.fieldConfig, entity.fields]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isListView ? '1fr 60px 80px 90px 100px 85px' : '1fr 60px 120px',
        gap: '8px', padding: '8px 12px',
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        fontSize: '11px', fontWeight: 600, color: 'var(--muted)',
      }}>
        <span>Field</span>
        <span>Visible</span>
        {isListView && <>
          <span>Width (px)</span>
          <span>Summary</span>
          <span>Group By</span>
          <span>Freeze</span>
        </>}
        {!isListView && <span>Section</span>}
      </div>

      {/* Field rows */}
      {allFields.map(({ fc, field }) => {
        if (!field) return null;
        const isDateType = DATE_TYPES.has(field.fieldType);
        return (
          <div key={fc.fieldId}
            style={{
              display: 'grid',
              gridTemplateColumns: isListView ? '1fr 60px 80px 90px 100px 85px' : '1fr 60px 120px',
              gap: '8px', padding: '7px 12px', alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              background: fc.visible ? 'transparent' : 'rgba(0,0,0,0.02)',
              fontSize: '12px',
              opacity: fc.visible ? 1 : 0.6,
            }}>
            {/* Field name */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {field.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)', flexShrink: 0 }}>
                {field.fieldType}
              </span>
            </div>

            {/* Visible toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input type="checkbox" checked={fc.visible ?? false} disabled={!canEdit}
                onChange={e => onUpdateField(fc.fieldId, { visible: e.target.checked })}
                style={{ width: '14px', height: '14px', cursor: canEdit ? 'pointer' : 'default', accentColor: 'var(--accent)' }} />
            </div>

            {isListView && <>
              {/* Column width */}
              <input type="number" className="search-input" disabled={!canEdit || !fc.visible}
                style={{ fontSize: '11px', textAlign: 'right' }}
                value={fc.columnWidth ?? ''}
                placeholder="auto"
                min={40} max={400}
                onChange={e => onUpdateField(fc.fieldId, { columnWidth: e.target.value ? Number(e.target.value) : undefined })} />

              {/* Summary type — only meaningful for numeric/currency/percentage fields */}
              <select className="search-input"
                disabled={!canEdit || !fc.visible || !NUMERIC_TYPES.has(field.fieldType)}
                style={{ fontSize: '11px', opacity: NUMERIC_TYPES.has(field.fieldType) ? 1 : 0.4 }}
                value={fc.summaryType ?? 'none'}
                onChange={e => onUpdateField(fc.fieldId, { summaryType: e.target.value as SummaryType })}>
                {SUMMARY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Group interval — only for date/time fields */}
              <select className="search-input" disabled={!canEdit || !fc.visible || !isDateType}
                style={{ fontSize: '11px', opacity: isDateType ? 1 : 0.4 }}
                value={fc.groupInterval ?? 'none'}
                onChange={e => onUpdateField(fc.fieldId, { groupInterval: e.target.value as GroupInterval })}>
                {GROUP_INTERVAL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Freeze position */}
              <select className="search-input" disabled={!canEdit || !fc.visible}
                style={{ fontSize: '11px' }}
                value={fc.freezePosition ?? 'none'}
                onChange={e => onUpdateField(fc.fieldId, { freezePosition: e.target.value as FreezePosition })}>
                <option value="none">None</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </>}

            {/* Form view: section assignment */}
            {!isListView && (
              <select className="search-input" disabled={!canEdit || !fc.visible}
                style={{ fontSize: '11px' }}
                value={fc.sectionId ?? ''}
                onChange={e => onUpdateField(fc.fieldId, { sectionId: e.target.value || undefined })}>
                <option value="">— No section —</option>
                {(view.sections ?? []).map(s => (
                  <option key={s.sectionId} value={s.sectionId}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
