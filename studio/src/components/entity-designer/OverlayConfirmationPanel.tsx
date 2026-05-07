import { Layers, CheckCircle } from 'lucide-react';
import type { FieldInstance } from '../../types/entityDesigner';
import { LAYER_COLORS, LAYER_LABELS } from '../../utils/entityDesignerConstants';

interface Props {
  field: FieldInstance;
  entityType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const OP_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  extend:    { label: 'Extend',    color: '#2563eb', desc: 'Adding a new field at this layer' },
  constrain: { label: 'Constrain', color: '#d97706', desc: 'Tightening rules on an inherited field' },
  replace:   { label: 'Replace',   color: '#7c3aed', desc: 'Structural change to an inherited field' },
  decorate:  { label: 'Decorate',  color: '#059669', desc: 'Adding metadata without structural change' },
  disable:   { label: 'Disable',   color: '#ef4444', desc: 'Suppressing an inherited field at this layer' },
};

export default function OverlayConfirmationPanel({ field, entityType, onConfirm, onCancel }: Props) {
  const layerColor = LAYER_COLORS[field.sourceLayer] ?? '#6366f1';
  const layerLabel = LAYER_LABELS[field.sourceLayer] ?? field.sourceLayer;
  const op = OP_LABELS[field.overlayOperation] ?? { label: field.overlayOperation, color: '#6366f1', desc: '' };

  return (
    <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Layers size={15} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 600, fontSize: '13px' }}>Confirm Overlay Operation</span>
      </div>

      <div style={{
        padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: '8px', marginBottom: '12px', fontSize: '12px', lineHeight: 1.7,
      }}>
        {/* Layer + Operation */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span>
            <span style={{ color: 'var(--muted)' }}>Layer: </span>
            <span style={{ fontWeight: 700, color: layerColor,
              background: `${layerColor}18`, border: `1px solid ${layerColor}40`,
              padding: '1px 8px', borderRadius: '10px' }}>
              {layerLabel}
            </span>
          </span>
          <span>
            <span style={{ color: 'var(--muted)' }}>Operation: </span>
            <span style={{ fontWeight: 700, color: op.color,
              background: `${op.color}18`, border: `1px solid ${op.color}40`,
              padding: '1px 8px', borderRadius: '10px' }}>
              {op.label}
            </span>
          </span>
        </div>

        {/* What this means */}
        <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
          {op.desc}
        </div>

        {/* Target path */}
        <div style={{ fontSize: '11px' }}>
          <span style={{ color: 'var(--muted)' }}>Target: </span>
          <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
            {entityType}.fields.{field.fieldId}
          </code>
        </div>

        {/* Draft lifecycle note */}
        <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: '5px', fontSize: '11px', color: '#92400e' }}>
          Field saves in <strong>Draft</strong> lifecycle — excluded from compiled schema until activated.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ fontSize: '13px' }}>
          ← Back to Edit
        </button>
        <button className="btn btn-primary" onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <CheckCircle size={13} /> Confirm &amp; Save Draft
        </button>
      </div>
    </div>
  );
}
