import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

// M0 placeholder — full implementation in M18 (Preview) and M20 (Runtime Renderer)
export function UIStudioRuntimePreviewPage() {
  const navigate = useNavigate()
  const { viewId } = useParams<{ viewId: string }>()

  return (
    <div style={{ padding: '24px', maxWidth: '1400px' }}>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/admin/ui-studio/editor/${viewId}`)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">Runtime Preview</h1>
            <p className="page-sub" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{viewId}</p>
          </div>
        </div>
        <span className="tag amber">Mock Preview</span>
      </div>

      <div className="empty">
        <p className="empty-title">Runtime Renderer</p>
        <p className="empty-desc">
          The metadata-driven runtime renderer is built in M20. Preview context simulation arrives in M18.
        </p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/ui-studio')}>
          Back to UI Studio
        </button>
      </div>
    </div>
  )
}
