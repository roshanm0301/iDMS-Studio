import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_SALE_ORDERS } from '../../../mocks/ui-studio/mockSampleRecords'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import { pruneByRole } from './mockPermissionPruner'
import { renderFieldValue } from './fieldRenderer'
import type { ViewArtifact, PreviewContext, RuleEffect } from '../../../types/ui-studio/index'

interface ListSurfaceRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
  ruleMap: Map<string, RuleEffect>
}

function getMockRecords(entityId: string | undefined): Record<string, unknown>[] {
  if (entityId === 'entity-customer') return MOCK_CUSTOMERS as unknown as Record<string, unknown>[]
  if (entityId === 'entity-product') return MOCK_PRODUCTS as unknown as Record<string, unknown>[]
  if (entityId === 'entity-saleorder') return MOCK_SALE_ORDERS as unknown as Record<string, unknown>[]
  return []
}

export function ListSurfaceRenderer({ artifact, ruleMap }: ListSurfaceRendererProps) {
  const entity = artifact.primaryEntityId ? getMockEntityById(artifact.primaryEntityId) : undefined
  const allColumns = artifact.components.filter(c => c.componentType.endsWith('_column'))
  const columns = pruneByRole(allColumns, ruleMap)
  const records = getMockRecords(artifact.primaryEntityId)
  const toolbarActions = pruneByRole(
    (artifact.actions ?? []).filter(a => a.placement === 'toolbar'),
    ruleMap
  )

  function getFieldCode(fieldId: string | undefined): string {
    if (!fieldId) return ''
    if (entity) {
      const field = entity.fields.find(f => f.id === fieldId)
      if (field) return field.fieldCode
    }
    return fieldId
  }

  if (columns.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
        No columns configured. Open the editor and add columns from the Surface tab.
      </div>
    )
  }

  return (
    <div>
      {toolbarActions.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {toolbarActions.map(action => (
            <button key={action.id} className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }} tabIndex={-1}>
              {action.label}
            </button>
          ))}
        </div>
      )}

      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} style={{
                padding: '8px 10px', textAlign: 'left', fontSize: '11.5px',
                fontWeight: 600, color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-sunken)',
              }}>
                {col.label ?? col.fieldId}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, rowIdx) => (
            <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => {
                const fieldCode = getFieldCode(col.fieldId)
                const value = record[fieldCode]
                const widgetType = (col.config?.renderer as string | undefined) ?? col.componentType.replace('_column', '')
                return (
                  <td key={col.id} style={{ padding: '8px 10px', fontSize: '12.5px' }}>
                    {renderFieldValue(value, widgetType)}
                  </td>
                )
              })}
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={columns.length || 1} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
