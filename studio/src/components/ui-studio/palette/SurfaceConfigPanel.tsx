import { useState } from 'react'
import { Lock, RefreshCcw, Info } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { SURFACE_META, CONTEXT_FIELD_LABELS } from './surfaceMetadata'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact, ViewSurfaceType, ViewContextContract } from '../../../types/ui-studio/index'

const SURFACE_OPTIONS: ViewSurfaceType[] = [
  'list', 'record_detail', 'create_edit', 'related_records', 'transaction_workspace', 'dashboard_summary',
]

interface SurfaceConfigPanelProps {
  artifact: ViewArtifact
  onChangeSurface: (newType: ViewSurfaceType) => void
  onUpdateContextContract: (patch: Partial<ViewContextContract>) => void
}

export function SurfaceConfigPanel({ artifact, onChangeSurface, onUpdateContextContract }: SurfaceConfigPanelProps) {
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const [pendingSurface, setPendingSurface] = useState<ViewSurfaceType | null>(null)

  const meta = SURFACE_META[artifact.surfaceType]
  const isPublished = artifact.status === 'published'
  const contract = artifact.contextContract ?? {}

  function handleSurfaceChangeClick() {
    setChangeDialogOpen(true)
  }

  function handleConfirmChange() {
    if (pendingSurface) {
      onChangeSurface(pendingSurface)
      setChangeDialogOpen(false)
      setPendingSurface(null)
    }
  }

  function entityName(id?: string) {
    if (!id) return ''
    return MOCK_ENTITIES.find(e => e.id === id)?.label ?? id
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Surface type display */}
      <div>
        <div className="panel-title" style={{ marginBottom: '8px' }}>Surface Type</div>
        <div style={{
          padding: '12px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{meta.label}</span>
            {isPublished
              ? <span title="Surface type locked after publish" style={{ color: 'var(--text-subtle)' }}><Lock size={13} /></span>
              : (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11.5px' }}
                  onClick={handleSurfaceChangeClick}
                >
                  <RefreshCcw size={11} /> Change
                </button>
              )
            }
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {meta.description}
          </p>
        </div>
      </div>

      {/* Context contract fields */}
      <div>
        <div className="panel-title" style={{ marginBottom: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Context Contract
            <span title="These fields define what runtime context this view requires to render">
              <Info size={11} style={{ color: 'var(--text-subtle)' }} />
            </span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Route Key */}
          <div className="form-field">
            <label className="form-label">{CONTEXT_FIELD_LABELS['routeKey']}</label>
            <input
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
              value={contract.routeKey ?? artifact.viewKey}
              onChange={e => onUpdateContextContract({ routeKey: e.target.value })}
              placeholder={artifact.viewKey}
            />
          </div>

          {/* Record ID Source (for record_detail, create_edit) */}
          {(artifact.surfaceType === 'record_detail' || artifact.surfaceType === 'create_edit') && (
            <div className="form-field">
              <label className="form-label">{CONTEXT_FIELD_LABELS['recordIdSource']}</label>
              <input
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                value={contract.recordIdSource ?? ':id'}
                onChange={e => onUpdateContextContract({ recordIdSource: e.target.value })}
                placeholder=":id"
              />
            </div>
          )}

          {/* Related records: parent entity + relationship */}
          {artifact.surfaceType === 'related_records' && (
            <>
              <div className="form-field">
                <label className="form-label">{CONTEXT_FIELD_LABELS['parentEntityId']}</label>
                <select
                  className="form-select"
                  value={contract.parentEntityId ?? ''}
                  onChange={e => onUpdateContextContract({ parentEntityId: e.target.value || undefined })}
                >
                  <option value="">— Select parent entity —</option>
                  {MOCK_ENTITIES.map(e => (
                    <option key={e.id} value={e.id}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">{CONTEXT_FIELD_LABELS['relationshipName']}</label>
                <input
                  className="form-input"
                  value={contract.relationshipName ?? ''}
                  onChange={e => onUpdateContextContract({ relationshipName: e.target.value || undefined })}
                  placeholder="e.g. saleOrderLines"
                />
              </div>
            </>
          )}

          {/* Transaction workspace: line entity */}
          {artifact.surfaceType === 'transaction_workspace' && (
            <>
              <div className="form-field">
                <label className="form-label">Header Entity</label>
                <input
                  className="form-input"
                  value={entityName(artifact.primaryEntityId)}
                  disabled
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-sunken)' }}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{CONTEXT_FIELD_LABELS['lineEntityId']}</label>
                <select
                  className="form-select"
                  value={contract.lineEntityId ?? ''}
                  onChange={e => onUpdateContextContract({ lineEntityId: e.target.value || undefined })}
                >
                  <option value="">— Select line entity —</option>
                  {MOCK_ENTITIES.filter(e => e.id !== artifact.primaryEntityId).map(e => (
                    <option key={e.id} value={e.id}>{e.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Dashboard: date range */}
          {artifact.surfaceType === 'dashboard_summary' && (
            <div className="form-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={contract.dateRangeContext ?? false}
                  onChange={e => onUpdateContextContract({ dateRangeContext: e.target.checked })}
                />
                {CONTEXT_FIELD_LABELS['dateRangeContext']} — include date range context
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Change surface dialog */}
      <Dialog.Root open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
          <Dialog.Content style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 201, background: 'var(--bg-elev)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
            width: '460px', maxWidth: 'calc(100vw - 32px)', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <Dialog.Title style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Change Surface Type
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn btn-ghost btn-icon btn-sm"><X size={15} /></button>
              </Dialog.Close>
            </div>
            <Dialog.Description style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Changing the surface type will reset the layout, components, and context contract. This cannot be undone.
            </Dialog.Description>

            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label className="form-label">New Surface Type</label>
              <select
                className="form-select"
                value={pendingSurface ?? artifact.surfaceType}
                onChange={e => setPendingSurface(e.target.value as ViewSurfaceType)}
              >
                {SURFACE_OPTIONS.filter(s => s !== artifact.surfaceType).map(s => (
                  <option key={s} value={s}>{SURFACE_META[s].label}</option>
                ))}
              </select>
            </div>

            {pendingSurface && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', padding: '8px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)' }}>
                {SURFACE_META[pendingSurface].description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Dialog.Close asChild>
                <button className="btn btn-secondary">Cancel</button>
              </Dialog.Close>
              <button
                className="btn btn-danger"
                onClick={handleConfirmChange}
                disabled={!pendingSurface}
              >
                Reset &amp; Change
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
