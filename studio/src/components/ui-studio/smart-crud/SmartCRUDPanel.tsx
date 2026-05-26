import { Wand2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import { SURFACE_META } from '../palette/surfaceMetadata'
import { generateScaffold } from '../../../lib/ui-studio/scaffoldGenerator'
import type { ViewArtifact } from '../../../types/ui-studio/index'

interface SmartCRUDPanelProps {
  artifact: ViewArtifact
  onApplyScaffold: (patch: Partial<ViewArtifact>) => void
}

export function SmartCRUDPanel({ artifact, onApplyScaffold }: SmartCRUDPanelProps) {
  const surfaceMeta = SURFACE_META[artifact.surfaceType]
  const entity = MOCK_ENTITIES.find(e => e.id === artifact.primaryEntityId)
  const canScaffold = surfaceMeta.supportsSmartCRUD && !!entity

  function handleApplyScaffold() {
    if (!entity) return
    const result = generateScaffold(entity, artifact.surfaceType)
    if (!result) return
    onApplyScaffold({
      layout: result.layout,
      components: result.components,
      actions: result.actions,
      scaffoldApplied: true,
    })
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="panel-title">Smart CRUD Scaffold</div>

      {/* Not applicable for this surface type */}
      {!surfaceMeta.supportsSmartCRUD && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-sunken)', fontSize: '12.5px', color: 'var(--text-muted)',
          display: 'flex', gap: '8px',
        }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Smart CRUD scaffold is available for <strong>List</strong> and <strong>Create / Edit Form</strong> surfaces only.
            For transaction documents, use the Transaction Workspace canvas.
          </span>
        </div>
      )}

      {/* No entity selected */}
      {surfaceMeta.supportsSmartCRUD && !entity && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--amber-soft)', fontSize: '12.5px', color: 'var(--amber)',
          display: 'flex', gap: '8px',
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Select a Primary Entity in the view settings to enable scaffold generation.</span>
        </div>
      )}

      {/* Scaffold already applied */}
      {canScaffold && artifact.scaffoldApplied && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--green-soft)', fontSize: '12.5px', color: 'var(--green)',
          display: 'flex', gap: '8px',
        }}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Smart defaults applied from <strong>{entity?.label}</strong>. You can re-generate to reset.</span>
        </div>
      )}

      {/* Scaffold available */}
      {canScaffold && entity && (
        <>
          <div style={{
            padding: '12px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            fontSize: '12.5px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>
              {artifact.scaffoldApplied ? 'Re-generate from entity' : 'Generate from entity'}
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
              Auto-builds {artifact.surfaceType === 'list' ? 'list columns' : 'form sections'} from{' '}
              <strong>{entity.label}</strong> ({entity.fields.filter(f => !f.isSystem && !f.isComputed).length} eligible fields).
            </div>
            {artifact.scaffoldApplied && (
              <p style={{ fontSize: '11.5px', color: 'var(--red)', marginBottom: '8px' }}>
                Re-generating will discard your current layout configuration.
              </p>
            )}
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleApplyScaffold}
            >
              <Wand2 size={13} />
              {artifact.scaffoldApplied ? 'Re-generate Scaffold' : 'Apply Smart Defaults'}
            </button>
          </div>

          {/* Field preview */}
          <div>
            <div className="panel-title" style={{ marginBottom: '6px' }}>
              Fields to be scaffolded ({entity.fields.filter(f => !f.isSystem && !f.isComputed).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {entity.fields
                .filter(f => !f.isSystem && !f.isComputed)
                .slice(0, 8)
                .map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-sunken)', fontSize: '11.5px',
                  }}>
                    <span style={{ fontWeight: f.isRequired ? 600 : 400 }}>{f.label}</span>
                    <span style={{ color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{f.fieldType}</span>
                  </div>
                ))
              }
              {entity.fields.filter(f => !f.isSystem && !f.isComputed).length > 8 && (
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'center', padding: '4px' }}>
                  +{entity.fields.filter(f => !f.isSystem && !f.isComputed).length - 8} more (first 8 scaffolded)
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
