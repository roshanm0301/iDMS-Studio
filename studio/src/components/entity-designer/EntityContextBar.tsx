import { useState, useRef, useEffect } from 'react';
import { Save, CheckCircle, AlertTriangle, XCircle, ChevronDown, Braces, ArrowRight, Lock, Layers } from 'lucide-react';
import type { EntityDefinition, EntityStatus, EntityArchetype } from '../../types/entityDesigner';
import type { LayerCode } from '../../types';
import { LAYER_LABELS, LAYER_COLORS } from '../../utils/entityDesignerConstants';

// v2 — Archetype display config (compact for context bar)
const ARCHETYPE_CHIP: Record<EntityArchetype, { label: string; color: string }> = {
  native_persistent:       { label: 'Native',       color: '#10b981' },
  virtual_computed:        { label: 'Virtual',       color: '#6366f1' },
  external_federated:      { label: 'External',      color: '#f59e0b' },
  materialized_projection: { label: 'Projection',    color: '#8b5cf6' },
  junction_association:    { label: 'Junction',      color: '#06b6d4' },
  owned_child:             { label: 'Child',         color: '#64748b' },
  append_only_record:      { label: 'Append-Only',   color: '#f97316' },
  system_technical:        { label: 'System',        color: '#94a3b8' },
  // v3 new archetypes
  activity_interaction:    { label: 'Activity',      color: '#0ea5e9' },
  staging_import:          { label: 'Staging',       color: '#a855f7' },
  high_volume_event_log:   { label: 'Event Log',     color: '#ef4444' },
  integration_outbox:      { label: 'Outbox',        color: '#14b8a6' },
  posting_document:        { label: 'Posting Doc',   color: '#e11d48' },
  reference_code:          { label: 'Reference',     color: '#84cc16' },
};

const LAYER_OPTIONS: LayerCode[] = ['platform', 'vertical', 'tenant', 'node'];

interface Props {
  entity: EntityDefinition;
  onSaveDraft: () => void;
  onStatusChange?: (status: EntityStatus) => void;
  compileErrorCount: number;
  compileWarningCount: number;
  onShowIssues: () => void;
  onShowSchemaPreview: () => void;
  // P1-01 / P1-02
  editingLayer?: LayerCode;
  onEditingLayerChange?: (layer: LayerCode) => void;
  viewMode?: 'delta' | 'resolved';
  onViewModeChange?: (mode: 'delta' | 'resolved') => void;
}

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<EntityStatus, { color: string; bg: string; label: string; description: string }> = {
  draft: {
    color: '#d97706',
    bg: 'rgba(217,119,6,0.1)',
    label: 'Draft',
    description: 'Schema is being built. Not yet live.',
  },
  active: {
    color: '#059669',
    bg: 'rgba(5,150,105,0.1)',
    label: 'Active',
    description: 'Schema is live and in use.',
  },
  deprecated: {
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.1)',
    label: 'Deprecated',
    description: 'Schema is retired. Use is discouraged.',
  },
};

// ── Live Readiness Indicator ──────────────────────────────────
function ReadinessIndicator({ errors, warnings, onClick }: { errors: number; warnings: number; onClick: () => void }) {
  const isError   = errors > 0;
  const isWarning = !isError && warnings > 0;
  const color     = isError ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const Icon      = isError ? XCircle : isWarning ? AlertTriangle : CheckCircle;
  const label     = isError
    ? `${errors} error${errors > 1 ? 's' : ''}${warnings > 0 ? `, ${warnings} warning${warnings > 1 ? 's' : ''}` : ''}`
    : isWarning ? `${warnings} warning${warnings > 1 ? 's' : ''}` : 'Schema ready';

  return (
    <button
      onClick={onClick}
      title="Click to view issues"
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
        background: color + '18', border: `1px solid ${color}40`, color,
        cursor: 'pointer',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: isError ? 'pulse-ring 1.5s ease-out infinite' : 'none', opacity: 0.4 }} />
        <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color }} />
      </span>
      <Icon size={12} /> {label}
    </button>
  );
}

