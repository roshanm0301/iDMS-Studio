import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { FieldPicker } from '../common/FieldPicker'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact, TransactionConfig, TransactionLineColumn } from '../../../types/ui-studio/index'

interface LineGridConfigPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function LineGridConfigPanel({ artifact, onChange }: LineGridConfigPanelProps) {
  const [showPicker, setShowPicker] = useState(false)

  const txConfig = artifact.transactionConfig
  const lineEntityId = txConfig?.lineEntityId
  const lineEntity = lineEntityId ? MOCK_ENTITIES.find(e => e.id === lineEntityId) : undefined
  const lineColumns: TransactionLineColumn[] = txConfig?.lineColumns ?? []
  const placedFieldIds = lineColumns.map(c => c.fieldId)

  if (!lineEntityId) {
    return (
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No line entity selected. Use the <strong>Line Grid</strong> section in the canvas to pick the related line entity, then return here to configure columns.
        </div>
      </div>
    )
  }

  function updateTxConfig(patch: Partial<TransactionConfig>) {
    const current: TransactionConfig = txConfig ?? {
      headerEntityId: artifact.primaryEntityId ?? '',
      lineEntityId: '',
      lineRelationshipId: '',
      headerFieldIds: [],
      lineColumns: [],
      totalsEnabled: false,
      totalFieldIds: [],
    }
    onChange({ transactionConfig: { ...current, ...patch } })
  }

  function handleAddField(fieldId: string, selected: boolean) {
    if (!selected) return
    const field = lineEntity?.fields.find(f => f.id === fieldId)
    const newCol: TransactionLineColumn = {
      fieldId,
      label: field?.label ?? fieldId,
      editable: true,
      required: field?.isRequired ?? false,
    }
    updateTxConfig({ lineColumns: [...lineColumns, newCol] })
    setShowPicker(false)
  }

  function updateColumn(fieldId: string, patch: Partial<TransactionLineColumn>) {
    updateTxConfig({
      lineColumns: lineColumns.map(c => c.fieldId === fieldId ? { ...c, ...patch } : c),
    })
  }

  function removeColumn(fieldId: string) {
    updateTxConfig({ lineColumns: lineColumns.filter(c => c.fieldId !== fieldId) })
  }

  function moveColumn(fieldId: string, dir: -1 | 1) {
    const idx = lineColumns.findIndex(c => c.fieldId === fieldId)
    if (idx === -1) return
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= lineColumns.length) return
    const updated = [...lineColumns]
    ;[updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]]
    updateTxConfig({ lineColumns: updated })
  }

  return (
    <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="panel-title" style={{ fontSize: '12px' }}>Line Grid Columns</span>
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
            entityId={lineEntityId}
            selectedFieldIds={placedFieldIds}
            onToggle={handleAddField}
            multiSelect={false}
            disabledFieldIds={placedFieldIds}
            label="Select a field to add as column"
          />
        </div>
      )}

      {lineColumns.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
          No line grid columns. Use the button above to configure the grid.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {lineColumns.map((col, idx) => (
            <div key={col.fieldId} style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              background: 'var(--bg-elev)',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.label ?? col.fieldId}
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={col.editable}
                    onChange={e => updateColumn(col.fieldId, { editable: e.target.checked })}
                  />
                  Editable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={col.required ?? false}
                    onChange={e => updateColumn(col.fieldId, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveColumn(col.fieldId, -1)}
                  disabled={idx === 0}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ padding: '1px', minWidth: 'unset' }}
                  onClick={() => moveColumn(col.fieldId, 1)}
                  disabled={idx === lineColumns.length - 1}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--red, #dc2626)', padding: '1px', minWidth: 'unset' }}
                  onClick={() => removeColumn(col.fieldId)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Row behavior section */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
          Row Behavior
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={txConfig?.allowAddRow ?? false}
            onChange={e => updateTxConfig({ allowAddRow: e.target.checked })}
          />
          Allow Add Row
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={txConfig?.allowDeleteRow ?? false}
            onChange={e => updateTxConfig({ allowDeleteRow: e.target.checked })}
          />
          Allow Delete Row
        </label>
      </div>
    </div>
  )
}
