import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// M0 placeholder — full implementation in M1 (View Registry) + M2 (Typed Surface Designer)
export function UIStudioNewViewPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/ui-studio')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">New View</h1>
            <p className="page-sub">Create a new view draft</p>
          </div>
        </div>
      </div>

      <div className="empty">
        <p className="empty-title">New View Wizard</p>
        <p className="empty-desc">Full implementation arrives in M1 (View Registry) and M2 (Typed Surface Designer).</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/ui-studio')}>
          Back to UI Studio
        </button>
      </div>
    </div>
  )
}
