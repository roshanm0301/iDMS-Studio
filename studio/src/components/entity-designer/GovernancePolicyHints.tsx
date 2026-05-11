import { Shield, AlertTriangle, Info } from 'lucide-react';
import type { EntityDefinition, DataClassification } from '../../types/entityDesigner';
import { detectAllConflicts } from '../../utils/conflictDetection';

interface Props {
  entity: EntityDefinition;
}

const CLASSIFICATION_CONFIG: Record<DataClassification, { label: string; color: string; bg: string; desc: string }> = {
  open:      { label: 'Open',      color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   desc: 'Safe to share externally — customer portals, public APIs, exports' },
  internal:  { label: 'Internal',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)', desc: 'Business use only — visible to authenticated staff, not external audiences' },
  sensitive: { label: 'Sensitive', color: '#d97706', bg: 'rgba(217,119,6,0.1)',   desc: 'Personal or commercially confidential — mask in export and APIs' },
  regulated: { label: 'Regulated', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   desc: 'Subject to external legal/regulatory obligation — enforcement required' },
};

export default function GovernancePolicyHints({ entity }: Props) {
  // Governance conflicts only — compile errors are shown in ConflictSummary (Fields tab)
  const { governanceConflicts } = detectAllConflicts(entity);

  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Shield size={16} style={{ color: 'var(--accent)' }} />
        <h3 style={{ margin: 0, fontSize: '15px' }}>Governance Policy</h3>
      </div>

      {/* Classification Legend */}
      <div style={{ marginBottom: '20px' }}>
        <div className="form-label" style={{ marginBottom: '8px' }}>Data Classification Legend</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {(Object.entries(CLASSIFICATION_CONFIG) as [DataClassification, typeof CLASSIFICATION_CONFIG[DataClassification]][]).map(([key, cfg]) => (
            <div key={key} style={{ padding: '8px 10px', borderRadius: '6px', background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
              <div style={{ fontWeight: 600, fontSize: '12px', color: cfg.color }}>{cfg.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{cfg.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance Conflicts — exclusively owns this concern */}
      {governanceConflicts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div className="form-label" style={{ marginBottom: '8px' }}>
            Governance Conflicts
            <span style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#d97706', fontWeight: 600 }}>
              {governanceConflicts.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {governanceConflicts.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px',
                  background: c.severity === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${c.severity === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}
              >
                <AlertTriangle size={13} style={{ color: c.severity === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <span style={{ fontWeight: 500 }}>{c.fieldLabel ?? 'Field'}:</span> {c.message.replace(`"${c.fieldLabel}"`, '').replace(/^[^:]+:\s*/, '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {governanceConflicts.length === 0 && (
        <div style={{ marginBottom: '20px', padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px', color: '#059669' }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
          No governance conflicts detected for this entity.
        </div>
      )}

      {/* Per-field governance table */}
      <div>
        <div className="form-label" style={{ marginBottom: '8px' }}>Field Governance Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontWeight: 600 }}>Field</th>
                <th style={{ textAlign: 'left', padding: '7px 6px', fontWeight: 600 }}>Class.</th>
                <th style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600 }}>Export</th>
                <th style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600 }}>Masked</th>
                <th style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600 }}>Import</th>
                <th style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600 }}>API In</th>
                <th style={{ textAlign: 'center', padding: '7px 6px', fontWeight: 600 }}>API Out</th>
              </tr>
            </thead>
            <tbody>
              {entity.fields.map((field, i) => {
                const cfg = CLASSIFICATION_CONFIG[field.classification];
                const hasConflict = governanceConflicts.some(c => c.fieldId === field.fieldId);
                return (
                  <tr
                    key={field.fieldId}
                    style={{
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                      borderLeft: hasConflict ? '3px solid #f59e0b' : '3px solid transparent',
                    }}
                  >
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ fontWeight: 500 }}>{field.label}</div>
                      <div style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '10px' }}>{field.fieldId}</div>
                    </td>
                    <td style={{ padding: '6px 6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: cfg?.color }}>{cfg?.label ?? field.classification}</span>
                    </td>
                    {(['includeInExport', 'maskInExport', 'allowImport', 'apiInputAllowed', 'apiOutputAllowed'] as const).map(govKey => {
                      const val = field.governance[govKey] as boolean;
                      return (
                        <td key={govKey} style={{ textAlign: 'center', padding: '6px' }}>
                          <span style={{ color: val ? '#10b981' : '#ef4444', fontSize: '14px' }}>{val ? '✓' : '✗'}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