// ── Status dropdown ───────────────────────────────────────────
function StatusDropdown({
  entity, compileErrorCount, onTransition,
}: {
  entity: EntityDefinition;
  compileErrorCount: number;
  onTransition: (s: EntityStatus) => void;
}) {
  const cfg    = STATUS_CONFIG[entity.status];
  const blocked = compileErrorCount > 0 && entity.status === 'draft';

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      minWidth: '280px', overflow: 'hidden',
    }}>
      {/* Current status header */}
      <div style={{ padding: '14px 16px', background: cfg.bg, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '6px' }}>
          Current Status
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: cfg.color }}>{cfg.label}</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{cfg.description}</div>
      </div>

      {/* Available transitions */}
      <div style={{ padding: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', padding: '4px 8px 8px' }}>
          Change Status
        </div>

        {entity.status === 'draft' && (
          <button
            onClick={() => !blocked && onTransition('active')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderRadius: '7px', border: `1px solid ${blocked ? 'var(--border)' : 'rgba(5,150,105,0.3)'}`,
              background: blocked ? 'var(--bg-secondary)' : 'rgba(5,150,105,0.06)',
              cursor: blocked ? 'not-allowed' : 'pointer',
              marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start',
              opacity: blocked ? 0.7 : 1,
            }}
          >
            <div style={{ marginTop: '1px' }}>
              {blocked
                ? <Lock size={15} style={{ color: '#9ca3af' }} />
                : <CheckCircle size={15} style={{ color: '#059669' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: blocked ? 'var(--muted)' : '#059669' }}>
                Activate Entity
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>
                  Draft <ArrowRight size={10} /> Active
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                {blocked
                  ? `Fix ${compileErrorCount} schema error${compileErrorCount > 1 ? 's' : ''} before activating`
                  : 'Makes this schema live. Fields go into production.'}
              </div>
            </div>
          </button>
        )}

        {entity.status === 'active' && (
          <button
            onClick={() => onTransition('deprecated')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderRadius: '7px', border: '1px solid rgba(220,38,38,0.25)',
              background: 'rgba(220,38,38,0.05)',
              cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={15} style={{ color: '#dc2626', marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#dc2626' }}>
                Deprecate Entity
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>
                  Active <ArrowRight size={10} /> Deprecated
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Marks schema as retired. Existing data is unaffected.
              </div>
            </div>
          </button>
        )}

        {entity.status === 'deprecated' && (
          <button
            onClick={() => onTransition('active')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderRadius: '7px', border: '1px solid rgba(5,150,105,0.3)',
              background: 'rgba(5,150,105,0.06)',
              cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}
          >
            <CheckCircle size={15} style={{ color: '#059669', marginTop: '1px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#059669' }}>
                Reactivate Entity
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>
                  Deprecated <ArrowRight size={10} /> Active
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Restores this schema to active use.
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px 10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Lock size={10} /> All status changes are logged to the audit trail.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function EntityContextBar({
  entity, onSaveDraft,
  onStatusChange, compileErrorCount, compileWarningCount,
  onShowIssues, onShowSchemaPreview,
  editingLayer = 'tenant', onEditingLayerChange,
  viewMode = 'delta', onViewModeChange,
}: Props) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    if (showStatusMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStatusMenu]);

  const handleTransition = (newStatus: EntityStatus) => {
    setShowStatusMenu(false);
    onStatusChange?.(newStatus);
  };

  const cfg = STATUS_CONFIG[entity.status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
      borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
      flexWrap: 'wrap',
    }}>
      {/* Entity identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '180px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{entity.label}</span>
            {entity.entityArchetype && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.02em', textTransform: 'uppercase',
                color: ARCHETYPE_CHIP[entity.entityArchetype].color,
                background: ARCHETYPE_CHIP[entity.entityArchetype].color + '18',
                border: `1px solid ${ARCHETYPE_CHIP[entity.entityArchetype].color}40`,
              }}>
                {ARCHETYPE_CHIP[entity.entityArchetype].label}
              </span>
            )}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>
            entity.{entity.entityType}
          </span>
        </div>

        {/* Status button */}
        <div ref={statusRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowStatusMenu(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 10px', borderRadius: '7px',
              border: `1px solid ${cfg.color}50`,
              background: cfg.bg, cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: cfg.color,
              transition: 'box-shadow 0.15s',
              boxShadow: showStatusMenu ? `0 0 0 3px ${cfg.color}20` : 'none',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
            <ChevronDown
              size={13}
              style={{ transition: 'transform 0.15s', transform: showStatusMenu ? 'rotate(180deg)' : 'none', opacity: 0.7 }}
            />
          </button>

          {showStatusMenu && (
            <StatusDropdown
              entity={entity}
              compileErrorCount={compileErrorCount}
              onTransition={handleTransition}
            />
          )}
        </div>
      </div>

      {/* Editing layer + view mode — P1-01, P1-02 */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* Editing as layer selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Layers size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Editing as</span>
          <select
            value={editingLayer}
            onChange={e => onEditingLayerChange?.(e.target.value as LayerCode)}
            style={{
              fontSize: '12px', fontWeight: 600,
              color: LAYER_COLORS[editingLayer],
              background: LAYER_COLORS[editingLayer] + '15',
              border: `1px solid ${LAYER_COLORS[editingLayer]}40`,
              borderRadius: '6px', padding: '3px 6px', cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LAYER_OPTIONS.map(l => (
              <option key={l} value={l} style={{ color: 'inherit', background: 'var(--bg)' }}>
                {LAYER_LABELS[l]}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          {(['delta', 'resolved'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange?.(mode)}
              style={{
                fontSize: '11px', fontWeight: viewMode === mode ? 700 : 400,
                padding: '3px 9px', border: 'none', cursor: 'pointer',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--muted)',
                transition: 'all 0.15s',
              }}
            >
              {mode === 'delta' ? 'Delta' : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <ReadinessIndicator errors={compileErrorCount} warnings={compileWarningCount} onClick={onShowIssues} />

        <button
          className="btn btn-ghost"
          onClick={onShowSchemaPreview}
          title="View schema JSON"
          style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Braces size={13} /> Schema
        </button>

        <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={onSaveDraft}>
          <Save size={12} /> Save Draft
        </button>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
