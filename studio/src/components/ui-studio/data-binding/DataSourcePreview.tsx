import { evaluateMockFilter } from '../../../lib/ui-studio/mockFilterEvaluator'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import {
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
  MOCK_SALE_ORDERS,
  MOCK_SALE_ORDER_LINES,
  MOCK_BRANCHES,
  MOCK_SALESPERSONS,
} from '../../../mocks/ui-studio/mockSampleRecords'
import type { DataSourceDefinition } from '../../../types/ui-studio/index'

function getMockRecordsForEntity(entityId: string | undefined): Record<string, unknown>[] {
  switch (entityId) {
    case 'entity-customer': return MOCK_CUSTOMERS as Record<string, unknown>[]
    case 'entity-product': return MOCK_PRODUCTS as Record<string, unknown>[]
    case 'entity-saleorder': return MOCK_SALE_ORDERS as Record<string, unknown>[]
    case 'entity-saleorderline': return MOCK_SALE_ORDER_LINES as Record<string, unknown>[]
    case 'entity-branch': return MOCK_BRANCHES as Record<string, unknown>[]
    case 'entity-salesperson': return MOCK_SALESPERSONS as Record<string, unknown>[]
    default: return []
  }
}

interface DataSourcePreviewProps {
  dataSource: DataSourceDefinition
}

export function DataSourcePreview({ dataSource }: DataSourcePreviewProps) {
  const allRecords = getMockRecordsForEntity(dataSource.entityId)
  const filtered = evaluateMockFilter(allRecords, dataSource.filters)
  const entity = dataSource.entityId ? getMockEntityById(dataSource.entityId) : undefined
  const previewFields = (entity?.fields.filter(f => !f.isSystem) ?? []).slice(0, 3)
  const previewRecords = filtered.slice(0, 3)

  return (
    <div style={{ fontSize: '11.5px' }}>
      <div style={{ marginBottom: '6px', color: 'var(--text-muted)' }}>
        {filtered.length} record{filtered.length !== 1 ? 's' : ''} match
      </div>
      {previewFields.length > 0 && previewRecords.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${previewFields.length}, 1fr)`,
            background: 'var(--bg-sunken)',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}>
            {previewFields.map(f => (
              <div key={f.id} style={{ padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.label}
              </div>
            ))}
          </div>
          {previewRecords.map((rec, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${previewFields.length}, 1fr)`,
                borderBottom: i < previewRecords.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              {previewFields.map(f => {
                const val = rec[f.fieldCode]
                return (
                  <div key={f.id} style={{ padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {val !== undefined && val !== null ? String(val) : '—'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)' }}>No matching records</div>
      )}
    </div>
  )
}
