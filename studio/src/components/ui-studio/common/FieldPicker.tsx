import { useState } from 'react'
import { Search } from 'lucide-react'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import { FieldMetadataBadge } from './FieldMetadataBadge'
import type { MockEntityField } from '../../../types/ui-studio/index'

interface FieldPickerProps {
  entityId: string | undefined
  selectedFieldIds: string[]
  onToggle: (fieldId: string, selected: boolean) => void
  disabledFieldIds?: string[]
  multiSelect?: boolean
  label?: string
  filterOut?: (field: MockEntityField) => boolean
}

export function FieldPicker({
  entityId,
  selectedFieldIds,
  onToggle,
  disabledFieldIds,
  multiSelect = true,
  label,
  filterOut,
}: FieldPickerProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('All')

  const entity = entityId ? MOCK_ENTITIES.find(e => e.id === entityId) : undefined

  if (!entity) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
        {label && <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>{label}</div>}
        Select an entity to browse fields.
      </div>
    )
  }

  const visibleFields = entity.fields.filter(f => {
    if (f.isSystem) return false
    if (filterOut?.(f)) return false
    return true
  })

  const fieldTypes = Array.from(new Set(visibleFields.map(f => f.fieldType)))

  const filtered = visibleFields.filter(f => {
    if (typeFilter !== 'All' && f.fieldType !== typeFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!f.label.toLowerCase().includes(q) && !f.fieldCode.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {label && (
        <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--text)' }}>
          {label}
        </div>
      )}

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="input"
          placeholder="Search fields…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '24px', fontSize: '12px', height: '28px' }}
        />
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setTypeFilter('All')}
          className={typeFilter === 'All' ? 'btn btn-xs btn-primary' : 'btn btn-xs btn-ghost'}
        >
          All
        </button>
        {fieldTypes.map(t => (
          <button
            type="button"
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? 'All' : t)}
            className={typeFilter === t ? 'btn btn-xs btn-primary' : 'btn btn-xs btn-ghost'}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Field list */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>No fields found</div>
        ) : (
          filtered.map(f => {
            const isSelected = selectedFieldIds.includes(f.id)
            const isDisabled = disabledFieldIds?.includes(f.id) ?? false
            return (
              <label
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                  fontSize: '12px',
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <input
                  type={multiSelect ? 'checkbox' : 'radio'}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => {
                    if (!isDisabled) onToggle(f.id, !isSelected)
                  }}
                />
                <span style={{ flex: 1, fontWeight: isSelected ? 500 : 400 }}>{f.label}</span>
                <FieldMetadataBadge field={f} compact />
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}
