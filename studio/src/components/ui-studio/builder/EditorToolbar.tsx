import { ArrowLeft, Save, Eye, AlertCircle, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ViewStatusBadge } from '../common/ViewStatusBadge'
import { SURFACE_META } from '../palette/surfaceMetadata'
import type { ViewArtifact } from '../../../types/ui-studio/index'

interface EditorToolbarProps {
  artifact: ViewArtifact
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onPreview: () => void
}

export function EditorToolbar({ artifact, isDirty, isSaving, onSave, onPreview }: EditorToolbarProps) {
  const navigate = useNavigate()
  const surfaceMeta = SURFACE_META[artifact.surfaceType]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '0 20px',
      height: '52px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elev)',
      flexShrink: 0,
    }}>
      <button
        className="btn btn-ghost btn-icon btn-sm"
        onClick={() => navigate('/admin/ui-studio')}
        title="Back to UI Studio"
      >
        <ArrowLeft size={15} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {artifact.label}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 500,
            padding: '1px 7px', borderRadius: '4px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            {surfaceMeta.label}
          </span>
          <ViewStatusBadge status={artifact.status} />
          {isDirty && (
            <span style={{ fontSize: '11.5px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertCircle size={11} />
              Unsaved changes
            </span>
          )}
          {!isDirty && artifact.status !== 'draft' && (
            <span style={{ fontSize: '11.5px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Check size={11} />
              Saved
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '1px' }}>
          {artifact.viewKey}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button className="btn btn-secondary btn-sm" onClick={onPreview}>
          <Eye size={13} /> Preview
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          <Save size={13} />
          {isSaving ? 'Saving…' : 'Save Draft'}
        </button>
      </div>
    </div>
  )
}
