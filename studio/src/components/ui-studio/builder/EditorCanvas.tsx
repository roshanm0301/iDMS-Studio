import { TransactionCanvas } from '../transaction/TransactionCanvas'
import { GridPreview } from '../palette/GridPreview'
import { LayoutCanvas } from './LayoutCanvas'
import { SURFACE_META } from '../palette/surfaceMetadata'
import type { ViewArtifact } from '../../../types/ui-studio/index'

interface EditorCanvasProps {
  artifact: ViewArtifact
  onUpdate: (patch: Partial<ViewArtifact>) => void
}

function ScaffoldedFormCanvas({ artifact }: { artifact: ViewArtifact }) {
  const sections = artifact.layout.containers
  const allComponents = artifact.components
  if (sections.length === 0) return null
  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      {sections.map(section => {
        const sectionComponents = allComponents.filter(c => section.fieldIds.includes(c.fieldId ?? ''))
        return (
          <div key={section.id} style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              {section.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {sectionComponents.map(c => (
                <div key={c.id} className="form-field">
                  <label className="form-label">{c.label}{(c.config as Record<string, unknown>)['required'] ? ' *' : ''}</label>
                  <div className="form-input" style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center' }}>
                    {c.componentType.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        {artifact.actions.filter(a => a.placement === 'form_footer').map(a => (
          <button key={a.id} className={`btn ${(a.config as Record<string, unknown>)['primary'] ? 'btn-primary' : 'btn-secondary'}`} style={{ pointerEvents: 'none' }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function GenericCanvas({ artifact }: { artifact: ViewArtifact }) {
  const meta = SURFACE_META[artifact.surfaceType]
  const hasComponents = artifact.components.length > 0
  const hasContainers = artifact.layout.containers.length > 0
  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      {!hasComponents && !hasContainers ? (
        <div className="empty">
          <p className="empty-title">{meta.label}</p>
          <p className="empty-desc">{meta.description}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Use the left panel to configure this surface.</p>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          {hasContainers && (
            <LayoutCanvas layout={artifact.layout} entityId={artifact.primaryEntityId} />
          )}
          {hasComponents && !hasContainers && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              {artifact.components.length} component(s) configured
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EditorCanvas({ artifact, onUpdate }: EditorCanvasProps) {
  if (artifact.surfaceType === 'transaction_workspace') {
    return <TransactionCanvas artifact={artifact} onUpdate={onUpdate} />
  }
  if (artifact.surfaceType === 'list') {
    return <GridPreview artifact={artifact} />
  }
  if (artifact.surfaceType === 'create_edit' && artifact.scaffoldApplied) {
    return <ScaffoldedFormCanvas artifact={artifact} />
  }
  return <GenericCanvas artifact={artifact} />
}

