import { Trash2, Plus } from 'lucide-react'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { DataSourceDefinition, FilterExpression } from '../../../types/ui-studio/index'

interface DataSourceConfiguratorProps {
  dataSource: DataSourceDefinition
  onChange: (ds: DataSourceDefinition) => void
}

const SOURCE_TYPES: DataSourceDefinition['sourceType'][] = [
  'primary_entity',
  'related_entity',
  'static_options',
  'mock_api',
]

const OPERATORS: FilterExpression['operator'][] = ['eq', 'neq', 'contains', 'gt', 'lt', 'in']

export function DataSourceConfigurator({ dataSource, onChange }: DataSourceConfiguratorProps) {
  function updateField<K extends keyof DataSourceDefinition>(key: K, value: DataSourceDefinition[K]) {
    onChange({ ...dataSource, [key]: value })
  }

  function addFilter() {
    const newFilter: FilterExpression = { field: '', operator: 'eq', value: '' }
    onChange({ ...dataSource, filters: [...dataSource.filters, newFilter] })
  }

  function updateFilter(index: number, patch: Partial<FilterExpression>) {
    const updated = dataSource.filters.map((f, i) => i === index ? { ...f, ...patch } : f)
    onChange({ ...dataSource, filters: updated })
  }

  function removeFilter(index: number) {
    onChange({ ...dataSource, filters: dataSource.filters.filter((_, i) => i !== index) })
  }

  const showEntitySelect = dataSource.sourceType === 'primary_entity' || dataSource.sourceType === 'related_entity'

  const labelStyle: React.CSSProperties = {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '3px',
    display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Source type */}
      <div>
        <label style={labelStyle}>Source Type</label>
        <select
          className="form-select"
          style={{ width: '100%', fontSize: '12px' }}
          value={dataSource.sourceType}
          onChange={e => updateField('sourceType', e.target.value as DataSourceDefinition['sourceType'])}
        >
          {SOURCE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Entity selector */}
      {showEntitySelect && (
        <div>
          <label style={labelStyle}>Entity</label>
          <select
            className="form-select"
            style={{ width: '100%', fontSize: '12px' }}
            value={dataSource.entityId ?? ''}
            onChange={e => updateField('entityId', e.target.value || undefined)}
          >
            <option value="">— Select entity —</option>
            {MOCK_ENTITIES.map(e => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Filters</label>
          <button className="btn btn-xs btn-ghost" onClick={addFilter} type="button">
            <Plus size={11} /> Add Filter
          </button>
        </div>

        {dataSource.filters.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No filters — all records shown</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dataSource.filters.map((filter, i) => (
              <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  style={{ flex: 2, fontSize: '11.5px', height: '26px' }}
                  placeholder="field"
                  value={filter.field}
                  onChange={e => updateFilter(i, { field: e.target.value })}
                />
                <select
                  className="form-select"
                  style={{ flex: 1, fontSize: '11.5px', height: '26px', minWidth: 0 }}
                  value={filter.operator}
                  onChange={e => updateFilter(i, { operator: e.target.value as FilterExpression['operator'] })}
                >
                  {OPERATORS.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input"
                  style={{ flex: 2, fontSize: '11.5px', height: '26px' }}
                  placeholder="value"
                  value={filter.value !== undefined && filter.value !== null ? String(filter.value) : ''}
                  onChange={e => updateFilter(i, { value: e.target.value })}
                />
                <button className="btn btn-ghost btn-xs" onClick={() => removeFilter(i)} type="button">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
