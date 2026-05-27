import { MOCK_SALE_ORDER_LINES, MOCK_SALE_ORDERS } from '../../../mocks/ui-studio/mockSampleRecords'
import { renderFieldValue } from './fieldRenderer'
import type { ViewArtifact, PreviewContext, RuleEffect } from '../../../types/ui-studio/index'

interface TransactionWorkspaceSurfaceRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
  ruleMap: Map<string, RuleEffect>
}

export function TransactionWorkspaceSurfaceRenderer({ artifact }: TransactionWorkspaceSurfaceRendererProps) {
  const tc = artifact.transactionConfig
  const headerRecord = MOCK_SALE_ORDERS[0] as Record<string, unknown>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Section */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px', background: 'var(--bg-elev)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
          Header
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {(tc?.headerFieldIds ?? []).length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No header fields configured</div>
          ) : (
            (tc?.headerFieldIds ?? []).map(fieldId => {
              const value = headerRecord[fieldId.replace('f-so-', '').replace(/-/g, '')] ?? headerRecord[fieldId]
              return (
                <div key={fieldId} style={{ minWidth: '140px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {fieldId}
                  </div>
                  <input
                    type="text"
                    className="input"
                    defaultValue={renderFieldValue(value, 'text')}
                    style={{ width: '100%', fontSize: '12px' }}
                    readOnly
                  />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Line Grid */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px', background: 'var(--bg-elev)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
          Lines
        </div>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {(tc?.lineColumns ?? []).map(col => (
                <th key={col.fieldId} style={{
                  padding: '6px 10px', textAlign: 'left', fontSize: '11.5px',
                  fontWeight: 600, color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-sunken)',
                }}>
                  {col.label ?? col.fieldId}
                  {col.editable && (
                    <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--accent)' }}>✏</span>
                  )}
                </th>
              ))}
              {(tc?.lineColumns ?? []).length === 0 && (
                <th style={{ padding: '6px 10px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  No columns configured
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {MOCK_SALE_ORDER_LINES.map((line, rowIdx) => {
              const record = line as Record<string, unknown>
              return (
                <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                  {(tc?.lineColumns ?? []).map(col => {
                    const fieldCode = col.fieldId.replace('f-sol-', '').replace(/-/g, '')
                    const value = record[fieldCode] ?? record[col.fieldId]
                    return (
                      <td key={col.fieldId} style={{ padding: '6px 10px', fontSize: '12px' }}>
                        {renderFieldValue(value, 'text')}
                      </td>
                    )
                  })}
                  {(tc?.lineColumns ?? []).length === 0 && <td />}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      {tc?.totalsEnabled && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '16px',
          padding: '10px', background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
        }}>
          {(['subTotal', 'taxAmount', 'totalAmount'] as const).map(key => (
            <div key={key} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{key}</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                {renderFieldValue(MOCK_SALE_ORDERS[0][key], 'currency')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
