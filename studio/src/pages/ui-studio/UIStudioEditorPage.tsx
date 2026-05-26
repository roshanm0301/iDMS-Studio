import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useViewQuery, useSaveViewMutation } from '../../hooks/ui-studio/useUIStudioViewsQuery'
import { useUIStudioEditorStore } from '../../hooks/ui-studio/useUIStudioEditorStore'
import { EditorToolbar } from '../../components/ui-studio/builder/EditorToolbar'
import { EditorCanvas } from '../../components/ui-studio/builder/EditorCanvas'
import { SurfaceConfigPanel } from '../../components/ui-studio/palette/SurfaceConfigPanel'
import { SmartCRUDPanel } from '../../components/ui-studio/smart-crud/SmartCRUDPanel'
import type { ViewSurfaceType, ViewContextContract, ViewArtifact } from '../../types/ui-studio/index'

type LeftTab = 'surface' | 'tools'

export function UIStudioEditorPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const navigate = useNavigate()

  const { data: loadedArtifact, isLoading, isError } = useViewQuery(viewId)
  const saveMutation = useSaveViewMutation()

  const { artifact, isDirty, setArtifact, updateArtifact, clearDirty, reset } = useUIStudioEditorStore()
  const [leftTab, setLeftTab] = useState<LeftTab>('surface')

  // Sync loaded artifact into editor store
  useEffect(() => {
    if (loadedArtifact) {
      setArtifact(loadedArtifact)
    }
    return () => { reset() }
  }, [loadedArtifact, setArtifact, reset])

  // Warn on navigation away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault() }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  async function handleSave() {
    if (!artifact || !viewId) return
    try {
      await saveMutation.mutateAsync({ viewId, artifact })
      clearDirty()
    } catch {
      // Save failed — toolbar shows unsaved state, user can retry
    }
  }

  function handlePreview() {
    if (viewId) navigate(`/admin/ui-studio/preview/${viewId}`)
  }

  function handleChangeSurface(newType: ViewSurfaceType) {
    updateArtifact({
      surfaceType: newType,
      layout: { containers: [] },
      components: [],
      actions: [],
      contextContract: {},
      transactionConfig: undefined,
      scaffoldApplied: false,
    })
  }

  function handleUpdateContextContract(patch: Partial<ViewContextContract>) {
    const current = artifact?.contextContract ?? {}
    updateArtifact({ contextContract: { ...current, ...patch } })
  }

  function handleCanvasUpdate(patch: Partial<ViewArtifact>) {
    updateArtifact(patch)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading view…
      </div>
    )
  }

  if (isError || (!isLoading && !loadedArtifact)) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <AlertCircle size={32} style={{ color: 'var(--red)' }} />
        <p className="empty-title">View not found</p>
        <p className="empty-desc">The view could not be loaded. It may have been deleted.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/ui-studio')}>
          Back to UI Studio
        </button>
      </div>
    )
  }

  if (!artifact) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <EditorToolbar
        artifact={artifact}
        isDirty={isDirty}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
        onPreview={handlePreview}
      />

      {/* 3-panel body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{
          width: '288px', flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--panel)',
          overflow: 'hidden',
        }}>
          {/* Left panel tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-elev)' }}>
            {(['surface', 'tools'] as LeftTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                style={{
                  flex: 1, padding: '9px 12px', fontSize: '12.5px', border: 'none',
                  cursor: 'pointer', background: 'transparent',
                  fontWeight: leftTab === tab ? 600 : 400,
                  color: leftTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: leftTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {tab === 'surface' ? 'Surface' : 'Tools'}
              </button>
            ))}
          </div>

          {/* Left panel content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {leftTab === 'surface' && (
              <SurfaceConfigPanel
                artifact={artifact}
                onChangeSurface={handleChangeSurface}
                onUpdateContextContract={handleUpdateContextContract}
              />
            )}
            {leftTab === 'tools' && (
              <SmartCRUDPanel
                artifact={artifact}
                onApplyScaffold={patch => updateArtifact(patch)}
              />
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <EditorCanvas artifact={artifact} onUpdate={handleCanvasUpdate} />
        </div>

        {/* Right panel — inspector (placeholder for M5+) */}
        <div style={{
          width: '256px', flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--panel)',
          overflow: 'hidden',
        }}>
          <div className="panel-header">
            <span className="panel-title">Inspector</span>
          </div>
          <div className="panel-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Surface</div>
                <div>{artifact.surfaceType.replace(/_/g, ' ')}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Entity</div>
                <div>{artifact.primaryEntityId ?? '—'}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Components</div>
                <div>{artifact.components.length}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Version</div>
                <div>v{artifact.version}</div>
              </div>
              {artifact.scaffoldApplied && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'var(--green-soft)', borderRadius: 'var(--radius-sm)', color: 'var(--green)', fontSize: '11.5px' }}>
                  Smart defaults applied
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', fontSize: '11.5px', color: 'var(--text-subtle)' }}>
              Field and component inspector available in M5.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
