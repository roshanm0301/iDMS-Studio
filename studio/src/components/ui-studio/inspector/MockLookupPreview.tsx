import { MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../../../mocks/ui-studio/mockSampleRecords'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'

interface MockLookupPreviewProps {
  targetEntityId: string
  displayFieldId: string
  pickerColumnIds: string[]
}

export function MockLookupPreview({ targetEntityId, displayFieldId, pickerColumnIds }: MockLookupPreviewProps) {
  let records: Record<string, unknown>[] = []
  if (targetEntityId === 'entity-customer') {
    records = MOCK_CUSTOMERS as Record<string, unknown>[]
  } else if (targetEntityId === 'entity-product') {
    records = MOCK_PRODUCTS as Record<string, unknown>[]
  }

  const entity = getMockEntityById(targetEntityId)
  const displayField = entity?.fields.find(f => f.id === displayFieldId)
  const pickerColumns = (pickerColumnIds ?? [])
    .map(id => entity?.fields.find(f => f.id === id))
    .filter(Boolean)

  const columnsToShow = displayField
    ? [displayField, ...pickerColumns.filter(c => c!.id !== displayField.id)]
    : pickerColumns

  if (records.length === 0 || columnsToShow.length === 0) {
    return (
      <div style={{
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px',
        fontSize: '11.5px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        No preview available. Configure the lookup options above to see a preview.
      </div>
    )
  }

  const previewRecords = records.slice(0, 3)

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      maxHeight: '200px',
      overflow: 'auto',
      fontSize: '11.5px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsToShow.length}, 1fr)`,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-sunken)',
        fontWeight: 600,
        color: 'var(--text-muted)',
      }}>
        {columnsToShow.map(col => (
          <div key={col!.id} style={{ padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {col!.label}
          </div>
        ))}
      </div>
      {previewRecords.map((rec, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsToShow.length}, 1fr)`,
            borderBottom: i < previewRecords.length - 1 ? '1px solid var(--border)' : undefined,
          }}
        >
          {columnsToShow.map(col => {
            const val = rec[col!.fieldCode]
            return (
              <div key={col!.id} style={{ padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {val !== undefined && val !== null ? String(val) : '—'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
