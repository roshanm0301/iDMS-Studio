import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_SALE_ORDERS } from '../../../mocks/ui-studio/mockSampleRecords'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import { pruneByRole } from './mockPermissionPruner'
import { renderFieldValue } from './fieldRenderer'
import type { ViewArtifact, PreviewContext, RuleEffect } from '../../../types/ui-studio/index'

interface RecordDetailSurfaceRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
  ruleMap: Map<string, RuleEffect>
}

function getSampleRecord(entityId: string | undefined, recordId: string): Record<string, unknown> | undefined {
  if (entityId === 'entity-customer') {
    const arr = MOCK_CUSTOMERS as unknown as Record<string, unknown>[]
    return recordId ? arr.find(r => r['id'] === recordId) ?? arr[0] : arr[0]
  }
  if (entityId === 'entity-product') {
    const arr = MOCK_PRODUCTS as unknown as Record<string, unknown>[]
    return recordId ? arr.find(r => r['id'] === recordId) ?? arr[0] : arr[0]
  }
  if (entityId === 'entity-saleorder') {
    const arr = MOCK_SALE_ORDERS as unknown as Record<string, unknown>[]
    return recordId ? arr.find(r => r['id'] === recordId) ?? arr[0] : arr[0]
  }
  return undefined
}

export function RecordDetailSurfaceRenderer({ artifact, previewContext, ruleMap }: RecordDetailSurfaceRendererProps) {
  const entity = artifact.primaryEntityId ? getMockEntityById(artifact.primaryEntityId) : undefined
  const allComponents = artifact.components.filter(c => !c.componentType.endsWith('_column'))
  const components = pruneByRole(allComponents, ruleMap)
  const record = getSampleRecord(artifact.primaryEntityId, previewContext.sampleRecordId)

  function getFieldCode(fieldId: string | undefined): string {
    if (!fieldId) return ''
    if (entity) {
      const field = entity.fields.find(f => f.id === fieldId)
      if (field) return field.fieldCode
    }
    return fieldId
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {components.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>
            No fields configured.
          </div>
        ) : (
          components.map(comp => {
            const fieldCode = getFieldCode(comp.fieldId)
            const rawValue = record ? record[fieldCode] : undefined
            const widgetType = (comp.config?.renderer as string | undefined) ?? comp.componentType
            const displayValue = renderFieldValue(rawValue, widgetType)
            return (
              <div key={comp.id} style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '120px', flexShrink: 0 }}>
                  {comp.label ?? comp.fieldId}
                </span>
                <span style={{ fontSize: '12.5px' }}>{displayValue}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
