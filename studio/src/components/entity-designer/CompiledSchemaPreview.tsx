import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { EntityDefinition } from '../../types/entityDesigner';
import { getCompileReadiness } from '../../data/mockService';

interface Props {
  entity: EntityDefinition;
}

function buildCompiledSchema(entity: EntityDefinition) {
  const fields: Record<string, any> = {};
  entity.fields
    .filter(f => f.lifecycle !== 'disabled' && f.lifecycle !== 'draft')
    .forEach(f => {
      const entry: Record<string, any> = {
        type: f.fieldType,
        required: f.behaviors.presence !== 'optional',
        layer: f.sourceLayer,
      };
      if (f.fieldType === 'entity_ref') entry.target_entity = f.typeConfig?.targetEntity;
      if (f.fieldType === 'currency') entry.currency_source = f.typeConfig?.currencySource;
      if (f.fieldType === 'select' || f.fieldType === 'multi_select') entry.value_source = f.typeConfig?.valueSource;
      if (f.fieldType === 'computed') { entry.mode = f.typeConfig?.mode; entry.readonly = true; }
      fields[f.fieldId] = entry;
    });

  return {
    entity_type: entity.entityType,
    label: entity.label,
    category: entity.category,
    owning_layer: entity.owningLayer,
    behaviors: entity.behaviors,
    fields,
    compiled_at: new Date().toISOString(),
  };
}

export default function CompiledSchemaPreview({ entity }: Props) {
  const [expanded, setExpanded] = useState(false);
  const readiness = getCompileReadiness(entity.entityType);
  const compiled = buildCompiledSchema(entity);

  const statusIcon = readiness?.status === 'pass'
    ? <CheckCircle size={13} style={{ color: '#10b981' }} />
    : readiness?.status === 'warn'
    ? <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
    : <XCircle size={13} style={{ color: '#ef4444' }} />;

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <div
        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-secondary)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <Code size={13} style={{ color: 'var(--muted)' }} />
        <span style={{ fontWeight: 500 }}>Compiled Schema Preview</span>
        {statusIcon}
        {readiness && (
          <span style={{ color: 'var(--muted)' }}>
            {readiness.errors.length > 0 && `${readiness.errors.length} error${readiness.errors.length > 1 ? 's' : ''}`}
            {readiness.warnings.length > 0 && ` ${readiness.warnings.length} warning${readiness.warnings.length > 1 ? 's' : ''}`}
            {readiness.errors.length === 0 && readiness.warnings.length === 0 && 'Ready to compile'}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </div>

      {expanded && (
        <pre style={{
          margin: 0, padding: '12px 16px',
          fontSize: '11px', fontFamily: 'monospace',
          background: 'var(--bg-tertiary, #1e1e2e)',
          color: 'var(--code-text, #cdd6f4)',
          overflowX: 'auto', maxHeight: '300px', overflowY: 'auto',
          lineHeight: 1.5,
        }}>
          {JSON.stringify(compiled, null, 2)}
        </pre>
      )}
    </div>
  );
}
