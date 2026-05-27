import { RotateCcw } from 'lucide-react'
import { useViewVersionsQuery, useRollbackViewMutation } from '../../../hooks/ui-studio/useUIStudioViewsQuery'
import { useUIStudioEditorStore } from '../../../hooks/ui-studio/useUIStudioEditorStore'
import { useQueryClient } from '@tanstack/react-query'

interface VersionHistoryPanelProps {
  viewId: string
}

export function VersionHistoryPanel({ viewId }: VersionHistoryPanelProps) {
  const { data: versions, isLoading } = useViewVersionsQuery(viewId)
  const rollbackMutation = useRollbackViewMutation()
  const { reset } = useUIStudioEditorStore()
  const qc = useQueryClient()

  async function handleRestore(versionId: string) {
    try {
      await rollbackMutation.mutateAsync({ viewId, versionId })
      reset()
      void qc.invalidateQueries({ queryKey: ['ui-studio', 'views', viewId] })
    } catch {
      // Silently handle error — UI stays stable
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Version History
      </div>

      {isLoading ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading versions…</div>
      ) : !versions || versions.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No published versions yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {versions.map(v => (
            <div key={v.versionId} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 8px',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--accent)' }}>
                v{v.version}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11.5px' }}>{v.label}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {new Date(v.publishedAt).toLocaleDateString()} · {v.publishedBy}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => handleRestore(v.versionId)}
                disabled={rollbackMutation.isPending}
                title="Restore this version"
                type="button"
              >
                <RotateCcw size={11} />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
