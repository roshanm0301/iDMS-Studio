import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useViewQuery, useSaveViewMutation } from '../../hooks/ui-studio/useUIStudioViewsQuery'
import { useUIStudioEditorStore } from '../../hooks/ui-studio/useUIStudioEditorStore'
import { EditorToolbar } from '../../components/ui-studio/builder/EditorToolbar'
import { EditorCanvas } from '../../components/ui-studio/builder/EditorCanvas'
import { LayoutBuilderPanel } from '../../components/ui-studio/builder/LayoutBuilderPanel'
import { SurfaceConfigPanel } from '../../components/ui-studio/palette/SurfaceConfigPanel'
import { GridConfigurationPanel } from '../../components/ui-studio/palette/GridConfigurationPanel'
import { FormFieldConfigPanel } from '../../components/ui-studio/palette/FormFieldConfigPanel'
import { LineGridConfigPanel } from '../../components/ui-studio/transaction/LineGridConfigPanel'
import { SmartCRUDPanel } from '../../components/ui-studio/smart-crud/SmartCRUDPanel'
import { FieldPicker } from '../../components/ui-studio/common/FieldPicker'
import { LookupConfigPanel } from '../../components/ui-studio/inspector/LookupConfigPanel'
import { DataSourceRegistryPanel } from '../../components/ui-studio/data-binding/DataSourceRegistryPanel'
import { BehaviorRuleListPanel } from '../../components/ui-studio/behavior/BehaviorRuleListPanel'
import { FieldChangeEventListPanel } from '../../components/ui-studio/behavior/FieldChangeEventListPanel'
import { GridCellEventListPanel } from '../../components/ui-studio/behavior/GridCellEventListPanel'
import { ActionRegistryPanel } from '../../components/ui-studio/palette/ActionRegistryPanel'
import { WorkflowStateConfigurator } from '../../components/ui-studio/preview/WorkflowStateConfigurator'
import { VersionHistoryPanel } from '../../components/ui-studio/shell/VersionHistoryPanel'
import { PublishButton } from '../../components/ui-studio/shell/PublishButton'
import { ValidationPanel } from '../../components/ui-studio/validation/ValidationPanel'
import { PreviewContextPanel } from '../../components/ui-studio/preview/PreviewContextPanel'
import { validateArtifact } from '../../lib/ui-studio/validationEngine'
import { MOCK_ENTITIES } from '../../mocks/ui-studio/mockEntityMetadata'
import type { ViewSurfaceType, ViewContextContract, ViewArtifact, WorkflowConfig } from '../../types/ui-studio/index'

type LeftTab = 'surface' | 'tools' | 'behavior'

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

  // Validation summary
  const validationSummary = useMemo(
    () => (artifact ? validateArtifact(artifact) : { errors: [], warnings: [], suggestions: [] }),
    [artifact]
  )

  async function handleSave() {
    if (!artifact || !viewId) return
    try {
      await saveMutation.mutateAsync({ viewId, artifact })
      clearDirty()
    } catch {
      // Save failed — toolbar shows unsaved state, user can retry
    }
  }

  async function handlePreview() {
    if (!viewId) return
    if (isDirty && artifact) {
      try {
        await saveMutation.mutateAsync({ viewId, artifact })
        clearDirty()
      } catch {
        // Save failed — proceed to preview with last saved state
      }
    }
    navigate(`/admin/ui-studio/preview/${viewId}`)
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

  function renderSurfacePanel() {
    if (!artifact) return null
    switch (artifact.surfaceType) {
      case 'list':
        return (
          <GridConfigurationPanel
            artifact={artifact}
            onChange={handleCanvasUpdate}
          />
        )
      case 'create_edit':
        return (
          <FormFieldConfigPanel
            artifact={artifact}
            onChange={handleCanvasUpdate}
          />
        )
      case 'transaction_workspace':
        return (
          <LineGridConfigPanel
            artifact={artifact}
            onChange={handleCanvasUpdate}
          />
        )
      default:
        return (
          <LayoutBuilderPanel
            layout={artifact.layout}
            onChange={layout => handleCanvasUpdate({ layout })}
          />
        )
    }
  }

  // Find the first lookup_widget or entity_ref component for inspector
  const lookupComponent = artifact.components.find(
    c => c.componentType === 'lookup_widget' || c.componentType === 'entity_ref'
  )

  // Check if primary entity supports workflow
  const primaryEntity = artifact.primaryEntityId
    ? MOCK_ENTITIES.find(e => e.id === artifact.primaryEntityId)
    : undefined
  const supportsWorkflow = primaryEntity?.capabilityFlags.supportsWorkflow ?? false

  const LEFT_TABS: LeftTab[] = ['surface', 'tools', 'behavior']
  const LEFT_TAB_LABELS: Record<LeftTab, string> = {
    surface: 'Surface',
    tools: 'Tools',
    behavior: 'Behavior',
  }

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
            {LEFT_TABS.map(tab => (
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
                {LEFT_TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Left panel content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {leftTab === 'surface' && (
              <>
                <SurfaceConfigPanel
                  artifact={artifact}
                  onChangeSurface={handleChangeSurface}
                  onUpdateContextContract={handleUpdateContextContract}
                />
                {renderSurfacePanel()}
              </>
            )}
            {leftTab === 'tools' && (
              <>
                <SmartCRUDPanel
                  artifact={artifact}
                  onApplyScaffold={patch => updateArtifact(patch)}
                />
                <DataSourceRegistryPanel artifact={artifact} onChange={handleCanvasUpdate} />
                <ActionRegistryPanel artifact={artifact} onChange={handleCanvasUpdate} />
              </>
            )}
            {leftTab === 'behavior' && (
              <>
                <BehaviorRuleListPanel artifact={artifact} onChange={handleCanvasUpdate} />
                <FieldChangeEventListPanel artifact={artifact} onChange={handleCanvasUpdate} />
                {artifact.surfaceType === 'transaction_workspace' && (
                  <GridCellEventListPanel artifact={artifact} onChange={handleCanvasUpdate} />
                )}
                {supportsWorkflow && (
                  <WorkflowStateConfigurator
                    config={artifact.workflowConfig}
                    onChange={(config: WorkflowConfig) => handleCanvasUpdate({ workflowConfig: config })}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <EditorCanvas artifact={artifact} onUpdate={handleCanvasUpdate} />
        </div>

        {/* Right panel — inspector */}
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
          <div className="panel-body" style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Validation */}
            <ValidationPanel summary={validationSummary} />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Lookup Config (if applicable) */}
            {lookupComponent && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--text)' }}>
                  Lookup Config
                </div>
                <LookupConfigPanel
                  component={lookupComponent}
                  entityId={artifact.primaryEntityId}
                  onChange={config => {
                    handleCanvasUpdate({
                      components: artifact.components.map(c =>
                        c.id === lookupComponent.id ? { ...c, config: { ...c.config, ...config } } : c
                      ),
                    })
                  }}
                />
              </div>
            )}

            {/* Available Fields */}
            <FieldPicker
              entityId={artifact.primaryEntityId}
              selectedFieldIds={[]}
              onToggle={() => undefined}
              label="Available Fields"
            />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Publish + Version History */}
            <PublishButton
              artifact={artifact}
              viewId={viewId!}
              onPublished={() => { /* clearDirty and refetch handled by mutation */ }}
            />
            <VersionHistoryPanel viewId={viewId!} />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Preview Context */}
            <PreviewContextPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
