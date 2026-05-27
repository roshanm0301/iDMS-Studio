import { Eye, PenLine } from 'lucide-react'
import { useUIStudioEditorStore } from '../../../hooks/ui-studio/useUIStudioEditorStore'

export function PreviewModeToggle() {
  const { previewMode, setPreviewMode } = useUIStudioEditorStore()

  return (
    <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-sunken)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
      <button
        className={`btn btn-xs ${!previewMode ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setPreviewMode(false)}
        type="button"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <PenLine size={11} />
        Builder
      </button>
      <button
        className={`btn btn-xs ${previewMode ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setPreviewMode(true)}
        type="button"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Eye size={11} />
        Preview
      </button>
    </div>
  )
}
