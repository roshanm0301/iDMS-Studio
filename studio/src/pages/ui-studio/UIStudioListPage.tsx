import { Layers, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// M0 placeholder — full implementation in M1 (View Registry milestone)
export function UIStudioListPage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">UI Studio</h1>
          <p className="page-sub">Design and manage application views, forms, and workspaces</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/ui-studio/new')}
        >
          <Plus size={15} />
          New View
        </button>
      </div>

      <div className="empty" style={{ marginTop: '80px' }}>
        <div className="empty-icon">
          <Layers size={32} />
        </div>
        <p className="empty-title">UI Studio — Coming Soon</p>
        <p className="empty-desc">
          View registry and builder will be available in M1. This placeholder confirms routing is wired correctly.
        </p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/ui-studio/new')}>
          Create First View
        </button>
      </div>
    </div>
  )
}
