import { useUIStudioEditorStore } from '../../../hooks/ui-studio/useUIStudioEditorStore'
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_SALE_ORDERS } from '../../../mocks/ui-studio/mockSampleRecords'
import type { PreviewContext } from '../../../types/ui-studio/index'

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '3px',
  display: 'block',
}

const fieldStyle: React.CSSProperties = { marginBottom: '8px' }

function getMockRecordsForEntity(entityId: string | undefined): Array<{ id: string; label: string }> {
  if (!entityId) return []
  if (entityId === 'entity-customer') {
    return MOCK_CUSTOMERS.map(r => ({ id: r.id, label: r.customerName }))
  }
  if (entityId === 'entity-product') {
    return MOCK_PRODUCTS.map(r => ({ id: r.id, label: r.productName }))
  }
  if (entityId === 'entity-saleorder') {
    return MOCK_SALE_ORDERS.map(r => ({ id: r.id, label: r.orderNumber }))
  }
  return []
}

export function PreviewContextPanel() {
  const { previewContext, setPreviewContext, artifact } = useUIStudioEditorStore()
  const workflowStates = artifact?.workflowConfig?.states ?? []
  const mockRecords = getMockRecordsForEntity(artifact?.primaryEntityId)

  function patch(updates: Partial<PreviewContext>) {
    setPreviewContext(updates)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        Preview Context
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Role</label>
        <select
          className="form-select"
          style={{ fontSize: '12px', width: '100%' }}
          value={previewContext.role}
          onChange={e => patch({ role: e.target.value as PreviewContext['role'] })}
        >
          <option value="Admin">Admin</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Device</label>
        <select
          className="form-select"
          style={{ fontSize: '12px', width: '100%' }}
          value={previewContext.device}
          onChange={e => patch({ device: e.target.value as PreviewContext['device'] })}
        >
          <option value="desktop">desktop</option>
          <option value="tablet">tablet</option>
          <option value="mobile">mobile</option>
        </select>
      </div>

      {workflowStates.length > 0 && (
        <div style={fieldStyle}>
          <label style={labelStyle}>Workflow State</label>
          <select
            className="form-select"
            style={{ fontSize: '12px', width: '100%' }}
            value={previewContext.workflowState}
            onChange={e => patch({ workflowState: e.target.value })}
          >
            <option value="">— None —</option>
            {workflowStates.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {mockRecords.length > 0 && (
        <div style={fieldStyle}>
          <label style={labelStyle}>Sample Record</label>
          <select
            className="form-select"
            style={{ fontSize: '12px', width: '100%' }}
            value={previewContext.sampleRecordId}
            onChange={e => patch({ sampleRecordId: e.target.value })}
          >
            <option value="">— None —</option>
            {mockRecords.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
