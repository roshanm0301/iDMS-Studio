// ============================================================
// iDMS Admin Studio — Overlay Studio
// Three-column overlay customization workspace.
// Layer Stack | Delta Editor | Resolved Preview + Explain Trace
// ============================================================
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Lock, ChevronDown, ChevronRight, Plus, Eye, Save,
  AlertTriangle, CheckCircle, Info, Code, Diff,
} from 'lucide-react';
import {
  getLayerStack,
  getOverlayDeltas,
  getEntitySchema,
  getExplainTrace,
  getCompiledPreview,
} from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import type { LayerCode, OverlayDelta, LayerStack, DeltaOperation } from '../../types';
import LayerBadge from '../ui/LayerBadge';

// ─── Constants ────────────────────────────────────────────────

const READONLY_LAYERS: LayerCode[] = ['platform', 'vertical'];

const PROTECTED_FIELDS = new Set([
  'customer_id', 'created_at', 'updated_at', 'deleted_at',
  'tenant_id', 'node_id', 'created_by', 'updated_by',
]);

const DELTA_OPS: DeltaOperation[] = [
  'extend', 'replace', 'disable', 'constrain',
  'decorate', 'append', 'prepend', 'remove',
];

const OP_CLASS: Record<DeltaOperation, string> = {
  extend:    'tag accent',
  constrain: 'tag amber',
  replace:   'tag violet',
  decorate:  'tag blue',
  disable:   'tag',           // muted grey via default
  remove:    'tag red',
  append:    'tag green',
  prepend:   'tag green',
};

const RISK_CLASS: Record<string, string> = {
  low:    'tag green',
  medium: 'tag amber',
  high:   'tag red',
};

const STATUS_CLASS: Record<string, string> = {
  draft:  'chip draft',
  active: 'chip active',
  compile_error: 'chip error',
};

// ─── Types ────────────────────────────────────────────────────

interface Props {
  artifactKey: string;
}

type EditorMode = 'idle' | 'new' | 'edit';
type PreviewTab = 'merged' | 'trace';

interface DraftForm {
  layer: LayerCode;
  operation: DeltaOperation;
  targetPath: string;
  valueRaw: string;
  constrainMax: string;
  disableToggle: boolean;
  decorateLabel: string;
  decorateHelp: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
}

// ─── Helpers ─────────────────────────────────────────────────

