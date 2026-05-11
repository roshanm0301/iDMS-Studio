// ============================================================
// ActionsPanel — Entity Actions Registry
// Two sections:
//   1. Standard Actions (auto-provisioned, read-only display)
//   2. Custom Actions  (user-defined, full builder)
// ============================================================
import { useState, useMemo } from 'react';
import {
  Plus, Edit, RefreshCw, Trash2, Send, CheckCircle, XCircle,
  ArrowLeftRight, Zap, Navigation, Globe, Printer, Download,
  Eye, EyeOff, Pencil, ChevronDown, ChevronUp, X, Info,
  Lock, Settings,
} from 'lucide-react';

import type { EntityDefinition, EntityAction, ActionPlacement, ActionHandlerType, ActionHandlerConfig,
  WorkflowTriggerConfig, NavigationConfig, ApiCallConfig, PrintConfig, ExportConfig,
  FilterConditionGroup,
} from '../../types/entityDesigner';
import type { LayerCode } from '../../types';

import { computeStandardActions, toSlug } from '../../utils/entityDesignerUtils';
import type { StandardAction } from '../../utils/entityDesignerUtils';
import { MOCK_WORKFLOW_CODES, MOCK_ENDPOINT_CODES } from '../../data/entityDesignerData';
import { getEntityDefinitions } from '../../data/mockService';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { LAYER_COLORS, LAYER_LABELS } from '../../utils/entityDesignerConstants';
import { ConditionBuilder } from './ConditionBuilder';

