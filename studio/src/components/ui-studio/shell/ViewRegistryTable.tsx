import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Copy, Trash2 } from 'lucide-react'
import { ViewStatusBadge } from '../common/ViewStatusBadge'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import { SURFACE_LABELS } from './viewRegistryTypes'
import type { ViewSummary } from '../../../types/ui-studio/index'
import type { SortField, SortDir } from './viewRegistryTypes'

function entityLabel(id?: string): string {
  if (!id) return '—'
  return MOCK_ENTITIES.find(e => e.id === id)?.label ?? id
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface SortHeaderProps {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}

function SortHeader({ label, field, sortField, sortDir, onSort }: SortHeaderProps) {
  const active = sortField === field
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {active
          ? sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
          : <ArrowUpDown size={11} style={{ opacity: 0.4 }} />
        }
      </span>
    </th>
  )
}

interface ViewRegistryTableProps {
  views: ViewSummary[]
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  onOpen: (view: ViewSummary) => void
  onDuplicate: (view: ViewSummary) => void
  onDelete: (view: ViewSummary) => void
}

export function ViewRegistryTable({
  views, sortField, sortDir, onSort, onOpen, onDuplicate, onDelete,
}: ViewRegistryTableProps) {
  if (views.length === 0) return null

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            <SortHeader label="Label / Key" field="label" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Surface" field="surfaceType" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Entity" field="primaryEntityId" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th style={{ whiteSpace: 'nowrap' }}>Ver.</th>
            <SortHeader label="Modified" field="updatedAt" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th />
          </tr>
        </thead>
        <tbody>
          {views.map(view => (
            <tr key={view.id} onClick={() => onOpen(view)}>
              <td>
                <div style={{ fontWeight: 500 }}>{view.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {view.viewKey}
                </div>
              </td>
              <td>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px', borderRadius: '4px',
                  fontSize: '11.5px', fontWeight: 500,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {SURFACE_LABELS[view.surfaceType]}
                </span>
              </td>
              <td style={{ color: view.primaryEntityId ? 'var(--text)' : 'var(--text-subtle)', fontSize: '13px' }}>
                {entityLabel(view.primaryEntityId)}
              </td>
              <td><ViewStatusBadge status={view.status} /></td>
              <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>v{view.version}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                {formatDate(view.updatedAt)}
              </td>
              <td onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Open in editor"
                    onClick={() => onOpen(view)}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Duplicate as draft"
                    onClick={() => onDuplicate(view)}
                  >
                    <Copy size={13} />
                  </button>
                  {view.status !== 'published' && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Delete draft"
                      onClick={() => onDelete(view)}
                      style={{ color: 'var(--red)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
