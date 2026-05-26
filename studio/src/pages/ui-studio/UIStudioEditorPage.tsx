import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

// M0 placeholder — full implementation begins M2 onwards (builder milestones)
export function UIStudioEditorPage() {
  const navigate = useNavigate()
  const { viewId } = useParams<{ viewId: string }>()

  return (
    <div style={{ padding: '24px', maxWidth: '1400px' }}>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/ui-studio')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">View Editor</h1>
            <p className="page-sub" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{viewId}</p>
          </div>
        </div>
      </div>

      <div className="empty">
        <p className="empty-title">View Builder</p>
        <p className="empty-desc">Builder panels arrive in M2–M9. Runtime preview in M18–M20.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/ui-studio')}>
          Back to UI Studio
        </button>
      </div>
    </div>
  )
}
