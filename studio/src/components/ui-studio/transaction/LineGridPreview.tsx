import { MOCK_SALE_ORDER_LINES } from '../../../mocks/ui-studio/mockSampleRecords'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { TransactionLineColumn } from '../../../types/ui-studio/index'

type DataRecord = Record<string, unknown>

function getMockData(lineEntityId: string): DataRecord[] {
  if (lineEntityId === 'entity-saleorderline') return MOCK_SALE_ORDER_LINES as DataRecord[]
  return []
}

interface LineGridPreviewProps {
  lineEntityId: string
  lineColumns: TransactionLineColumn[]
}

export function LineGridPreview({ lineEntityId, lineColumns }: LineGridPreviewProps) {
  const data = getMockData(lineEntityId)
  const entity = MOCK_ENTITIES.find(e => e.id === lineEntityId)

  if (lineColumns.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        No line grid columns configured.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        border: '1px solid var(--border)',
      }}>
        <thead>
          <tr style={{ background: 'var(--bg-elev)' }}>
            {lineColumns.map(col => (
              <th
                key={col.fieldId}
                style={{
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-muted)',
                }}
              >
                {col.label ?? col.fieldId}
                {col.editable && (
                  <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--accent)' }}>✎</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={String(row['id'] ?? rowIdx)}
              style={{ background: rowIdx % 2 === 0 ? 'var(--bg)' : 'var(--bg-sunken)' }}
            >
              {lineColumns.map(col => {
                const field = entity?.fields.find(f => f.id === col.fieldId)
                const value = field ? row[field.fieldCode] : row[col.fieldId]
                return (
                  <td
                    key={col.fieldId}
                    style={{
                      padding: '4px 8px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {col.editable ? (
                      <input
                        type="text"
                        className="input"
                        defaultValue={String(value ?? '')}
                        style={{ fontSize: '12px', height: '24px', padding: '0 6px', width: '100%', minWidth: '60px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {String(value ?? '—')}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
