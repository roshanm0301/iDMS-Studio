import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { EntityDefinition } from '../../types/entityDesigner';

interface Props {
  entity: EntityDefinition;
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
}

const LIFECYCLE_COLORS: Record<string, string> = {
  draft:    'var(--muted)',
  active:   '#10b981',
  disabled: '#ef4444',
};

export default function SchemaOutline({ entity, selectedFieldId, onSelectField }: Props) {
  const [search, setSearch] = useState('');

  const fields = useMemo(() => {
    let list = [...entity.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.fieldId.toLowerCase().includes(q) ||
        f.fieldType.includes(q)
      );
    }
    return list;
  }, [entity.fields, search]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header + search */}
      <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
          Fields ({entity.fields.length})
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: '26px', width: '100%', fontSize: '12px' }}
            placeholder="Find field…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Flat field list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {fields.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
            {search ? 'No fields match your search' : 'No fields yet'}
          </div>
        ) : (
          fields.map(field => (
            <div
              key={field.fieldId}
              style={{
                padding: '7px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: selectedFieldId === field.fieldId
                  ? 'hsl(22 100% 51% / 0.08)'
                  : 'transparent',
                color: selectedFieldId === field.fieldId ? 'var(--accent)' : 'var(--text)',
                borderLeft: selectedFieldId === field.fieldId
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                opacity: field.lifecycle === 'disabled' ? 0.5 : 1,
                transition: 'background 0.1s',
              }}
              onClick={() => onSelectField(field.fieldId)}
            >
              {/* Lifecycle dot */}
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: LIFECYCLE_COLORS[field.lifecycle] ?? 'var(--muted)',
                flexShrink: 0,
              }} />

              {/* Label */}
              <span style={{
                flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: selectedFieldId === field.fieldId ? 600 : 400,
              }}>
                {field.label}
              </span>

              {/* Type */}
              <span style={{
                fontSize: '10px', color: 'var(--muted)',
                fontFamily: 'monospace', flexShrink: 0,
              }}>
                {field.fieldType}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