function truncateJson(val: unknown, maxLen = 60): string {
  const s = JSON.stringify(val);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

function isProtectedField(path: string): boolean {
  const parts = path.split('.');
  const leaf = parts[parts.length - 1];
  return PROTECTED_FIELDS.has(leaf) || PROTECTED_FIELDS.has(path);
}

function buildDeltaValue(form: DraftForm): unknown {
  switch (form.operation) {
    case 'constrain':
      return { max_value: Number(form.constrainMax) || 0 };
    case 'disable':
      return { disabled: form.disableToggle };
    case 'decorate':
      return { label: form.decorateLabel, help_text: form.decorateHelp };
    default: {
      try { return JSON.parse(form.valueRaw || 'null'); }
      catch { return form.valueRaw; }
    }
  }
}

function getEntityFieldPaths(artifactKey: string): string[] {
  const schema = getEntitySchema(artifactKey);
  if (!schema) return [];
  return schema.fields.map(f => `fields.${f.field_id}`);
}

// ─── Column 1: Layer Stack ────────────────────────────────────

interface LayerStackColProps {
  stack: LayerStack[];
  selectedDelta: OverlayDelta | null;
  onSelectDelta: (delta: OverlayDelta) => void;
  onAddDelta: (layer: LayerCode) => void;
  onDeleteDelta: (deltaId: string) => void;
}

function LayerStackCol({ stack, selectedDelta, onSelectDelta, onAddDelta, onDeleteDelta }: LayerStackColProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    tenant: true,
    node: true,
  });

  const toggle = (layer: string) =>
    setExpanded(prev => ({ ...prev, [layer]: !prev[layer] }));

  return (
    <div
      style={{
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-elev)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Layer Stack</span>
      </div>

      {/* Scope label */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          background: 'var(--bg-sunken)',
        }}
      >
        <span style={{ color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10, marginRight: 6 }}>
          Scope
        </span>
        Bajaj Auto / Pune Central / SALES_EXECUTIVE
      </div>

      {/* Layer cards */}
      <div className="panel-body">
        {stack.map((layerItem, priority) => {
          const isReadonly = READONLY_LAYERS.includes(layerItem.layer);
          const isOpen = !!expanded[layerItem.layer];

          return (
            <div key={layerItem.layer} className="layer-stack-item">
              {/* Layer header */}
              <div
                className="layer-stack-header"
                onClick={() => toggle(layerItem.layer)}
                style={{ userSelect: 'none' }}
              >
                {/* Priority number */}
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--bg-sunken)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-subtle)',
                    flexShrink: 0,
                  }}
                >
                  {priority + 1}
                </span>

                <LayerBadge layer={layerItem.layer} />

                {/* Scope label */}
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {layerItem.scope}
                </span>

                {/* Read-only lock */}
                {isReadonly && (
                  <Lock size={12} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                )}

                {/* Delta count chip */}
                {layerItem.delta_count > 0 && (
                  <span
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 999,
                      flexShrink: 0,
                    }}
                  >
                    {layerItem.delta_count}
                  </span>
                )}

                {/* Expand arrow */}
                {isOpen
                  ? <ChevronDown size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                }
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div className="layer-stack-body">
                  {/* Read-only notice */}
                  {isReadonly && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        color: 'var(--text-subtle)',
                        fontStyle: 'italic',
                        marginBottom: layerItem.deltas.length > 0 ? 8 : 0,
                        padding: '4px 0',
                      }}
                    >
                      <Lock size={11} />
                      Read-only
                    </div>
                  )}

                  {/* Delta rows */}
                  {layerItem.deltas.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '4px 0 8px', fontStyle: 'italic' }}>
                      No deltas at this layer.
                    </p>
                  ) : (
                    layerItem.deltas.map(delta => (
                      <div
                        key={delta.delta_id}
                        className="delta-row"
                        style={{
                          cursor: 'pointer',
                          outline: selectedDelta?.delta_id === delta.delta_id ? '2px solid var(--accent)' : 'none',
                          outlineOffset: -2,
                        }}
                        onClick={() => onSelectDelta(delta)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                          {/* Top row: op badge + path */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className={OP_CLASS[delta.operation] ?? 'tag'} style={{ fontSize: 10, padding: '1px 6px' }}>
                              {delta.operation}
                            </span>
                            <span className="delta-path" style={{ fontSize: 11.5 }}>
                              {delta.target_path}
                            </span>
                          </div>

                          {/* Value preview */}
                          <span className="delta-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)' }}>
                            {truncateJson(delta.value)}
                          </span>

                          {/* Reason */}
                          {delta.reason && (
                            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                              {delta.reason}
                            </span>
                          )}

                          {/* Bottom row: risk + status + delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span className={RISK_CLASS[delta.risk] ?? 'tag'} style={{ fontSize: 10, padding: '1px 5px' }}>
                              {delta.risk}
                            </span>
                            <span className={STATUS_CLASS[delta.status] ?? 'chip'} style={{ fontSize: 10 }}>
                              <span className="dot" style={{ width: 5, height: 5 }} />
                              {delta.status}
                            </span>
                            {delta.status === 'draft' && !isReadonly && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginLeft: 'auto', padding: '1px 4px', color: 'var(--red)' }}
                                title="Delete draft delta"
                                onClick={e => { e.stopPropagation(); onDeleteDelta(delta.delta_id); }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add delta button (only on non-readonly layers) */}
                  {!isReadonly && (
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ marginTop: 6, color: 'var(--accent)', fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDelta(layerItem.layer);
                      }}
                    >
                      <Plus size={12} />
                      Add delta
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Column 2: Delta Editor ───────────────────────────────────

interface DeltaEditorColProps {
  artifactKey: string;
  mode: EditorMode;
  editingDelta: OverlayDelta | null;
  editorLayer: LayerCode;
  form: DraftForm;
  setForm: React.Dispatch<React.SetStateAction<DraftForm>>;
  fieldPaths: string[];
  onPreview: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function DeltaEditorCol({
  artifactKey,
  mode,
  editingDelta,
  editorLayer,
  form,
  setForm,
  fieldPaths,
  onPreview,
  onSave,
  onCancel,
}: DeltaEditorColProps) {
  const [pathSearch, setPathSearch] = useState('');
  const [pathDropdownOpen, setPathDropdownOpen] = useState(false);

  const isLockedLayer = READONLY_LAYERS.includes(editorLayer);
  const isProtected = isProtectedField(form.targetPath);

  const filteredPaths = useMemo(
    () => fieldPaths.filter(p => p.toLowerCase().includes(pathSearch.toLowerCase())),
    [fieldPaths, pathSearch]
  );

  // When editing an existing delta, prefill form
  useEffect(() => {
    if (mode === 'edit' && editingDelta) {
      const val = editingDelta.value;
      setForm({
        layer: editingDelta.layer,
        operation: editingDelta.operation,
        targetPath: editingDelta.target_path,
        valueRaw: JSON.stringify(val, null, 2),
        constrainMax: (val as any)?.max_value != null ? String((val as any).max_value) : '',
        disableToggle: (val as any)?.disabled === true,
        decorateLabel: (val as any)?.label ?? '',
        decorateHelp: (val as any)?.help_text ?? '',
        reason: editingDelta.reason ?? '',
        risk: editingDelta.risk,
      });
    }
  }, [mode, editingDelta, setForm]);

  if (mode === 'idle') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div className="panel-header">
          <span className="panel-title">Delta Editor</span>
        </div>
        <div className="empty">
          <div className="empty-icon"><Code size={32} /></div>
          <div className="empty-title">No delta selected</div>
          <div className="empty-desc">
            Select a layer delta to edit, or click + to add a new delta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">
          {mode === 'new' ? 'New Delta' : 'Edit Delta'}
        </span>
        <LayerBadge layer={editorLayer} small />
      </div>

      {/* Locked layer warning */}
      {isLockedLayer && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            margin: '12px 16px 0',
            padding: '10px 12px',
            background: 'var(--amber-soft)',
            border: '1px solid var(--amber)',
            borderRadius: 'var(--radius)',
            fontSize: 12.5,
            color: 'var(--amber)',
          }}
        >
          <Lock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Read-only layer.</strong> Platform-level artifacts are governed.
            Use Tenant overlay to customize.
          </div>
        </div>
      )}

      {/* Form body */}
      <div className="panel-body" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Artifact Key */}
          <div className="form-field">
            <label className="form-label">Artifact Key</label>
            <input
              className="form-input"
              value={artifactKey}
              readOnly
              style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          {/* Layer */}
          <div className="form-field">
            <label className="form-label">Layer</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayerBadge layer={editorLayer} />
              {isLockedLayer && <Lock size={12} style={{ color: 'var(--text-subtle)' }} />}
            </div>
          </div>

          {/* Scope ID */}
          <div className="form-field">
            <label className="form-label">Scope ID</label>
            <input
              className="form-input"
              value={
                editorLayer === 'tenant' ? 'ten_bajaj_demo' :
                editorLayer === 'node'   ? 'node_pune_central' :
                editorLayer === 'role'   ? 'role_sales_executive' :
                editorLayer
              }
              readOnly
              style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          {/* Operation */}
          <div className="form-field">
            <label className="form-label">Operation</label>
            <select
              className="form-select"
              value={form.operation}
              disabled={isLockedLayer}
              onChange={e => setForm(f => ({ ...f, operation: e.target.value as DeltaOperation }))}
            >
              {DELTA_OPS.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {/* Target Path */}
          <div className="form-field" style={{ position: 'relative' }}>
            <label className="form-label">Target Path</label>
            <input
              className="form-input"
              placeholder="e.g. fields.gstin"
              value={pathDropdownOpen ? pathSearch : form.targetPath}
              readOnly={isLockedLayer}
              onFocus={() => {
                setPathSearch('');
                setPathDropdownOpen(true);
              }}
              onBlur={() => setTimeout(() => setPathDropdownOpen(false), 150)}
              onChange={e => {
                setPathSearch(e.target.value);
                setForm(f => ({ ...f, targetPath: e.target.value }));
              }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            {pathDropdownOpen && filteredPaths.length > 0 && (
              <div className="dropdown" style={{ width: '100%' }}>
                <div className="dropdown-list">
                  {filteredPaths.slice(0, 20).map(p => (
                    <div
                      key={p}
                      className="dropdown-item"
                      onMouseDown={() => {
                        setForm(f => ({ ...f, targetPath: p }));
                        setPathDropdownOpen(false);
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p}</span>
                      {isProtectedField(p) && (
                        <span style={{ marginLeft: 'auto', color: 'var(--red)', fontSize: 11 }}>protected</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Protected field error */}
          {form.targetPath && isProtected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                background: 'var(--red-soft)',
                border: '1px solid var(--red)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                color: 'var(--red)',
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Cannot override protected node.</strong> Protected fields ensure referential integrity.
              </span>
            </div>
          )}

          {/* Protected override check (when not protected) */}
          {form.targetPath && !isProtected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--green)',
              }}
            >
              <CheckCircle size={13} />
              Target is not protected
            </div>
          )}

          {/* Value editor — varies by operation */}
          {form.operation === 'constrain' && (
            <div className="form-field">
              <label className="form-label">Max Value</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 100000"
                value={form.constrainMax}
                disabled={isLockedLayer}
                onChange={e => setForm(f => ({ ...f, constrainMax: e.target.value }))}
              />
            </div>
          )}

          {form.operation === 'disable' && (
            <div className="form-field">
              <label className="form-label">Disable field</label>
              <label className="switch" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.disableToggle}
                  disabled={isLockedLayer}
                  onChange={e => setForm(f => ({ ...f, disableToggle: e.target.checked }))}
                />
                <span className="switch-track" />
                <span className="switch-thumb" />
              </label>
            </div>
          )}

          {form.operation === 'decorate' && (
            <>
              <div className="form-field">
                <label className="form-label">Label override</label>
                <input
                  className="form-input"
                  placeholder="e.g. GST Number"
                  value={form.decorateLabel}
                  disabled={isLockedLayer}
                  onChange={e => setForm(f => ({ ...f, decorateLabel: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Help text</label>
                <input
                  className="form-input"
                  placeholder="e.g. Enter 15-digit GST number"
                  value={form.decorateHelp}
                  disabled={isLockedLayer}
                  onChange={e => setForm(f => ({ ...f, decorateHelp: e.target.value }))}
                />
              </div>
            </>
          )}

          {!['constrain', 'disable', 'decorate'].includes(form.operation) && (
            <div className="form-field">
              <label className="form-label">Value (JSON)</label>
              <textarea
                className="form-textarea"
                placeholder='{"required": true, "label": "GST Number"}'
                value={form.valueRaw}
                disabled={isLockedLayer}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minHeight: 80 }}
                onChange={e => setForm(f => ({ ...f, valueRaw: e.target.value }))}
              />
            </div>
          )}

          {/* Reason */}
          <div className="form-field">
            <label className="form-label">
              Reason <span style={{ color: 'var(--red)' }}>*</span>
              <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--text-subtle)' }}>(governance note)</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Explain why this delta is needed..."
              value={form.reason}
              disabled={isLockedLayer}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>

          {/* Risk classification */}
          <div className="form-field">
            <label className="form-label">Risk Classification</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              {(['low', 'medium', 'high'] as const).map(level => (
                <label
                  key={level}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    type="radio"
                    name="risk"
                    value={level}
                    checked={form.risk === level}
                    disabled={isLockedLayer}
                    onChange={() => setForm(f => ({ ...f, risk: level }))}
                  />
                  <span className={RISK_CLASS[level]} style={{ fontSize: 11, padding: '1px 7px' }}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer actions */}
      {!isLockedLayer && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            background: 'var(--bg-elev)',
            flexShrink: 0,
          }}
        >
          <button className="btn btn-secondary btn-sm" onClick={onPreview}>
            <Eye size={13} />
            Preview merge
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSave}
            disabled={!form.reason.trim() || isProtected}
          >
            <Save size={13} />
            Save draft delta
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginLeft: 'auto' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Column 3: Resolved Preview ───────────────────────────────

interface ResolvedPreviewColProps {
  artifactKey: string;
  previewData: unknown;
  refreshKey: number;
  savedDraftPaths: Set<string>;
}

function ResolvedPreviewCol({ artifactKey, previewData, refreshKey, savedDraftPaths }: ResolvedPreviewColProps) {
  const [tab, setTab] = useState<PreviewTab>('merged');

  const traceEntries = useMemo(
    () => getExplainTrace(artifactKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artifactKey, refreshKey]
  );

  const compiledFromService = useMemo(() => getCompiledPreview(artifactKey), [artifactKey]);
  const compiled = previewData ?? compiledFromService;

  // Render a JSON string with simple syntax coloring via spans
  function renderJson(val: unknown): React.ReactNode {
    const raw = JSON.stringify(val, null, 2);
    if (!raw) return null;

    // Line-by-line coloring
    return raw.split('\n').map((line, i) => {
      // Detect key vs value
      const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:)(.*)/);
      if (keyMatch) {
        const [, indent, key, colon, rest] = keyMatch;
        const trimmed = rest.trim();
        const isString = /^".*"[,]?$/.test(trimmed);
        const isNum = /^-?\d/.test(trimmed);
        const isBool = /^(true|false)/.test(trimmed);
        const isNull = /^null/.test(trimmed);
        const dominated = savedDraftPaths.has(`fields.${key}`);
        return (
          <div key={i} style={dominated ? { background: 'var(--accent-soft)', borderRadius: 3, paddingLeft: 2, marginLeft: -2 } : undefined}>
            <span style={{ color: 'var(--text-subtle)' }}>{indent}</span>
            <span className="code-block kw">"{key}"</span>
            <span className="code-block op">{colon}</span>
            {isString  && <span className="code-block str">{rest}</span>}
            {isNum     && <span className="code-block num">{rest}</span>}
            {isBool    && <span className="code-block fn">{rest}</span>}
            {isNull    && <span className="code-block cm">{rest}</span>}
            {!isString && !isNum && !isBool && !isNull && <span>{rest}</span>}
          </div>
        );
      }
      return <div key={i}><span style={{ color: 'var(--text-subtle)' }}>{line}</span></div>;
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-elev)',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <span className="panel-title">Resolved Preview</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            className={tab === 'merged' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
            style={{ height: 26, fontSize: 12, gap: 5 }}
            onClick={() => setTab('merged')}
          >
            <Code size={12} />
            Merged JSON
          </button>
          <button
            className={tab === 'trace' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
            style={{ height: 26, fontSize: 12, gap: 5 }}
            onClick={() => setTab('trace')}
          >
            <Diff size={12} />
            Explain Trace
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="panel-body" style={{ padding: 12 }}>
        {tab === 'merged' && (
          <div>
            {savedDraftPaths.size > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  color: 'var(--accent)',
                  marginBottom: 8,
                  padding: '4px 8px',
                  background: 'var(--accent-soft)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Info size={12} />
                Highlighted fields contributed by current scope deltas
              </div>
            )}
            <pre
              className="code-block"
              style={{
                margin: 0,
                fontSize: 11.5,
                maxHeight: 'calc(100vh - 260px)',
                overflowY: 'auto',
                lineHeight: 1.75,
              }}
            >
              {compiled ? renderJson(compiled) : (
                <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                  No compiled preview available. Click "Preview merge" in the editor.
                </span>
              )}
            </pre>
          </div>
        )}

        {tab === 'trace' && (
          <div>
            {traceEntries.length === 0 ? (
              <div className="empty" style={{ paddingTop: 40 }}>
                <div className="empty-title">No trace data</div>
                <div className="empty-desc">Entity schema not found for this artifact key.</div>
              </div>
            ) : (
              traceEntries.map(entry => (
                <div key={entry.field_path} className="trace-row">
                  {/* Field path */}
                  <div className="trace-path">{entry.field_path}</div>

                  {/* Per-layer trace */}
                  <div className="trace-layers">
                    {entry.layers.map(tl => {
                      const isNoChange = tl.note === 'No change' || tl.note === 'no change';
                      return (
                        <div key={tl.layer} className="trace-layer-item">
                          <LayerBadge layer={tl.layer} small />
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: isNoChange ? 'var(--text-subtle)' : 'var(--text)',
                              fontStyle: isNoChange ? 'italic' : 'normal',
                            }}
                          >
                            {tl.operation
                              ? `${tl.operation}: ${tl.note}`
                              : tl.note}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Result */}
                  <div className="trace-layer-result">
                    <CheckCircle
                      size={13}
                      style={{
                        color: entry.result.toLowerCase().includes('hidden')
                          ? 'var(--text-subtle)'
                          : 'var(--green)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        color: entry.result.toLowerCase().includes('hidden')
                          ? 'var(--text-subtle)'
                          : 'var(--green)',
                        fontWeight: 500,
                      }}
                    >
                      {entry.result}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Draft saved notice banner ────────────────────────────────

interface DraftNoticeBannerProps {
  show: boolean;
}

function DraftNoticeBanner({ show }: DraftNoticeBannerProps) {
  if (!show) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background: 'var(--amber-soft)',
        borderBottom: '1px solid var(--border)',
        fontSize: 12.5,
        color: 'var(--amber)',
        flexShrink: 0,
      }}
    >
      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
      <span>
        <strong>Draft · Not yet active.</strong> Add to a Release Package to promote.
      </span>
    </div>
  );
}

// ─── Main: OverlayStudio ──────────────────────────────────────

export default function OverlayStudio({ artifactKey }: Props) {
  const { scope, saveDelta, deleteDelta, savedDeltas, showToast } = useStudioStore();

  // Derive layer stack — merge seed deltas with any store-saved deltas
  const stack = useMemo(() => {
    const base = getLayerStack(artifactKey);
    const extraDeltas = savedDeltas[artifactKey] ?? [];
    if (extraDeltas.length === 0) return base;
    return base.map(layerItem => {
      const extra = extraDeltas.filter((d: OverlayDelta) => d.layer === layerItem.layer);
      return extra.length === 0 ? layerItem : {
        ...layerItem,
        delta_count: layerItem.delta_count + extra.length,
        deltas: [...layerItem.deltas, ...extra],
      };
    });
  }, [artifactKey, savedDeltas]);
  const fieldPaths = useMemo(() => getEntityFieldPaths(artifactKey), [artifactKey]);

  // Editor state
  const [mode, setMode] = useState<EditorMode>('idle');
  const [selectedDelta, setSelectedDelta] = useState<OverlayDelta | null>(null);
  const [editorLayer, setEditorLayer] = useState<LayerCode>('tenant');

  // Form state
  const defaultForm: DraftForm = {
    layer: 'tenant',
    operation: 'extend',
    targetPath: '',
    valueRaw: '',
    constrainMax: '',
    disableToggle: false,
    decorateLabel: '',
    decorateHelp: '',
    reason: '',
    risk: 'low',
  };
  const [form, setForm] = useState<DraftForm>(defaultForm);

  // Preview state
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [savedDraftPaths, setSavedDraftPaths] = useState<Set<string>>(new Set());
  const [hasDraftSaved, setHasDraftSaved] = useState(false);

  // Auto-load compiled preview initially
  useEffect(() => {
    const compiled = getCompiledPreview(artifactKey);
    if (compiled) setPreviewData(compiled);
  }, [artifactKey]);

  // Refresh preview when scope changes
  useEffect(() => {
    setPreviewRefreshKey(k => k + 1);
  }, [scope]);

  // Handlers
  const handleSelectDelta = useCallback((delta: OverlayDelta) => {
    setSelectedDelta(delta);
    setEditorLayer(delta.layer);
    setMode('edit');
  }, []);

  const handleAddDelta = useCallback((layer: LayerCode) => {
    setSelectedDelta(null);
    setEditorLayer(layer);
    setMode('new');
    setForm({ ...defaultForm, layer });
  }, []);

  const handleCancel = useCallback(() => {
    setMode('idle');
    setSelectedDelta(null);
  }, []);

  const handlePreviewMerge = useCallback(() => {
    const compiled = getCompiledPreview(artifactKey);
    setPreviewData(compiled ?? { note: 'Merged preview with draft delta applied', artifactKey, layer: editorLayer, targetPath: form.targetPath, operation: form.operation, value: buildDeltaValue(form) });
    setPreviewRefreshKey(k => k + 1);
    // Highlight the targeted path
    if (form.targetPath) {
      setSavedDraftPaths(prev => new Set([...prev, form.targetPath]));
    }
  }, [artifactKey, editorLayer, form]);

  const handleSave = useCallback(() => {
    if (!form.reason.trim()) {
      showToast('Reason is required for governance.', 'error');
      return;
    }
    if (isProtectedField(form.targetPath)) {
      showToast('Cannot override a protected field.', 'error');
      return;
    }

    const newDelta: OverlayDelta = {
      delta_id: `delta_${Date.now()}`,
      artifact_key: artifactKey,
      layer: editorLayer,
      scope_label:
        editorLayer === 'tenant' ? 'Bajaj Auto Demo' :
        editorLayer === 'node'   ? 'Pune Central Branch' :
        editorLayer === 'role'   ? 'SALES_EXECUTIVE' :
        editorLayer,
      operation: form.operation,
      target_path: form.targetPath,
      value: buildDeltaValue(form),
      reason: form.reason,
      risk: form.risk,
      status: 'draft',
      author: 'studio_user',
      created_at: new Date().toISOString(),
    };

    saveDelta(artifactKey, newDelta);

    // Track saved paths for preview highlighting
    if (form.targetPath) {
      setSavedDraftPaths(prev => new Set([...prev, form.targetPath]));
    }

    setHasDraftSaved(true);
    setMode('idle');
    setSelectedDelta(null);
    setPreviewRefreshKey(k => k + 1);
  }, [artifactKey, editorLayer, form, saveDelta, showToast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div
        style={{
          padding: '14px 24px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elev)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
            Overlay Studio
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Artifact{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{artifactKey}</span>
            {' '}— 5-layer overlay delta management
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={12} />
            Platform → Vertical → Tenant → Node → Role
          </span>
        </div>
      </div>

      {/* Draft saved notice */}
      <DraftNoticeBanner show={hasDraftSaved} />

      {/* 3-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 320px',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Column 1 — Layer Stack */}
        <LayerStackCol
          stack={stack}
          selectedDelta={selectedDelta}
          onSelectDelta={handleSelectDelta}
          onAddDelta={handleAddDelta}
          onDeleteDelta={(deltaId) => deleteDelta(artifactKey, deltaId)}
        />

        {/* Column 2 — Delta Editor */}
        <DeltaEditorCol
          artifactKey={artifactKey}
          mode={mode}
          editingDelta={selectedDelta}
          editorLayer={editorLayer}
          form={form}
          setForm={setForm}
          fieldPaths={fieldPaths}
          onPreview={handlePreviewMerge}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Column 3 — Resolved Preview */}
        <ResolvedPreviewCol
          artifactKey={artifactKey}
          previewData={previewData}
          refreshKey={previewRefreshKey}
          savedDraftPaths={savedDraftPaths}
        />
      </div>
    </div>
  );
}
