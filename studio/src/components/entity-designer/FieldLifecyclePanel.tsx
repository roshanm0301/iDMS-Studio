import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import type { EntityDefinition, FieldLifecycleState, LifecycleTransitionMeta } from '../../types/entityDesigner';
import { LIFECYCLE_CONFIG } from '../../utils/entityDesignerConstants';

interface Props {
  entity: EntityDefinition;
}

const ALLOWED: Record<FieldLifecycleState, FieldLifecycleState[]> = {
  draft:    ['active', 'disabled'],
  active:   ['disabled'],
  disabled: ['active'],
};

interface TransitionModalProps {
  fieldId: string;
  fieldLabel: string;
  from: FieldLifecycleState;
  to: FieldLifecycleState;
  entityType: string;
  onClose: () => void;
}

function TransitionModal({ fieldId, fieldLabel, from, to, entityType, onClose }: TransitionModalProps) {
  const { setFieldLifecycle, showToast } = useEntityDesignerStore();
  const [reason, setReason] = useState('');
  const [replacement, setReplacement] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const needsReason = to === 'disabled';

  const handleConfirm = () => {
    if (needsReason && !reason.trim()) { showToast('Please provide a reason', 'error'); return; }
    const meta: LifecycleTransitionMeta = { reason: reason || undefined, replacementFieldId: replacement || undefined, effectiveDate: effectiveDate || undefined };
    const result = setFieldLifecycle(entityType, fieldId, to, meta);
    if (!result.success) { showToast(result.error ?? 'Transition failed', 'error'); return; }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', width: '460px', maxWidth: '95vw' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>Change Field Lifecycle</h3>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 16px' }}>
          <strong>{fieldLabel}</strong>: {from} → {to}
        </p>

        {to === 'disabled' && (
          <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
            <XCircle size={13} style={{ color: '#ef4444' }} /> Disabling prevents the field from being editable or visible. It will remain in the compiled schema until fully removed via governance.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Reason {needsReason ? '*' : '(optional)'}</label>
            <textarea className="search-input" style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
              placeholder="Reason for disabling…"
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          {(to === 'deprecated' || to === 'disabled') && (
            <div>
              <label className="form-label">Replacement Field (optional)</label>
              <input className="search-input" style={{ width: '100%' }} placeholder="field_id of replacement field…"
                value={replacement} onChange={e => setReplacement(e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: to === 'disabled' ? '#ef4444' : undefined }}
            onClick={handleConfirm}
          >
            Confirm: → {LIFECYCLE_CONFIG[to].label}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FieldLifecyclePanel({ entity }: Props) {
  const [modal, setModal] = useState<{ fieldId: string; fieldLabel: string; from: FieldLifecycleState; to: FieldLifecycleState } | null>(null);

  const sortedFields = [...entity.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Field Lifecycle Management</h3>
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Manage lifecycle states for each field. Protected fields cannot be transitioned.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedFields.map(field => {
          const cfg = LIFECYCLE_CONFIG[field.lifecycle];
          const Icon = cfg.icon;
          const allowed = field.protected ? [] : ALLOWED[field.lifecycle];

          return (
            <div key={field.fieldId} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{field.label}</span>
                  {field.protected && <span className="badge badge-purple" style={{ fontSize: '10px' }}>protected</span>}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{field.fieldId} · {field.fieldType}</div>
                {field.lifecycleMeta?.reason && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', fontStyle: 'italic' }}>
                    {field.lifecycleMeta.reason}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: cfg.color }}>
                  <Icon size={13} /> {cfg.label}
                </span>

                {allowed.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {allowed.map(target => {
                      const tCfg = LIFECYCLE_CONFIG[target];
                      return (
                        <button
                          key={target}
                          className="btn btn-ghost"
                          style={{ fontSize: '11px', padding: '3px 8px', color: tCfg.color }}
                          onClick={() => setModal({ fieldId: field.fieldId, fieldLabel: field.label, from: field.lifecycle, to: target })}
                        >
                          <ArrowRight size={10} /> {tCfg.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {field.protected && (
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>cannot transition</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <TransitionModal
          fieldId={modal.fieldId}
          fieldLabel={modal.fieldLabel}
          from={modal.from}
          to={modal.to}
          entityType={entity.entityType}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
