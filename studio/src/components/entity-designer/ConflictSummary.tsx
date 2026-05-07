import { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { EntityDefinition } from '../../types/entityDesigner';
import { detectAllConflicts } from '../../utils/conflictDetection';

interface Props {
  entity: EntityDefinition;
  onSelectField?: (fieldId: string) => void;
}

export default function ConflictSummary({ entity, onSelectField }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Only show COMPILE errors here — governance conflicts live in the Governance tab
  const { compileErrors } = detectAllConflicts(entity);
  const errors = compileErrors.filter(c => c.severity === 'error');
  const warnings = compileErrors.filter(c => c.severity === 'warning');

  if (compileErrors.length === 0) {
    return (
      <div style={{
        padding: '6px 12px', fontSize: '12px', color: '#10b981',
        borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
        No compile errors detected
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      <div
        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        {errors.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
            <XCircle size={13} /> {errors.length} compile error{errors.length > 1 ? 's' : ''}
          </span>
        )}
        {warnings.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
            <AlertTriangle size={13} /> {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {compileErrors.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px',
                background: c.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                borderRadius: '4px', fontSize: '12px',
                cursor: c.fieldId ? 'pointer' : 'default',
              }}
              onClick={() => c.fieldId && onSelectField?.(c.fieldId)}
            >
              {c.severity === 'error'
                ? <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                : <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />}
              <span>{c.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
