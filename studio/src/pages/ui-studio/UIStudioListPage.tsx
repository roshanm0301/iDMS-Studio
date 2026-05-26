import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Plus, Search, AlertCircle, X } from 'lucide-react'
import { useViewListQuery, useCreateViewMutation } from '../../hooks/ui-studio/useUIStudioViewsQuery'
import { ViewStatusBadge } from '../../components/ui-studio/common/ViewStatusBadge'
import { ViewRegistryTable } from '../../components/ui-studio/shell/ViewRegistryTable'
import { SURFACE_LABELS } from '../../components/ui-studio/shell/viewRegistryTypes'
import { CreateViewDraftDialog } from '../../components/ui-studio/shell/CreateViewDraftDialog'
import { MOCK_ENTITIES } from '../../mocks/ui-studio/mockEntityMetadata'
import type { ViewSummary, ViewStatus, ViewSurfaceType } from '../../types/ui-studio/index'
import type { SortField, SortDir } from '../../components/ui-studio/shell/viewRegistryTypes'

const ALL_STATUSES: ViewStatus[] = ['draft', 'published', 'needs_attention']
const ALL_SURFACES: ViewSurfaceType[] = ['list', 'record_detail', 'create_edit', 'related_records', 'transaction_workspace', 'dashboard_summary']

export function UIStudioListPage() {
  const navigate = useNavigate()
  const { data: views = [], isLoading, isError } = useViewListQuery()
  const createMutation = useCreateViewMutation()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ViewStatus | ''>('')
  const [filterSurface, setFilterSurface] = useState<ViewSurfaceType | ''>('')
  const [filterEntity, setFilterEntity] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ViewSummary | null>(null)

  const hasFilters = !!(search || filterStatus || filterSurface || filterEntity)

  function clearFilters() {
    setSearch(''); setFilterStatus(''); setFilterSurface(''); setFilterEntity('')
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function handleOpen(view: ViewSummary) {
    navigate(`/admin/ui-studio/editor/${view.id}`)
  }

  async function handleDuplicate(view: ViewSummary) {
    const label = `${view.label} (Copy)`
    const baseKey = view.viewKey.slice(0, 70)
    const viewKey = `${baseKey}_copy_${Date.now().toString(36).slice(-4)}`
    await createMutation.mutateAsync({
      viewKey,
      label,
      surfaceType: view.surfaceType,
      primaryEntityId: view.primaryEntityId,
      description: view.description,
    })
  }

  async function handleDelete(view: ViewSummary) {
    setDeleteTarget(view)
  }

  const filtered = useMemo(() => {
    let list = views
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(v =>
      v.label.toLowerCase().includes(q) ||
      v.viewKey.toLowerCase().includes(q) ||
      (v.primaryEntityId && MOCK_ENTITIES.find(e => e.id === v.primaryEntityId)?.label.toLowerCase().includes(q))
    )
    if (filterStatus) list = list.filter(v => v.status === filterStatus)
    if (filterSurface) list = list.filter(v => v.surfaceType === filterSurface)
    if (filterEntity) list = list.filter(v => v.primaryEntityId === filterEntity)
    list = [...list].sort((a, b) => {
      let av: string = String(a[sortField] ?? '')
      let bv: string = String(b[sortField] ?? '')
      if (sortField === 'primaryEntityId') {
        av = MOCK_ENTITIES.find(e => e.id === a.primaryEntityId)?.label ?? ''
        bv = MOCK_ENTITIES.find(e => e.id === b.primaryEntityId)?.label ?? ''
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return list
  }, [views, search, filterStatus, filterSurface, filterEntity, sortField, sortDir])

  // Summary counts per surface type
  const surfaceCounts = useMemo(() =>
    ALL_SURFACES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = views.filter(v => v.surfaceType === s).length
      return acc
    }, {}),
    [views]
  )

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading views…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <AlertCircle size={32} style={{ color: 'var(--red)' }} />
        <p className="empty-title">Failed to load views</p>
        <p className="empty-desc">Check the mock repository and try again.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">UI Studio</h1>
            <p className="page-sub">Design and publish application views, forms, and workspaces</p>
          </div>
          <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> New View
          </button>
        </div>
      </div>

      {/* Surface summary chips */}
      {views.length > 0 && (
        <div className="list-toolbar" style={{ gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`filter-chip ${!filterSurface ? 'active' : ''}`}
            onClick={() => setFilterSurface('')}
          >
            All <span style={{ fontWeight: 600 }}>{views.length}</span>
          </button>
          {ALL_SURFACES.filter(s => (surfaceCounts[s] ?? 0) > 0).map(s => (
            <button
              key={s}
              className={`filter-chip ${filterSurface === s ? 'active' : ''}`}
              onClick={() => setFilterSurface(filterSurface === s ? '' : s)}
            >
              {SURFACE_LABELS[s]} <span style={{ fontWeight: 600 }}>{surfaceCounts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="list-toolbar" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '30px', height: '32px' }}
            placeholder="Search views…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', height: '32px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ViewStatus | '')}
        >
          <option value="">All Status</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s === 'needs_attention' ? 'Needs Attention' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', height: '32px' }}
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
        >
          <option value="">All Entities</option>
          {MOCK_ENTITIES.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>

        <div className="spacer" />

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px' }}>
        {/* Result count */}
        {views.length > 0 && (
          <div style={{ marginBottom: '12px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'view' : 'views'}
            {hasFilters && ` (filtered from ${views.length})`}
          </div>
        )}

        {/* Status summary for filtered results */}
        {!hasFilters && views.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {ALL_STATUSES.filter(s => views.some(v => v.status === s)).map(s => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <ViewStatusBadge status={s} />
                <span>{views.filter(v => v.status === s).length}</span>
              </span>
            ))}
          </div>
        )}

        {/* Empty: no views at all */}
        {views.length === 0 && (
          <div className="empty" style={{ marginTop: '80px' }}>
            <div className="empty-icon"><Layers size={32} /></div>
            <p className="empty-title">No views yet</p>
            <p className="empty-desc">Create your first view to start building UI for your entities.</p>
            <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
              <Plus size={14} /> Create First View
            </button>
          </div>
        )}

        {/* Empty: filter has no results */}
        {views.length > 0 && filtered.length === 0 && (
          <div className="empty" style={{ marginTop: '40px' }}>
            <p className="empty-title">No views match your filters</p>
            <p className="empty-desc">Try clearing the search or adjusting filters.</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <ViewRegistryTable
            views={filtered}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onOpen={handleOpen}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create dialog */}
      <CreateViewDraftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={id => navigate(`/admin/ui-studio/editor/${id}`)}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px', width: '400px',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Delete draft?</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <strong>{deleteTarget.label}</strong> will be permanently deleted. Published views cannot be deleted.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  // In mock: just remove from query cache via invalidation after repo delete
                  // Full delete support tracked in repository interface extension
                  setDeleteTarget(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
