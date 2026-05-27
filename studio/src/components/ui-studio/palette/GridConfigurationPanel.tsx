import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { FieldPicker } from '../common/FieldPicker'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact, ComponentDefinition, MockEntityField } from '../../../types/ui-studio/index'

const RENDERERS = ['text', 'badge', 'currency', 'date', 'boolean', 'status', 'reference'] as const
type Renderer = typeof RENDERERS[number]

function autoRenderer(field: MockEntityField): Renderer {
  switch (field.fieldType) {
    case 'currency': return 'currency'
    case 'date': return 'date'
    case 'datetime': return 'date'
    case 'boolean': return 'boolean'
    case 'status': return 'status'
    case 'entity_ref': return 'reference'
    case 'select': return 'badge'
    case 'multi_select': return 'badge'
    default: return 'text'
  }
}

function makeColComponent(fieldId: string, entityId: string): ComponentDefinition {
  const entity = MOCK_ENTITIES.find(e => e.id === entityId)
  const field = entity?.fields.find(f => f.id === fieldId)
  const renderer: Renderer = field ? autoRenderer(field) : 'text'
  return {
    id: `comp-${Date.now()}-${fieldId}`,
    componentType: `${renderer}_column`,
    fieldId,
    label: field?.label ?? fieldId,
    config: { renderer, sortable: true, filterable: false, width: 120 },
  }
}

interface GridConfigurationPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function GridConfigurationPanel({ artifact, onChange }: GridConfigurationPanelProps) {
  const [showPicker, setShowPicker] = useState(false)

  const columns = artifact.components.filter(c => c.componentType.endsWith('_column'))
  const nonColumnComponents = artifact.components.filter(c => !c.componentType.endsWith('_column'))
  const placedFieldIds = columns.map(c => c.fieldId).filter((id): id is string => !!id)

  function handleAddField(fieldId: string, selected: boolean) {
    if (!selected) return
    const entityId = artifact.primaryEntityId ?? ''
    const newCol = makeColComponent(fieldId, entityId)
    onChange({ components: [...nonColumnComponents, ...columns, newCol] })
    setShowPicker(false)
  }

  function updateColumn(id: string, patch: Partial<ComponentDefinition>) {
    const updated = artifact.components.map(c => c.id === id ? { ...c, ...patch } : c)
    onChange({ components: updated })
  }

  function updateColumnConfig(id: string, configPatch: Record<string, unknown>) {
    const updated = artifact.components.map(c =>
      c.id === id ? { ...c, config: { ...c.config, ...configPatch } } : c
    )
    onChange({ components: updated })
  }

  function removeColumn(id: string) {
    onChange({ components: artifact.components.filter(c => c.id !== id) })
  }

  function moveColumn(id: string, dir: -1 | 1) {
    const allComps = [...artifact.components]
    const colIndices = allComps.reduce<number[]>((acc, c, i) => {
      if (c.componentType.endsWith('_column')) acc.push(i)
      return acc
    }, [])
    const posInCols = colIndices.findIndex(i => allComps[i].id === id)
    if (posInCols === -1) return
    const targetPos = posInCols + dir
    if (targetPos < 0 || targetPos >= colIndices.length) return
    const fromIdx = colIndices[posInCols]
    const toIdx = colIndices[targetPos]
    ;[allComps[fromIdx], allComps[toIdx]] = [allComps[toIdx], allComps[fromIdx]]
    onChange({ components: allComps })
  }

  return (
    <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="panel-title" style={{ fontSize: '12px' }}>Grid Columns</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setShowPicker(v => !v)}
        >
          Add Column
        </button>
      </div>

      {showPicker && (
        <div style={{ marginBottom: '10px', padding: '8px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <FieldPicker
            entityId={artifact.primaryEntityId}
            selectedFieldIds={placedFieldIds}
            onToggle={handleAddField}
            multiSelect={false}
            disabledFieldIds={placedFieldIds}
            label="Select a field to add as column"
          />
        </div>
      )}

      {columns.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
          No columns configured. Apply Smart Defaults or add manually.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {columns.map((col, idx) => (
            <div key={col.id} style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              background: 'var(--bg-elev)',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.label ?? col.fieldId}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveColumn(col.id, -1)}
                  disabled={idx === 0}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveColumn(col.id, 1)}
                  disabled={idx === columns.length - 1}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--red, #dc2626)', padding: '1px', minWidth: 'unset' }}
                  onClick={() => removeColumn(col.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ fontSize: '11px', height: '24px', flex: 1, minWidth: '80px' }}
                  value={(col.config as Record<string, unknown>)['renderer'] as string ?? 'text'}
                  onChange={e => {
                    const renderer = e.target.value
                    updateColumn(col.id, { componentType: `${renderer}_column` })
                    updateColumnConfig(col.id, { renderer })
                  }}
                >
                  {RENDERERS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={(col.config as Record<string, unknown>)['sortable'] as boolean ?? false}
                    onChange={e => updateColumnConfig(col.id, { sortable: e.target.checked })}
                  />
                  Sortable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={(col.config as Record<string, unknown>)['filterable'] as boolean ?? false}
                    onChange={e => updateColumnConfig(col.id, { filterable: e.target.checked })}
                  />
                  Filterable
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
