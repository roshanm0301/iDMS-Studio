import { useState } from 'react'
import { ArrowLeft, Monitor, Tablet, Smartphone } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useViewQuery } from '../../hooks/ui-studio/useUIStudioViewsQuery'
import { RuntimeRenderer } from '../../lib/ui-studio/renderer/RuntimeRenderer'
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_SALE_ORDERS } from '../../mocks/ui-studio/mockSampleRecords'
import type { PreviewContext } from '../../types/ui-studio/index'

function getMockRecords(entityId: string | undefined): Array<{ id: string; label: string }> {
  if (entityId === 'entity-customer') return MOCK_CUSTOMERS.map(r => ({ id: r.id, label: r.customerName }))
  if (entityId === 'entity-product') return MOCK_PRODUCTS.map(r => ({ id: r.id, label: r.productName }))
  if (entityId === 'entity-saleorder') return MOCK_SALE_ORDERS.map(r => ({ id: r.id, label: r.orderNumber }))
  return []
}

const DEVICE_WIDTHS: Record<PreviewContext['device'], string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const DEVICE_ICONS: Record<PreviewContext['device'], React.ReactNode> = {
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
  mobile: <Smartphone size={14} />,
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '3px',
  display: 'block',
}

const fieldStyle: React.CSSProperties = { marginBottom: '10px' }

export function UIStudioRuntimePreviewPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const navigate = useNavigate()
  const { data: artifact, isLoading } = useViewQuery(viewId)
  const [previewCtx, setPreviewCtx] = useState<PreviewContext>({
    role: 'Admin',
    device: 'desktop',
    workflowState: '',
    sampleRecordId: '',
  })

  function patch(updates: Partial<PreviewContext>) {
    setPreviewCtx(prev => ({ ...prev, ...updates }))
  }

  const workflowStates = artifact?.workflowConfig?.states ?? []
  const mockRecords = getMockRecords(artifact?.primaryEntityId)
  const deviceWidth = DEVICE_WIDTHS[previewCtx.device]

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elev)', flexShrink: 0,
      }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate(`/admin/ui-studio/editor/${viewId}`)}
          type="button"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{artifact?.label ?? viewId}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {viewId}
          </div>
        </div>
        <span className="tag blue">Runtime Preview</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {DEVICE_ICONS[previewCtx.device]}
          {deviceWidth}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar — context panel */}
        <div style={{
          width: '240px', flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: '16px',
          background: 'var(--panel)',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Preview Context
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Role</label>
            <select
              className="form-select"
              style={{ fontSize: '12px', width: '100%' }}
              value={previewCtx.role}
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
              value={previewCtx.device}
              onChange={e => patch({ device: e.target.value as PreviewContext['device'] })}
            >
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet (768px)</option>
              <option value="mobile">Mobile (375px)</option>
            </select>
          </div>

          {workflowStates.length > 0 && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Workflow State</label>
              <select
                className="form-select"
                style={{ fontSize: '12px', width: '100%' }}
                value={previewCtx.workflowState}
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
                value={previewCtx.sampleRecordId}
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

        {/* Main area */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: deviceWidth, maxWidth: '100%' }}>
            {artifact ? (
              <div style={{
                background: 'var(--bg-elev)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                padding: '16px',
              }}>
                <RuntimeRenderer artifact={artifact} previewContext={previewCtx} />
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '32px' }}>
                View not found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