// ── Lucide icon map for dynamic rendering ─────────────────────
const ICON_MAP: Record<string, React.ReactElement> = {
  Plus:           <Plus size={14} />,
  Edit:           <Edit size={14} />,
  RefreshCw:      <RefreshCw size={14} />,
  Trash2:         <Trash2 size={14} />,
  Send:           <Send size={14} />,
  CheckCircle:    <CheckCircle size={14} />,
  XCircle:        <XCircle size={14} />,
  ArrowLeftRight: <ArrowLeftRight size={14} />,
  Zap:            <Zap size={14} />,
  Navigation:     <Navigation size={14} />,
  Globe:          <Globe size={14} />,
  Printer:        <Printer size={14} />,
  Download:       <Download size={14} />,
  Eye:            <Eye size={14} />,
  Settings:       <Settings size={14} />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

// ── Placement labels ──────────────────────────────────────────
const PLACEMENT_LABELS: Record<ActionPlacement, string> = {
  toolbar:      'Toolbar',
  context_menu: 'Context Menu',
  action_panel: 'Action Panel',
  form_footer:  'Form Footer',
};

// ── Handler type labels ───────────────────────────────────────
const HANDLER_LABELS: Record<ActionHandlerType, string> = {
  workflow_trigger: 'Workflow Trigger',
  navigation:       'Navigation',
  api_call:         'API Call',
  print:            'Print',
  export:           'Export',
};

// ── Default handler config per type ──────────────────────────
function defaultHandlerConfig(type: ActionHandlerType): ActionHandlerConfig {
  switch (type) {
    case 'workflow_trigger': return { type: 'workflow_trigger', workflowCode: '' };
    case 'navigation':       return { type: 'navigation', targetEntity: '', targetViewId: '', openMode: 'same_page' };
    case 'api_call':         return { type: 'api_call', endpointCode: '' };
    case 'print':            return { type: 'print', templateCode: '' };
    case 'export':           return { type: 'export', format: 'csv' };
  }
}

// ── Empty custom action ───────────────────────────────────────
function emptyAction(owningLayer: LayerCode): EntityAction {
  return {
    actionId: `action_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0,8) : Date.now().toString(36)}`,
    label: '',
    icon: 'Zap',
    placement: 'toolbar',
    owningLayer,
    handlerType: 'workflow_trigger',
    handlerConfig: { type: 'workflow_trigger', workflowCode: '' },
    confirmationRequired: false,
  };
}

// ── Handler config form ───────────────────────────────────────
function HandlerConfigForm({
  config,
  entity,
  onChange,
}: {
  config: ActionHandlerConfig;
  entity: EntityDefinition;
  onChange: (c: ActionHandlerConfig) => void;
}) {
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '5px',
    background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '12px',
  };

  switch (config.type) {
    case 'workflow_trigger': {
      const cfg = config as WorkflowTriggerConfig;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Workflow *
            </label>
            <select style={inputStyle}
              value={cfg.workflowCode}
              onChange={e => onChange({ ...cfg, workflowCode: e.target.value })}>
              <option value="">— Select workflow —</option>
              {MOCK_WORKFLOW_CODES.map(w => (
                <option key={w.code} value={w.code}>{w.label}</option>
              ))}
              <option value="__custom">Other (specify below)</option>
            </select>
            {/* Show free-text input when workflowCode is set to something not in the known list */}
            {cfg.workflowCode !== '' && !MOCK_WORKFLOW_CODES.find(w => w.code === cfg.workflowCode) && (
              <input style={{ ...inputStyle, marginTop: 4 }} placeholder="Enter workflow code"
                value={cfg.workflowCode === '__custom' ? '' : cfg.workflowCode}
                onChange={e => onChange({ ...cfg, workflowCode: e.target.value })} />
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Transition Code (optional)
            </label>
            <input style={inputStyle} placeholder="e.g. approve, reject, submit"
              value={cfg.transitionCode ?? ''}
              onChange={e => onChange({ ...cfg, transitionCode: e.target.value || undefined })} />
          </div>
        </div>
      );
    }

    case 'navigation': {
      const cfg = config as NavigationConfig;
      const targetEnt = allEntities.find(e => e.entityType === cfg.targetEntity);
      const viewOpts = targetEnt?.views ?? [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Target Entity
            </label>
            <select style={inputStyle}
              value={cfg.targetEntity ?? ''}
              onChange={e => onChange({ ...cfg, targetEntity: e.target.value, targetViewId: '' })}>
              <option value="">— Same entity (browse/detail) —</option>
              {allEntities.map(e => (
                <option key={e.entityType} value={e.entityType}>{e.label}</option>
              ))}
            </select>
          </div>
          {viewOpts.length > 0 && (
            <div>
              <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
                Target View
              </label>
              <select style={inputStyle}
                value={cfg.targetViewId ?? ''}
                onChange={e => onChange({ ...cfg, targetViewId: e.target.value })}>
                <option value="">— Default view —</option>
                {viewOpts.map(v => (
                  <option key={v.viewId} value={v.viewId}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Open Mode
            </label>
            <select style={inputStyle}
              value={cfg.openMode}
              onChange={e => onChange({ ...cfg, openMode: e.target.value as NavigationConfig['openMode'] })}>
              <option value="same_page">Same page</option>
              <option value="new_tab">New tab</option>
              <option value="modal">Modal popup</option>
            </select>
          </div>
        </div>
      );
    }

    case 'api_call': {
      const cfg = config as ApiCallConfig;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Endpoint *
            </label>
            <select style={inputStyle}
              value={cfg.endpointCode}
              onChange={e => onChange({ ...cfg, endpointCode: e.target.value })}>
              <option value="">— Select endpoint —</option>
              {MOCK_ENDPOINT_CODES.map(ep => (
                <option key={ep.code} value={ep.code}>{ep.label}</option>
              ))}
              <option value="__custom">Other (specify below)</option>
            </select>
            {/* Show free-text input when endpointCode is set to something not in the known list */}
            {cfg.endpointCode !== '' && !MOCK_ENDPOINT_CODES.find(ep => ep.code === cfg.endpointCode) && (
              <input style={{ ...inputStyle, marginTop: 4 }} placeholder="Enter endpoint code"
                value={cfg.endpointCode === '__custom' ? '' : cfg.endpointCode}
                onChange={e => onChange({ ...cfg, endpointCode: e.target.value })} />
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Success Message (optional)
            </label>
            <input style={inputStyle} placeholder="e.g. Data synced successfully"
              value={cfg.successMessage ?? ''}
              onChange={e => onChange({ ...cfg, successMessage: e.target.value || undefined })} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Failure Message (optional)
            </label>
            <input style={inputStyle} placeholder="e.g. Sync failed — try again"
              value={cfg.failureMessage ?? ''}
              onChange={e => onChange({ ...cfg, failureMessage: e.target.value || undefined })} />
          </div>
        </div>
      );
    }

    case 'print': {
      const cfg = config as PrintConfig;
      return (
        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
            Print Template Code *
          </label>
          <input style={inputStyle} placeholder="e.g. proforma_invoice, delivery_note"
            value={cfg.templateCode}
            onChange={e => onChange({ ...cfg, templateCode: e.target.value })} />
        </div>
      );
    }

    case 'export': {
      const cfg = config as ExportConfig;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Export Format
            </label>
            <select style={inputStyle}
              value={cfg.format}
              onChange={e => onChange({ ...cfg, format: e.target.value as ExportConfig['format'] })}>
              <option value="csv">CSV</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
              Source View (optional)
            </label>
            <select style={inputStyle}
              value={cfg.viewId ?? ''}
              onChange={e => onChange({ ...cfg, viewId: e.target.value || undefined })}>
              <option value="">— All records (default list view) —</option>
              {(entity.views ?? []).filter(v => v.viewType === 'list_view').map(v => (
                <option key={v.viewId} value={v.viewId}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }
  }
}

// ── Custom action editor (inline expand) ─────────────────────
function ActionEditor({
  action,
  entityType,
  entity,
  editingLayer,
  onSave,
  onCancel,
}: {
  action: EntityAction;
  entityType: string;
  entity: EntityDefinition;
  editingLayer: LayerCode;
  onSave: (a: EntityAction) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EntityAction>({ ...action });
  const [showCondBuilder, setShowCondBuilder] = useState(!!action.visibilityCondition?.conditions.length);

  const update = <K extends keyof EntityAction>(key: K, value: EntityAction[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const handleHandlerTypeChange = (t: ActionHandlerType) => {
    setDraft(d => ({
      ...d,
      handlerType: t,
      handlerConfig: defaultHandlerConfig(t),
    }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '5px',
    background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', display: 'block',
  };

  const isValid = draft.label.trim() && draft.handlerConfig &&
    (draft.handlerConfig.type !== 'workflow_trigger' || !!(draft.handlerConfig as WorkflowTriggerConfig).workflowCode) &&
    (draft.handlerConfig.type !== 'api_call'          || !!(draft.handlerConfig as ApiCallConfig).endpointCode) &&
    (draft.handlerConfig.type !== 'print'             || !!(draft.handlerConfig as PrintConfig).templateCode);

  return (
    <div style={{
      border: '1px solid var(--accent)', borderRadius: '8px',
      background: 'hsl(22 100% 51% / 0.04)',
      padding: '16px', marginBottom: '12px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* Label */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Action Label *</label>
          <input style={inputStyle} placeholder="e.g. Print Proforma Invoice"
            value={draft.label}
            onChange={e => update('label', e.target.value)} />
        </div>

        {/* Placement */}
        <div>
          <label style={labelStyle}>Placement</label>
          <select style={inputStyle}
            value={draft.placement}
            onChange={e => update('placement', e.target.value as ActionPlacement)}>
            {(Object.entries(PLACEMENT_LABELS) as [ActionPlacement, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Icon */}
        <div>
          <label style={labelStyle}>Icon</label>
          <select style={inputStyle}
            value={draft.icon ?? 'Zap'}
            onChange={e => update('icon', e.target.value)}>
            {ICON_OPTIONS.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>

        {/* Handler type */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Action Type *</label>
          <select style={inputStyle}
            value={draft.handlerType}
            onChange={e => handleHandlerTypeChange(e.target.value as ActionHandlerType)}>
            {(Object.entries(HANDLER_LABELS) as [ActionHandlerType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Handler config */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          {HANDLER_LABELS[draft.handlerType]} Configuration
        </div>
        <HandlerConfigForm
          config={draft.handlerConfig}
          entity={entity}
          onChange={cfg => setDraft(d => ({ ...d, handlerConfig: cfg }))}
        />
      </div>

      {/* Confirmation */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '12px' }}>
          <input type="checkbox" checked={draft.confirmationRequired}
            onChange={e => update('confirmationRequired', e.target.checked)} />
          Require user confirmation before executing
        </label>
        {draft.confirmationRequired && (
          <input style={{ ...inputStyle, marginTop: 6 }}
            placeholder="Confirmation message (e.g. Are you sure you want to send this to OEM?)"
            value={draft.confirmationMessage ?? ''}
            onChange={e => update('confirmationMessage', e.target.value || undefined)} />
        )}
      </div>

      {/* Visibility condition */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Visibility Condition (optional)</span>
          <button
            style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => setShowCondBuilder(v => !v)}>
            {showCondBuilder ? 'Hide' : 'Show only when…'}
          </button>
        </div>
        {showCondBuilder && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: 6 }}>
              Show this action only when these conditions are met:
            </p>
            <ConditionBuilder
              conditions={draft.visibilityCondition ?? { logic: 'AND', conditions: [] }}
              currentEntityType={entityType}
              onChange={(g: FilterConditionGroup) => update('visibilityCondition', g)}
            />
          </>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-sm"
          style={{ background: isValid ? 'var(--accent)' : 'var(--border)', color: isValid ? '#fff' : 'var(--muted)', cursor: isValid ? 'pointer' : 'not-allowed' }}
          disabled={!isValid}
          onClick={() => isValid && onSave(draft)}>
          Save Action
        </button>
      </div>
    </div>
  );
}

// ── Standard action row ───────────────────────────────────────
function StandardActionRow({ action }: { action: StandardAction }) {
  const icon = ICON_MAP[action.icon] ?? <Zap size={14} />;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 12px', borderRadius: '6px',
      background: 'var(--bg-secondary)', marginBottom: '4px',
      border: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{action.label}</span>
      </div>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)',
      }}>
        {PLACEMENT_LABELS[action.placement]}
      </span>
      <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '120px', textAlign: 'right' }}>{action.reason}</span>
      <Lock size={11} style={{ color: 'var(--muted)', flexShrink: 0 }} />
    </div>
  );
}

// ── Custom action row ─────────────────────────────────────────
function CustomActionRow({
  action,
  editingLayer,
  onEdit,
  onDelete,
}: {
  action: EntityAction;
  editingLayer: LayerCode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const icon = ICON_MAP[action.icon ?? ''] ?? <Zap size={14} />;
  const isOwned = action.owningLayer === editingLayer || editingLayer === 'platform';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 12px', borderRadius: '6px',
      background: 'var(--bg-secondary)', marginBottom: '4px',
      border: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{action.label}</span>
        {action.visibilityCondition?.conditions.length ? (
          <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: 6 }}>
            (conditional)
          </span>
        ) : null}
      </div>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)',
      }}>
        {PLACEMENT_LABELS[action.placement]}
      </span>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        background: `${LAYER_COLORS[action.owningLayer]}18`, color: LAYER_COLORS[action.owningLayer],
        border: `1px solid ${LAYER_COLORS[action.owningLayer]}33`,
      }}>
        {LAYER_LABELS[action.owningLayer]}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
        {HANDLER_LABELS[action.handlerType]}
      </span>
      {isOwned ? (
        <>
          <button
            className="btn btn-ghost btn-sm"
            title="Edit action"
            onClick={onEdit}
            style={{ padding: '3px 6px' }}>
            <Pencil size={12} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title="Delete action"
            onClick={onDelete}
            style={{ padding: '3px 6px', color: '#ef4444' }}>
            <X size={12} />
          </button>
        </>
      ) : (
        <Lock size={11} style={{ color: 'var(--muted)', flexShrink: 0 }} title={`Owned by ${LAYER_LABELS[action.owningLayer]}`} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
interface ActionsPanelProps {
  entity: EntityDefinition;
  entityType: string;
  editingLayer: LayerCode;
}

export default function ActionsPanel({ entity, entityType, editingLayer }: ActionsPanelProps) {
  const { savedEntities, updateEntity } = useEntityDesignerStore();

  const [showAddEditor, setShowAddEditor] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const standardActions = useMemo(() => computeStandardActions(entity), [entity]);
  const customActions: EntityAction[] = entity.actions ?? [];

  // Always allow editing — updateEntity in the store falls back to MOCK_ENTITIES for mock entities
  const canEdit = true;

  const saveAction = (action: EntityAction) => {
    const existing = customActions.find(a => a.actionId === action.actionId);
    let updated: EntityAction[];
    if (existing) {
      updated = customActions.map(a => a.actionId === action.actionId ? action : a);
    } else {
      updated = [...customActions, action];
    }
    updateEntity(entityType, { actions: updated });
    setShowAddEditor(false);
    setEditingActionId(null);
  };

  const deleteAction = (actionId: string) => {
    updateEntity(entityType, { actions: customActions.filter(a => a.actionId !== actionId) });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
      {/* ── Standard Actions ── */}
      <section style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Lock size={13} style={{ color: 'var(--muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
            Standard Actions
          </span>
          <span style={{
            fontSize: '10px', padding: '1px 6px', borderRadius: '9px',
            background: 'var(--bg-secondary)', color: 'var(--muted)',
            border: '1px solid var(--border)',
          }}>
            {standardActions.length} auto-provisioned
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
          background: 'hsl(22 100% 51% / 0.05)', border: '1px solid hsl(22 100% 51% / 0.2)',
          borderRadius: '6px', marginBottom: '10px', fontSize: '11px', color: 'var(--muted)',
        }}>
          <Info size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <span>
            Standard actions are automatically available based on entity category and workflow settings.
            They cannot be removed — hide them using profile-based access control.
          </span>
        </div>
        {standardActions.map(action => (
          <StandardActionRow key={action.actionId} action={action} />
        ))}
      </section>

      {/* ── Custom Actions ── */}
      <section style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Zap size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
            Custom Actions
          </span>
          {customActions.length > 0 && (
            <span style={{
              fontSize: '10px', padding: '1px 6px', borderRadius: '9px',
              background: 'hsl(22 100% 51% / 0.08)', color: 'var(--accent)',
              border: '1px solid hsl(22 100% 51% / 0.2)',
            }}>
              {customActions.length}
            </span>
          )}
          {canEdit && !showAddEditor && (
            <button
              className="btn btn-sm"
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent)', color: '#fff', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => { setShowAddEditor(true); setEditingActionId(null); }}>
              <Plus size={12} /> Add Action
            </button>
          )}
          {!canEdit && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted)' }}>
              Save entity to add custom actions
            </span>
          )}
        </div>

        {/* New action editor */}
        {showAddEditor && canEdit && (
          <ActionEditor
            action={emptyAction(editingLayer)}
            entityType={entityType}
            entity={entity}
            editingLayer={editingLayer}
            onSave={saveAction}
            onCancel={() => setShowAddEditor(false)}
          />
        )}

        {/* Custom action list */}
        {customActions.length === 0 && !showAddEditor ? (
          <div style={{
            textAlign: 'center', padding: '32px 16px', color: 'var(--muted)',
            border: '1px dashed var(--border)', borderRadius: '8px',
            fontSize: '12px',
          }}>
            <Zap size={22} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
            No custom actions defined yet.
            {canEdit && (
              <div style={{ marginTop: 6 }}>
                <button
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  onClick={() => setShowAddEditor(true)}>
                  + Add first action
                </button>
              </div>
            )}
          </div>
        ) : (
          customActions.map(action => (
            editingActionId === action.actionId ? (
              <ActionEditor
                key={action.actionId}
                action={action}
                entityType={entityType}
                entity={entity}
                editingLayer={editingLayer}
                onSave={saveAction}
                onCancel={() => setEditingActionId(null)}
              />
            ) : (
              <CustomActionRow
                key={action.actionId}
                action={action}
                editingLayer={editingLayer}
                onEdit={() => { setEditingActionId(action.actionId); setShowAddEditor(false); }}
                onDelete={() => deleteAction(action.actionId)}
              />
            )
          ))
        )}
      </section>
    </div>
  );
}
