import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import { MOCK_CUSTOMERS } from '../../../mocks/ui-studio/mockSampleRecords'
import { MOCK_PRODUCTS } from '../../../mocks/ui-studio/mockSampleRecords'
import { MOCK_SALE_ORDERS } from '../../../mocks/ui-studio/mockSampleRecords'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact } from '../../../types/ui-studio/index'

type DataRecord = Record<string, unknown>

function getMockData(entityId: string | undefined): DataRecord[] {
  if (entityId === 'entity-customer') return MOCK_CUSTOMERS as DataRecord[]
  if (entityId === 'entity-product') return MOCK_PRODUCTS as DataRecord[]
  if (entityId === 'entity-saleorder') return MOCK_SALE_ORDERS as DataRecord[]
  return []
}

function renderCellValue(value: unknown, renderer: string): string {
  if (value === null || value === undefined) return '—'
  if (renderer === 'currency') {
    const num = Number(value)
    return isNaN(num) ? String(value) : `₹${num.toLocaleString('en-IN')}`
  }
  if (renderer === 'boolean') return value ? 'Yes' : 'No'
  if (renderer === 'date') return String(value).slice(0, 10)
  return String(value)
}

interface GridPreviewProps {
  artifact: ViewArtifact
}

export function GridPreview({ artifact }: GridPreviewProps) {
  const columns = artifact.components.filter(c => c.componentType.endsWith('_column'))
  const data = getMockData(artifact.primaryEntityId)
  const entity = MOCK_ENTITIES.find(e => e.id === artifact.primaryEntityId)

  const helper = createColumnHelper<DataRecord>()

  const tableColumns = columns.map(col => {
    const field = entity?.fields.find(f => f.id === col.fieldId)
    const renderer = (col.config as Record<string, unknown>)['renderer'] as string ?? 'text'
    return helper.accessor(
      (row) => field ? row[field.fieldCode] : row[col.fieldId ?? ''],
      {
        id: col.id,
        header: col.label ?? col.fieldId ?? col.id,
        cell: info => renderCellValue(info.getValue(), renderer),
      }
    )
  })

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (columns.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        No columns configured.
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', overflowX: 'auto' }}>
      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Preview — {entity?.pluralLabel ?? 'Records'} ({data.length} rows, {columns.length} columns)
      </div>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} style={{ background: 'var(--bg-elev)' }}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
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
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIdx) => (
            <tr
              key={row.id}
              style={{ background: rowIdx % 2 === 0 ? 'var(--bg)' : 'var(--bg-sunken)' }}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '12px',
                    color: 'var(--text)',
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext()) as string}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
